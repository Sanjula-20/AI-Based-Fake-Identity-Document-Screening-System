import React, { useState } from 'react';
import { Upload, FileCheck, ShieldAlert, Cpu, AlertCircle, Camera, Check } from 'lucide-react';

export default function ScreeningPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [docType, setDocType] = useState('AUTO');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Document Screening Workbench</h1>
        <p className="text-sm text-slate-400">
          Upload genuine or manipulated documents to run full anti-fraud pipeline screening.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="font-bold text-base text-slate-200 flex items-center space-x-2">
              <Upload className="w-5 h-5 text-blue-400" />
              <span>Document Upload</span>
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Target Document Specification
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="AUTO">Auto-Detect Document Classifier</option>
                <option value="PAN">PAN Card</option>
                <option value="PASSPORT">Passport</option>
                <option value="DRIVING_LICENSE">Driving Licence</option>
                <option value="AADHAAR">Aadhaar Test Document</option>
                <option value="COLLEGE_ID">College / University ID</option>
                <option value="EMPLOYEE_ID">Employee ID</option>
              </select>
            </div>

            {/* Dropzone */}
            <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-8 text-center bg-slate-900/40 transition flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {selectedFile ? selectedFile.name : 'Click or drop document image here'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Supports PNG, JPG, JPEG (Max 10MB)</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="doc-file-input"
              />
              <label
                htmlFor="doc-file-input"
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition"
              >
                Browse Files
              </label>
            </div>
          </div>
        </div>

        {/* Info Column */}
        <div className="space-y-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="font-bold text-sm text-slate-200 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>Analysis Pipeline Checklist</span>
            </h3>

            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Image Quality (Blur/Resolution)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Doc Type Classification</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>PaddleOCR Field Extraction</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Document Format Validation</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Deep Learning Tampering Model</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>OpenCV Forensic Noise & Edge</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>MRZ / QR Code Decoder</span>
              </div>
              <div className="flex items-center space-x-2">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>XGBoost Fraud Risk Engine</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
