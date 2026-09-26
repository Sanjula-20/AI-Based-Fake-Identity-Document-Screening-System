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
      { code: 'PAN', name: 'PAN Card (India)', description: 'Indian Permanent Account Number Card (Active Scope)', active: true }
    ]
  });
});

// POST /api/documents/upload
router.post(
  '/upload',
  protect,
  upload.fields([
    { name: 'document', maxCount: 1 },
    { name: 'referenceDocument', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]),
  async (req, res, next) => {
    try {
      if (!req.files || !req.files.document || req.files.document.length === 0) {
        return res.status(400).json({ success: false, message: 'No PAN card document file uploaded.' });
      }

      const docFile = req.files.document[0];
      const refFile = req.files.referenceDocument ? req.files.referenceDocument[0] : null;
      const selfieFile = req.files.selfie ? req.files.selfie[0] : null;

      // Magic Byte Validation
      const isDocMagicValid = validateMagicBytes(docFile.path);
      if (!isDocMagicValid) {
        fs.unlinkSync(docFile.path);
        if (refFile) fs.unlinkSync(refFile.path);
        if (selfieFile) fs.unlinkSync(selfieFile.path);
        return res.status(400).json({
          success: false,
          message: 'Security validation failed: File headers do not match genuine image/PDF magic bytes.'
        });
      }

      if (refFile && !validateMagicBytes(refFile.path)) {
        fs.unlinkSync(docFile.path);
        fs.unlinkSync(refFile.path);
        if (selfieFile) fs.unlinkSync(selfieFile.path);
        return res.status(400).json({
          success: false,
          message: 'Security validation failed: Reference PAN file header is corrupted or invalid.'
        });
      }

      if (selfieFile && !validateMagicBytes(selfieFile.path)) {
        fs.unlinkSync(docFile.path);
        if (refFile) fs.unlinkSync(refFile.path);
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

      if (refFile) {
        formData.append('referenceDocument', fs.createReadStream(refFile.path), {
          filename: refFile.filename,
          contentType: refFile.mimetype
        });
      }

      if (selfieFile) {
        formData.append('selfie', fs.createReadStream(selfieFile.path), {
          filename: selfieFile.filename,
          contentType: selfieFile.mimetype
        });
      }

      formData.append('selectedType', 'PAN');

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
          documentType: 'PAN',
          decision: 'UNVERIFIABLE',
          classification: 'UNVERIFIABLE',
          isCorrect: true,
          verdict: 'AI SERVICE UNREACHABLE — UNVERIFIABLE',
          documentTypeConfidence: 0.5,
          imageQuality: { usable: false, qualityScore: 0.5, issues: ['AI Service offline or unreachable'] },
          ocrResult: { extractedFields: {}, rawText: '', avgConfidence: 0 },
          formatValidation: { isValid: true, issues: ['Format validator offline'] },
          tampering: { prediction: 'UNABLE_TO_DETERMINE', genuineProbability: 0.5, tamperedProbability: 0.5 },
          fieldResults: {},
          riskScore: 25,
          riskStatus: 'UNVERIFIABLE',
          confidence: 0,
          reasons: ['AI microservice was unreachable during processing. Result marked UNVERIFIABLE (not fraud).']
        };
      }

      const isCorrect = aiResult.isCorrect !== undefined
        ? aiResult.isCorrect
        : (aiResult.decision !== 'TAMPERING DETECTED');
      const classification = aiResult.classification || (aiResult.decision === 'UNVERIFIABLE' ? 'UNVERIFIABLE' : (isCorrect ? 'CORRECT' : 'INCORRECT'));

      let basisOfClassification = aiResult.basisOfClassification;
      if (!basisOfClassification || !basisOfClassification.primaryBasis) {
        basisOfClassification = {
          classification,
          isCorrect,
          verdict: aiResult.verdict || 'NO OBVIOUS TAMPERING DETECTED',
          primaryBasis: isCorrect
            ? 'Document processed cleanly. Passed standard identity validation benchmarks or marked UNVERIFIABLE without fraud.'
            : ((aiResult.reasons || []).join(' | ') || 'Flagged based on specific physical tampering evidence.'),
          failedReasons: (aiResult.warnings || []).map(w => ({ category: 'Risk Engine', rule: 'Fraud Score', detail: w })),
          passedReasons: (aiResult.evidence || []).filter(e => e.startsWith('✓')),
          warnings: aiResult.warnings || []
        };
      }

      const recordPayload = {
        verificationId,
        user: req.user._id,
        originalFilename: docFile.originalname,
        storedFilename: docFile.filename,
        fileSize: docFile.size,
        mimeType: docFile.mimetype,
        hasSelfie: Boolean(selfieFile),
        selfieFilename: selfieFile ? selfieFile.filename : null,
        documentType: 'PAN',
        documentTypeConfidence: aiResult.documentTypeConfidence || 0.9,
        isCorrect,
        classification,
        verdict: aiResult.verdict || 'NO OBVIOUS TAMPERING DETECTED',
        basisOfClassification,
        imageQuality: aiResult.imageQuality || {},
        ocrResult: aiResult.ocrResult || {},
        formatValidation: aiResult.formatValidation || {},
        tampering: aiResult.tampering || {},
        fieldResults: aiResult.fieldResults || {},
        qrAnalysis: aiResult.qrAnalysis || {},
        fieldConsistency: aiResult.fieldConsistency || {},
        faceVerification: aiResult.faceVerification || {},
        liveness: aiResult.liveness || {},
        riskScore: aiResult.riskScore || 50,
        riskStatus: aiResult.riskStatus || 'MEDIUM_RISK',
        confidence: aiResult.confidence || 80,
        reasons: aiResult.reasons || [],
        individualChecks: aiResult.individualChecks || {}
      };

      let verificationRecord;
      try {
        if (mongoose.connection.readyState === 1) {
          verificationRecord = await Verification.create(recordPayload);
        } else {
          throw new Error('Database buffering — using direct response');
        }
      } catch (dbErr) {
        verificationRecord = {
          _id: `MEM-${Date.now()}`,
          ...recordPayload,
          createdAt: new Date().toISOString()
        };
      }

      memoryStore.set(verificationId, verificationRecord);
      if (verificationRecord._id) {
        memoryStore.set(verificationRecord._id.toString(), verificationRecord);
      }

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

// GET /api/documents/history
router.get('/history', protect, async (req, res, next) => {
  try {
    let verifications = [];
    if (mongoose.connection.readyState === 1) {
      verifications = await Verification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .select('-storedFilename -selfieFilename');
    }

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

const findVerificationHelper = async (id) => {
  if (!id) return null;
  let verification = memoryStore.get(id);
  if (verification) return verification;

  for (const record of memoryStore.values()) {
    if (record && (record.verificationId === id || (record._id && record._id.toString() === id))) {
      return record;
    }
  }

  if (mongoose.connection.readyState === 1) {
    try {
      const isObjectId = typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
      const query = isObjectId
        ? { $or: [{ _id: id }, { verificationId: id }] }
        : { verificationId: id };

      verification = await Verification.findOne(query);
    } catch (e) {}
  }

  return verification;
};

// GET /api/documents/:id
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

// GET /api/documents/:id/file
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

// DELETE /api/documents/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const verification = await findVerificationHelper(req.params.id);

    if (!verification) {
      return res.status(404).json({ success: false, message: 'Verification record not found' });
    }

    memoryStore.delete(req.params.id);
    if (verification.verificationId) memoryStore.delete(verification.verificationId);
    if (verification._id) memoryStore.delete(verification._id.toString());

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
