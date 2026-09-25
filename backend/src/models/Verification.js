const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  verificationId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  originalFilename: {
    type: String,
    required: true
  },
  storedFilename: {
    type: String,
    required: true
  },
  fileSize: Number,
  mimeType: String,
  hasSelfie: {
    type: Boolean,
    default: false
  },
  selfieFilename: String,
  
  // Screening Results
  documentType: {
    type: String,
    default: 'UNKNOWN'
  },
  documentTypeConfidence: {
    type: Number,
    default: 0
  },
  imageQuality: {
    usable: Boolean,
    qualityScore: Number,
    issues: [String]
  },
  ocrResult: {
    extractedFields: Object,
    rawText: String,
    avgConfidence: Number
  },
  formatValidation: {
    isValid: Boolean,
    issues: [String]
  },
  tampering: {
    prediction: String,
    genuineProbability: Number,
    tamperedProbability: Number,
    forensicSignals: Object,
    suspiciousRegions: Array
  },
  qrAnalysis: {
    detected: Boolean,
    matchStatus: String,
    decodedData: Object
  },
  mrzAnalysis: {
    detected: Boolean,
    matchStatus: String,
    parsedMrz: Object
  },
  fieldConsistency: {
    status: String,
    details: Array
  },
  faceVerification: {
    attempted: Boolean,
    similarityScore: Number,
    matchStatus: String
  },
  liveness: {
    status: String,
    details: String
  },
  
  // Aggregate Risk Engine Output
  riskScore: {
    type: Number,
    required: true
  },
  riskStatus: {
    type: String,
    enum: ['LOW_RISK', 'REVIEW_REQUIRED', 'HIGH_RISK', 'UNABLE_TO_DETERMINE'],
    required: true
  },
  confidence: Number,
  reasons: [String],
  individualChecks: Object,
  
  // Model Metadata
  modelName: {
    type: String,
    default: 'ResNet-TamperDet-v1.0'
  },
  modelVersion: {
    type: String,
    default: '1.0.0'
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Verification', verificationSchema);
