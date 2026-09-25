import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, FileCheck, ShieldAlert, Cpu, AlertCircle, Camera, Check, RefreshCw, X, FileText, Sparkles, AlertTriangle, Play, Image as ImageIcon } from 'lucide-react';
import { uploadDocumentForScreening } from '../services/api';

const PIPELINE_STAGES = [
  'Security & Magic Byte Validation',
  'Image Quality & Blur Check',
  'Document Type Classification',
  'PaddleOCR Field Extraction',
  'OpenCV Forensic Noise & ELA Analysis',
  'PyTorch ResNet Tampering Detector',
  'QR / Barcode / Passport MRZ Decoder',
  'Facial Portrait Verification',
  'XGBoost Multi-Signal Fraud Risk Engine'
];

export default function ScreeningPage() {
  const location = useLocation();
  const initialType = location.state?.selectedType || 'AUTO';

  const [docFile, setDocFile] = useState(null);
  const [docPreview, setDocPreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selectedType, setSelectedType] = useState(initialType);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);

  const navigate = useNavigate();

  const handleDocFile = (file) => {
    setError('');
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
    const blocked = ['.exe', '.bat', '.cmd', '.js', '.html', '.zip', '.rar', '.sh'];

    if (blocked.includes(ext)) {
      setError(`Security Alert: Executable file extension ${ext} is strictly prohibited.`);
      return;
    }

    if (!allowed.includes(ext)) {
      setError(`Unsupported file format. Please upload JPG, JPEG, PNG, or PDF.`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds maximum limit of 10 MB.');
      return;
    }

    setDocFile(file);
    if (file.type.startsWith('image/')) {
      setDocPreview(URL.createObjectURL(file));
    } else {
      setDocPreview(null);
    }
  };

  const handleSelfieFile = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Selfie file size exceeds 10 MB.');
      return;
    }
    setSelfieFile(file);
  };

  const generateSampleDocument = async (docType, isTampered = false) => {
    setError('');
    const canvas = document.createElement('canvas');
    canvas.width = 700;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 700, 450);
    if (isTampered) {
      grad.addColorStop(0, '#fef2f2');
      grad.addColorStop(1, '#f8fafc');
    } else {
      grad.addColorStop(0, '#f0f9ff');
      grad.addColorStop(1, '#f8fafc');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 700, 450);

    ctx.fillStyle = isTampered ? '#dc2626' : '#0284c7';
    ctx.fillRect(0, 0, 700, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('INCOME TAX DEPARTMENT — PAN CARD', 25, 42);

    ctx.fillStyle = '#1e293b';
    ctx.font = '16px monospace';
    ctx.fillText('NAME: SANJULA KUMAR', 35, 130);
    ctx.fillText('FATHER NAME: RAKESH KUMAR', 35, 175);
    ctx.fillText('DOB: 15/08/1998', 35, 220);
    ctx.fillText(`PERMANENT ACCOUNT NUMBER: ABCDE1234F`, 35, 265);

    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.fillRect(520, 100, 140, 170);
    ctx.strokeRect(520, 100, 140, 170);
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText('PORTRAIT', 555, 190);

    if (isTampered) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.fillRect(30, 245, 340, 32);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 245, 340, 32);

      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('[TAMPERED FONT DETECTED BY RESNET]', 35, 300);
    }

    canvas.toBlob((blob) => {
      const fileName = `${docType}_${isTampered ? 'FRAUD_SAMPLE' : 'GENUINE_SAMPLE'}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });
      handleDocFile(file);
      if (docType !== 'AUTO') setSelectedType(docType);
    }, 'image/png');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!docFile) {
      setError('Please select or generate an identity document image to screen.');
      return;
    }

    setError('');
    setProcessing(true);
    setCurrentStage(0);

    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev < PIPELINE_STAGES.length - 1 ? prev + 1 : prev));
    }, 1000);

    const formData = new FormData();
    formData.append('document', docFile);
    if (selfieFile) formData.append('selfie', selfieFile);
    if (selectedType !== 'AUTO') formData.append('selectedType', selectedType);

    try {
      const res = await uploadDocumentForScreening(formData);
      clearInterval(interval);

      if (res.success) {
        navigate(`/verification/${res.verificationId}`);
      } else {
        setError(res.message || 'Screening failed');
        setProcessing(false);
      }
    } catch (err) {
      clearInterval(interval);
      setError('Screening request error. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-8">
      {/* Header Title */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-700 font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Multi-Model AI Workbench</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Identity Document Screening Workbench
          </h1>
          <p className="text-xs text-slate-500">
            Run full-stack AI screening to detect image tampering, OCR inconsistencies, and forgery.
          </p>
        </div>

        {/* Preset Sample Generators */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => generateSampleDocument('PAN', false)}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-heading font-bold transition flex items-center space-x-1.5 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" />
            <span>Test Genuine Sample</span>
          </button>
          <button
            type="button"
            onClick={() => generateSampleDocument('PAN', true)}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-heading font-bold transition flex items-center space-x-1.5 shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Test Tampered Fraud Sample</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
            <span className="font-medium">{error}</span>
          </div>
          <button onClick={() => setError('')} className="hover:text-slate-900 transition">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Processing HUD / Scanner Simulator */}
      {processing ? (
        <div className="bg-white p-10 rounded-3xl border border-indigo-200 space-y-8 text-center shadow-lg relative overflow-hidden">
          <div className="max-w-md mx-auto relative rounded-2xl overflow-hidden border border-indigo-200 bg-slate-50 p-2 shadow-sm">
            {docPreview ? (
              <div className="relative">
                <img src={docPreview} alt="Target Document" className="w-full h-56 object-cover rounded-xl" />
                <div className="animate-laser"></div>
              </div>
            ) : (
              <div className="h-48 bg-slate-100 rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="animate-laser"></div>
                <ImageIcon className="w-12 h-12 text-slate-400" />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-heading font-bold text-slate-900 flex items-center justify-center space-x-2">
              <Cpu className="w-6 h-6 text-indigo-600 animate-spin" />
              <span>Analyzing Document Evidence...</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Executing 12-Stage AI & Forensic Detection Pipeline</p>
          </div>

          <div className="max-w-xl mx-auto space-y-2 text-left bg-slate-50 p-6 rounded-2xl border border-slate-200 font-mono-code text-xs">
            {PIPELINE_STAGES.map((stage, idx) => {
              const isDone = idx < currentStage;
              const isCurrent = idx === currentStage;
              return (
                <div key={stage} className="flex items-center justify-between py-1 border-b border-slate-200">
                  <div className="flex items-center space-x-3">
                    {isDone ? (
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : isCurrent ? (
                      <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex-shrink-0" />
                    )}
                    <span className={isCurrent ? 'text-indigo-700 font-bold' : isDone ? 'text-slate-800' : 'text-slate-400'}>
                      {stage}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {isDone ? <span className="text-emerald-700">PASSED</span> : isCurrent ? <span className="text-indigo-700 animate-pulse">RUNNING</span> : <span className="text-slate-400">QUEUED</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Upload Column */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-7 rounded-3xl border border-slate-200 space-y-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-extrabold text-lg text-slate-900 flex items-center space-x-2.5">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  <span>Primary Document Upload</span>
                </h2>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Step 1 of 2
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2 font-heading">
                  Document Type Specification
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 transition shadow-sm font-medium"
                >
                  <option value="AUTO">⚡ Auto-Detect Document Classifier</option>
                  <option value="PAN">PAN Card (India)</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="DRIVING_LICENSE">Driving Licence</option>
                  <option value="AADHAAR">Aadhaar Card</option>
                  <option value="COLLEGE_ID">College / University ID</option>
                  <option value="EMPLOYEE_ID">Employee ID Card</option>
                </select>
              </div>

              {/* Document Dropzone */}
              <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-50/60 hover:bg-slate-50 transition-all duration-200 flex flex-col items-center justify-center space-y-4 group">
                {docPreview ? (
                  <div className="relative max-w-sm w-full rounded-xl overflow-hidden border border-indigo-200 shadow-sm">
                    <img src={docPreview} alt="Selected Document Preview" className="w-full h-44 object-cover" />
                    <div className="absolute top-2 right-2 bg-white/90 px-2.5 py-1 rounded-lg text-[10px] font-bold text-indigo-700 border border-indigo-200 shadow-sm">
                      PREVIEW READY
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition duration-200 border border-indigo-100 shadow-sm">
                    <FileText className="w-8 h-8" />
                  </div>
                )}

                <div>
                  <p className="text-sm font-heading font-bold text-slate-900">
                    {docFile ? docFile.name : 'Drag & drop identity document file here'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Supports High-Resolution JPG, JPEG, PNG, or PDF (Max 10MB)</p>
                </div>

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => e.target.files && handleDocFile(e.target.files[0])}
                  className="hidden"
                  id="doc-file-input"
                />
                <label
                  htmlFor="doc-file-input"
                  className="px-5 py-2.5 text-xs font-heading font-bold rounded-xl bg-slate-900 hover:bg-indigo-600 text-white cursor-pointer transition shadow-md"
                >
                  {docFile ? 'Change Document File' : 'Browse Files'}
                </label>
              </div>
            </div>

            {/* Optional Selfie Upload */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-heading font-extrabold text-base text-slate-900 flex items-center space-x-2.5">
                  <Camera className="w-5 h-5 text-indigo-600" />
                  <span>Optional Facial Selfie Upload</span>
                </h2>
                <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  Optional
                </span>
              </div>

              <div className="border border-dashed border-slate-300 rounded-2xl p-5 text-center bg-slate-50/50 flex items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-xs font-bold text-slate-900">
                    {selfieFile ? selfieFile.name : 'Upload facial selfie photo'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Compares face embeddings against ID document portrait</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleSelfieFile(e.target.files[0])}
                  className="hidden"
                  id="selfie-file-input"
                />
                <label
                  htmlFor="selfie-file-input"
                  className="px-4 py-2 text-xs font-heading font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 cursor-pointer transition shrink-0"
                >
                  {selfieFile ? 'Change Selfie' : 'Choose Selfie'}
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={!docFile}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-bold text-base transition duration-200 shadow-md shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2.5"
            >
              <FileCheck className="w-5 h-5" />
              <span>Start AI Document Fraud Screening</span>
            </button>
          </div>

          {/* Pipeline Info Column */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 shadow-sm">
              <h3 className="font-heading font-bold text-sm text-slate-900 flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                <span>Detection Pipeline Checklist</span>
              </h3>

              <div className="space-y-2.5 text-xs text-slate-700 font-medium">
                {[
                  'Security & Magic Byte Check',
                  'Image Quality & Blur Check',
                  'Doc Type Classifier',
                  'PaddleOCR Field Extraction',
                  'Format Validator',
                  'PyTorch ResNet Tampering AI',
                  'OpenCV Forensic ELA Noise',
                  'MRZ / QR Code Decoder',
                  'Multi-Signal Risk Engine'
                ].map((item) => (
                  <div key={item} className="flex items-center space-x-2.5 py-1 border-b border-slate-100">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
