const express = require('express');
const router = express.Router();

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

router.post('/screen', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Document screening endpoint ready. Detailed analysis pipeline enabled in subsequent phases.'
  });
});

module.exports = router;
