const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const FormData = require('form-data');
const Verification = require('../models/Verification');
const AuditLog = require('../models/AuditLog');
const { protect } = require('../middleware/authMiddleware');
const { upload, UPLOADS_DIR, validateMagicBytes } = require('../middleware/uploadSecurityMiddleware');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const mongoose = require('mongoose');

// In-Memory Report Cache for instant zero-latency rendering & fallback
const memoryStore = new Map();

// Supported document types list
router.get('/supported-types', (req, res) => {
  res.status(200).json({
    success: true,
    supportedTypes: [
      { code: 'PAN', name: 'PAN Card (India)', description: 'Permanent Account Number Card' },
      { code: 'PASSPORT', name: 'Passport', description: 'International Travel Passport' },
      { code: 'DRIVING_LICENSE', name: 'Driving Licence', description: 'Motor Vehicle Driving Licence' },
      { code: 'AADHAAR', name: 'Aadhaar Card', description: 'UIDAI Aadhaar Identity Document' },
      { code: 'COLLEGE_ID', name: 'College / University ID', description: 'Educational Institution Student ID' },
      { code: 'EMPLOYEE_ID', name: 'Employee ID Card', description: 'Corporate / Workplace Identity Card' }
    ]
  });
});

// POST /api/documents/upload
router.post(
  '/upload',
  protect,
  upload.fields([
    { name: 'document', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]),
  async (req, res, next) => {
    try {
      if (!req.files || !req.files.document || req.files.document.length === 0) {
        return res.status(400).json({ success: false, message: 'No document file uploaded.' });
      }

      const docFile = req.files.document[0];
      const selfieFile = req.files.selfie ? req.files.selfie[0] : null;

      // Magic Byte Validation
      const isDocMagicValid = validateMagicBytes(docFile.path);
      if (!isDocMagicValid) {
        // Remove corrupted file
        fs.unlinkSync(docFile.path);
        if (selfieFile) fs.unlinkSync(selfieFile.path);
        return res.status(400).json({
          success: false,
          message: 'Security validation failed: File headers do not match genuine image/PDF magic bytes.'
        });
      }

      if (selfieFile && !validateMagicBytes(selfieFile.path)) {
        fs.unlinkSync(docFile.path);
        fs.unlinkSync(selfieFile.path);
        return res.status(400).json({
          success: false,
          message: 'Security validation failed: Selfie file header is corrupted or invalid.'
        });
      }

      const verificationId = `VER-${Date.now()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      // Build Multipart payload for AI Service FastAPI /analyze
      const formData = new FormData();
      formData.append('document', fs.createReadStream(docFile.path), {
        filename: docFile.filename,
        contentType: docFile.mimetype
      });

      if (selfieFile) {
        formData.append('selfie', fs.createReadStream(selfieFile.path), {
          filename: selfieFile.filename,
          contentType: selfieFile.mimetype
        });
      }

      if (req.body.selectedType) {
        formData.append('selectedType', req.body.selectedType);
      }

      let aiResult;
      try {
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/analyze`, formData, {
          headers: { ...formData.getHeaders() },
          timeout: 45000
        });
        aiResult = aiResponse.data;
      } catch (aiErr) {
        console.error('AI Service Error:', aiErr.message);
        aiResult = {
          documentType: req.body.selectedType || 'UNKNOWN',
          documentTypeConfidence: 0.5,
          imageQuality: { usable: true, qualityScore: 0.8, issues: ['AI Service fallback alert'] },
          ocrResult: { extractedFields: {}, rawText: '', avgConfidence: 0 },
          formatValidation: { isValid: false, issues: ['Format validator offline'] },
          tampering: {
            prediction: 'UNABLE_TO_DETERMINE',
            genuineProbability: 0.5,
            tamperedProbability: 0.5,
            forensicSignals: { alert: 'Tampering model unavailable — manual verification required' },
            suspiciousRegions: []
          },
          qrAnalysis: { detected: false, matchStatus: 'NOT_AVAILABLE' },
          mrzAnalysis: { detected: false, matchStatus: 'NOT_AVAILABLE' },
          fieldConsistency: { status: 'UNKNOWN', details: ['AI service connection failed'] },
          faceVerification: { attempted: Boolean(selfieFile), similarityScore: 0, matchStatus: 'NOT_AVAILABLE' },
          liveness: { status: 'NOT_AVAILABLE', details: 'Liveness verification unavailable' },
          riskScore: 50,
          riskStatus: 'REVIEW_REQUIRED',
          confidence: 0.5,
          reasons: ['AI microservice was unreachable during processing. Manual review mandated.']
        };
      }

      // Save Verification in MongoDB with fallback
      let verificationRecord;
      try {
        if (mongoose.connection.readyState === 1) {
          verificationRecord = await Verification.create({
            verificationId,
            user: req.user._id,
            originalFilename: docFile.originalname,
            storedFilename: docFile.filename,
            fileSize: docFile.size,
            mimeType: docFile.mimetype,
            hasSelfie: Boolean(selfieFile),
            selfieFilename: selfieFile ? selfieFile.filename : null,
            documentType: aiResult.documentType || 'UNKNOWN',
            documentTypeConfidence: aiResult.documentTypeConfidence || 0,
            imageQuality: aiResult.imageQuality || {},
            ocrResult: aiResult.ocrResult || {},
            formatValidation: aiResult.formatValidation || {},
            tampering: aiResult.tampering || {},
            qrAnalysis: aiResult.qrAnalysis || {},
            mrzAnalysis: aiResult.mrzAnalysis || {},
            fieldConsistency: aiResult.fieldConsistency || {},
            faceVerification: aiResult.faceVerification || {},
            liveness: aiResult.liveness || {},
            riskScore: aiResult.riskScore || 50,
            riskStatus: aiResult.riskStatus || 'REVIEW_REQUIRED',
            confidence: aiResult.confidence || 0.5,
            reasons: aiResult.reasons || [],
            individualChecks: aiResult.individualChecks || {}
          });
        } else {
          throw new Error('Database buffering — using direct response');
        }
      } catch (dbErr) {
        verificationRecord = {
          _id: `MEM-${Date.now()}`,
          verificationId,
          user: req.user._id,
          originalFilename: docFile.originalname,
          storedFilename: docFile.filename,
          fileSize: docFile.size,
          mimeType: docFile.mimetype,
          hasSelfie: Boolean(selfieFile),
          selfieFilename: selfieFile ? selfieFile.filename : null,
          documentType: aiResult.documentType || 'UNKNOWN',
          documentTypeConfidence: aiResult.documentTypeConfidence || 0,
          imageQuality: aiResult.imageQuality || {},
          ocrResult: aiResult.ocrResult || {},
          formatValidation: aiResult.formatValidation || {},
          tampering: aiResult.tampering || {},
          qrAnalysis: aiResult.qrAnalysis || {},
          mrzAnalysis: aiResult.mrzAnalysis || {},
          fieldConsistency: aiResult.fieldConsistency || {},
          faceVerification: aiResult.faceVerification || {},
          liveness: aiResult.liveness || {},
          riskScore: aiResult.riskScore || 50,
          riskStatus: aiResult.riskStatus || 'REVIEW_REQUIRED',
          confidence: aiResult.confidence || 0.5,
          reasons: aiResult.reasons || [],
          individualChecks: aiResult.individualChecks || {},
          createdAt: new Date().toISOString()
        };
      }

      // Save to in-memory cache for instant zero-latency lookup
      memoryStore.set(verificationId, verificationRecord);
      if (verificationRecord._id) {
        memoryStore.set(verificationRecord._id.toString(), verificationRecord);
      }

      // Audit Log (silent catch)
      try {
        if (mongoose.connection.readyState === 1) {
          await AuditLog.create({
            user: req.user._id,
            action: 'DOCUMENT_SCREENING_SUBMITTED',
            verificationId,
            details: `Screening completed for ${docFile.originalname} with result ${aiResult.riskStatus}`
          });
        }
      } catch (auditErr) {}

      res.status(201).json({
        success: true,
        verificationId,
        report: verificationRecord
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/documents/history (User specific history)
router.get('/history', protect, async (req, res, next) => {
  try {
    let verifications = [];
    if (mongoose.connection.readyState === 1) {
      verifications = await Verification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .select('-storedFilename -selfieFilename');
    }

    // Merge memory records if DB is empty or disconnected
    const memoryItems = Array.from(memoryStore.values()).filter((v, idx, self) => 
      self.findIndex(t => t.verificationId === v.verificationId) === idx
    );

    const merged = [...verifications, ...memoryItems].filter((v, idx, self) =>
      self.findIndex(t => t.verificationId === v.verificationId) === idx
    );

    res.status(200).json({
      success: true,
      count: merged.length,
      verifications: merged
    });
  } catch (error) {
    next(error);
  }
});

// Helper for safe verification lookup across memory cache & MongoDB
const findVerificationHelper = async (id) => {
  if (!id) return null;

  // 1. Direct key lookup in memory store
  let verification = memoryStore.get(id);
  if (verification) return verification;

  // 2. Scan memory store values by verificationId or _id string
  for (const record of memoryStore.values()) {
    if (record && (record.verificationId === id || (record._id && record._id.toString() === id))) {
      return record;
    }
  }

  // 3. Query MongoDB safely
  if (mongoose.connection.readyState === 1) {
    try {
      // Hex 24 character check for genuine Mongo ObjectIds ONLY (no hyphens, no non-hex letters like V or R)
      const isObjectId = typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

      const query = isObjectId
        ? { $or: [{ _id: id }, { verificationId: id }] }
        : { verificationId: id };

      verification = await Verification.findOne(query);
    } catch (e) {
      console.error('[Verification Lookup Warning]:', e.message);
    }
  }

  return verification;
};

// GET /api/documents/:id (Fetch single report)
router.get('/:id', protect, async (req, res, next) => {
  try {
    const verification = await findVerificationHelper(req.params.id);

    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification record not found' });
    }

    res.status(200).json({
      success: true,
      verification
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/documents/:id/file (Secure authenticated file stream)
router.get('/:id/file', protect, async (req, res, next) => {
  try {
    const verification = await findVerificationHelper(req.params.id);

    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification record not found' });
    }

    const type = req.query.type || 'document';
    const filename = type === 'selfie' ? verification.selfieFilename : verification.storedFilename;

    if (!filename) {
      return res.status(404).json({ success: false, message: 'Requested file does not exist' });
    }

    const filePath = path.join(UPLOADS_DIR, filename);

    // Anti-path-traversal check
    if (!filePath.startsWith(UPLOADS_DIR)) {
      return res.status(400).json({ success: false, message: 'Invalid file path' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Physical file not found on disk' });
    }

    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/documents/:id (Authorized deletion)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const verification = await findVerificationHelper(req.params.id);

    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification record not found' });
    }

    memoryStore.delete(req.params.id);
    if (verification.verificationId) memoryStore.delete(verification.verificationId);
    if (verification._id) memoryStore.delete(verification._id.toString());

    // Delete physical files
    if (verification.storedFilename) {
      const docPath = path.join(UPLOADS_DIR, verification.storedFilename);
      if (fs.existsSync(docPath)) fs.unlinkSync(docPath);
    }
    if (verification.selfieFilename) {
      const selfiePath = path.join(UPLOADS_DIR, verification.selfieFilename);
      if (fs.existsSync(selfiePath)) fs.unlinkSync(selfiePath);
    }

    if (mongoose.connection.readyState === 1 && typeof verification.deleteOne === 'function') {
      try {
        await verification.deleteOne();
      } catch (e) {}
    }

    res.status(200).json({
      success: true,
      message: 'Verification record and associated files deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
