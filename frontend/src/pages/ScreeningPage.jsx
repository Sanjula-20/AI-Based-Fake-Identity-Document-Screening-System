import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileCheck, Cpu, AlertCircle, Camera, Check, RefreshCw, X, FileText, Sparkles, AlertTriangle, Play, Image as ImageIcon, ShieldCheck, GitCompare } from 'lucide-react';
import { uploadDocumentForScreening } from '../services/api';

const PIPELINE_STAGES = [
  'Security & File Header Validation',
  'PAN Document Structure & Emblem Detector',
  'PaddleOCR Field & Bounding Box Extractor',
  'PAN Regex & 4th/5th Character Verifier',
  'Photo Replacement & Edge Blending Analyzer',
  'Signature Stroke & Region Tampering Checker',
  'OpenCV Error Level Analysis (ELA)',
  'Fast Fourier Transform (FFT) AI Detector',
  'Secure QR Code Payload & Cross-Field Matching',
  'Authoritative Database & Reference Comparator',
  'Evidence-Based Fraud Risk Decision Engine'
];

export default function ScreeningPage() {
  const [docFile, setDocFile] = useState(null);
  const [docPreview, setDocPreview] = useState(null);
  const [refFile, setRefFile] = useState(null);
  const [refPreview, setRefPreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
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
      setError(`Security Alert: Executable file type ${ext} is blocked.`);
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

  const handleRefFile = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Reference file size exceeds 10 MB.');
      return;
    }
    setRefFile(file);
    if (file.type.startsWith('image/')) {
      setRefPreview(URL.createObjectURL(file));
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

  const generatePANCardSample = async (isTampered = false, isReferenceMode = false) => {
    setError('');
    const canvas = document.createElement('canvas');
    canvas.width = 750;
    canvas.height = 470;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 750, 470);
    grad.addColorStop(0, isTampered ? '#fff5f5' : '#f0fdf4');
    grad.addColorStop(1, '#f8fafc');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 750, 470);

    ctx.fillStyle = isTampered ? '#b91c1c' : '#1e3a8a';
    ctx.fillRect(0, 0, 750, 75);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('INCOME TAX DEPARTMENT', 30, 42);

    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('GOVT. OF INDIA  |  आयकर विभाग, भारत सरकार', 30, 62);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('NAME:', 35, 125);
    ctx.font = 'bold 17px monospace';
    ctx.fillText(isTampered ? 'XYZ CITIZEN' : 'SANJULA SHARMA', 35, 148);

    ctx.font = 'bold 15px monospace';
    ctx.fillText('FATHER NAME:', 35, 195);
    ctx.font = 'bold 17px monospace';
    ctx.fillText('RAKESH SHARMA', 35, 218);

    ctx.font = 'bold 15px monospace';
    ctx.fillText('DATE OF BIRTH:', 35, 265);
    ctx.font = 'bold 17px monospace';
    ctx.fillText('15/08/1996', 35, 288);

    ctx.fillStyle = isTampered ? '#dc2626' : '#1e3a8a';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('PERMANENT ACCOUNT NUMBER:', 35, 340);
    
    ctx.font = 'bold 24px monospace';
    const panNo = isTampered ? 'XYZ9999999' : 'ABCPB1234F';
    ctx.fillText(panNo, 35, 375);

    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = isTampered ? '#dc2626' : '#1e3a8a';
    ctx.lineWidth = 2;
    ctx.fillRect(560, 110, 150, 180);
    ctx.strokeRect(560, 110, 150, 180);
    ctx.fillStyle = '#475569';
    ctx.font = '12px sans-serif';
    ctx.fillText('PHOTO PORTRAIT', 580, 205);

    ctx.fillStyle = '#334155';
    ctx.fillRect(570, 310, 130, 120);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px monospace';
    ctx.fillText('SECURE QR CODE', 585, 375);

    canvas.toBlob((blob) => {
      const fileName = `PAN_CARD_${isTampered ? 'TAMPERED_CANDIDATE' : 'GENUINE_ORIGINAL'}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });
      
      if (isReferenceMode) {
        setRefFile(file);
        setRefPreview(URL.createObjectURL(file));
      } else {
        handleDocFile(file);
      }
    }, 'image/png');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!docFile) {
      setError('Please upload or generate a PAN card image to screen.');
      return;
    }

    setError('');
    setProcessing(true);
    setCurrentStage(0);

    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev < PIPELINE_STAGES.length - 1 ? prev + 1 : prev));
    }, 700);

    const formData = new FormData();
    formData.append('document', docFile);
    if (refFile) formData.append('referenceDocument', refFile);
    if (selfieFile) formData.append('selfie', selfieFile);
    formData.append('selectedType', 'PAN');

    try {
      const res = await uploadDocumentForScreening(formData);
      clearInterval(interval);

      if (res.success) {
        navigate(`/verification/${res.verificationId}`);
      } else {
        setError(res.message || 'PAN Card Screening failed');
        setProcessing(false);
      }
    } catch (err) {
      clearInterval(interval);
      setError('Screening request error. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-700 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dedicated Indian PAN Card Fraud Screening</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            PAN Card Screening Workbench
          </h1>
          <p className="text-xs text-slate-500">
            Supports ONLY Indian PAN Cards. Analyzes PAN structure, text tampering, photo replacement, signature manipulation, and QR decoding.
          </p>
        </div>

        {/* Quick Test Generators */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => generatePANCardSample(false, false)}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-heading font-bold transition flex items-center space-x-1.5 shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
            <span>Genuine PAN</span>
          </button>
          <button
            type="button"
            onClick={() => generatePANCardSample(true, false)}
            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-heading font-bold transition flex items-center space-x-1.5 shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>Tampered PAN</span>
          </button>
          <button
            type="button"
            onClick={() => {
              generatePANCardSample(true, false);
              generatePANCardSample(false, true);
            }}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-heading font-bold transition flex items-center space-x-1.5 shadow-sm"
          >
            <GitCompare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dual Ref Comparison</span>
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

      {/* Processing HUD */}
      {processing ? (
        <div className="bg-white p-10 rounded-3xl border border-indigo-200 space-y-8 text-center shadow-lg relative overflow-hidden">
          <div className="max-w-md mx-auto relative rounded-2xl overflow-hidden border border-indigo-200 bg-slate-50 p-2 shadow-sm">
            {docPreview ? (
              <div className="relative">
                <img src={docPreview} alt="Target PAN Document" className="w-full h-56 object-cover rounded-xl" />
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
              <span>Analyzing Indian PAN Card...</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Verifying layout, photo replacement, signature strokes, text tampering, and QR payload</p>
          </div>

          <div className="max-w-xl mx-auto space-y-2 text-left bg-slate-50 p-6 rounded-2xl border border-slate-200 font-mono-code text-xs">
            {PIPELINE_STAGES.map((stage, idx) => {
              const isDone = idx < currentStage;
              const isCurrent = idx === currentStage;
              return (
                <div key={stage} className="flex items-center justify-between py-1.5 border-b border-slate-200">
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="font-heading font-extrabold text-lg text-slate-900 flex items-center space-x-2.5">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  <span>Upload Primary PAN Card Image</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Primary target PAN image for visual & digital tampering analysis.</p>
              </div>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono-code">
                SCOPE: INDIAN PAN CARD ONLY
              </span>
            </div>

            {/* Candidate Dropzone */}
            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-50/60 hover:bg-slate-50 transition-all duration-200 flex flex-col items-center justify-center space-y-4 group">
              {docPreview ? (
                <div className="relative max-w-md w-full rounded-xl overflow-hidden border border-indigo-200 shadow-sm">
                  <img src={docPreview} alt="Target PAN Document Preview" className="w-full h-52 object-cover" />
                  <div className="absolute top-2 right-2 bg-white/95 px-2.5 py-1 rounded-lg text-[10px] font-bold text-indigo-700 border border-indigo-200 shadow-sm">
                    PRIMARY TARGET PAN
                  </div>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition duration-200 border border-indigo-100 shadow-sm">
                  <FileText className="w-8 h-8" />
                </div>
              )}

              <div>
                <p className="text-sm font-heading font-bold text-slate-900">
                  {docFile ? docFile.name : 'Drag & drop PAN card image file here'}
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
                className="px-6 py-2.5 text-xs font-heading font-bold rounded-xl bg-slate-900 hover:bg-indigo-600 text-white cursor-pointer transition shadow-md"
              >
                {docFile ? 'Change Primary PAN File' : 'Browse Primary PAN Card Image'}
              </label>
            </div>

            {/* Optional Reference Image Upload */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-xs text-slate-900 flex items-center space-x-2">
                  <GitCompare className="w-4 h-4 text-indigo-600" />
                  <span>Optional Original Reference PAN Image (Direct 1-to-1 Comparison)</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">OPTIONAL REF</span>
              </div>

              <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800">
                    {refFile ? refFile.name : 'Upload trusted original reference PAN (Optional)'}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Performs direct document-to-document difference comparison for Photo, Name, PAN Number, DOB, and Signature.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {refPreview && (
                    <img src={refPreview} alt="Reference PAN" className="w-12 h-12 object-cover rounded-lg border border-indigo-200" />
                  )}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => e.target.files && handleRefFile(e.target.files[0])}
                    className="hidden"
                    id="ref-file-input"
                  />
                  <label
                    htmlFor="ref-file-input"
                    className="px-3.5 py-1.5 text-xs font-heading font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 cursor-pointer transition shrink-0"
                  >
                    {refFile ? 'Change Reference PAN' : 'Choose Reference PAN'}
                  </label>
                </div>
              </div>
            </div>

            {/* Optional Selfie Upload */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-xs text-slate-900 flex items-center space-x-2">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>Optional Selfie Verification</span>
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">OPTIONAL</span>
              </div>

              <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {selfieFile ? selfieFile.name : 'Upload selfie photo (Optional)'}
                  </p>
                  <p className="text-[11px] text-slate-500">Cross-checks selfie portrait against PAN photo</p>
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
                  className="px-3.5 py-1.5 text-xs font-heading font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 cursor-pointer transition shrink-0"
                >
                  {selfieFile ? 'Change Selfie' : 'Choose Selfie'}
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={!docFile}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-heading font-bold text-base transition duration-200 shadow-md shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2.5"
          >
            <FileCheck className="w-5 h-5" />
            <span>Screen PAN Card & Verify Authenticity</span>
          </button>
        </form>
      )}
    </div>
  );
}
