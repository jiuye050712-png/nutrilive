import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, SwitchCamera, Check, X, ImagePlus } from 'lucide-react';

function compressImageDataUrl(dataUrl, maxWidth = 800, quality = 0.72) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export default function MealCamera({ photo, onPhotoChange, compact = false }) {
  const webcamRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const [camError, setCamError] = useState('');

  const captureMealPhoto = useCallback(async () => {
    if (!webcamRef.current) return;
    const rawSrc = webcamRef.current.getScreenshot();
    if (rawSrc) {
      const compressed = await compressImageDataUrl(rawSrc);
      onPhotoChange(compressed);
      setIsOpen(false);
    }
  }, [onPhotoChange]);

  const handleFallbackUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImageDataUrl(reader.result);
      onPhotoChange(compressed);
    };
    reader.readAsDataURL(file);
  };

  if (isOpen) {
    return (
      <div className="rounded-xl bg-slate-950 border border-amber-500/40 p-2.5 space-y-2">
        <div className="relative overflow-hidden rounded-lg bg-black">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.85}
            videoConstraints={{ facingMode, width: 800, height: 600 }}
            onUserMediaError={() =>
              setCamError('Camera permission denied or unavailable. Use Upload instead.')
            }
            className="w-full h-44 object-cover"
          />
          <button
            type="button"
            onClick={() =>
              setFacingMode((m) => (m === 'user' ? 'environment' : 'user'))
            }
            className="absolute top-2 right-2 p-2 rounded-full bg-slate-900/85 text-white hover:bg-slate-800"
            title="Switch Camera"
          >
            <SwitchCamera className="w-4 h-4" />
          </button>
        </div>

        {camError && <p className="text-[11px] text-amber-400">{camError}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={captureMealPhoto}
            className="flex-1 py-2 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5" /> Capture Photo
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {photo && (
        <div className="relative">
          <img
            src={photo}
            alt="Captured meal"
            className="w-full h-36 object-cover rounded-xl border border-slate-800"
          />
          <button
            type="button"
            onClick={() => onPhotoChange(null)}
            className="absolute top-2 right-2 px-2 py-1 rounded-md bg-slate-950/85 text-[11px] text-rose-300 hover:text-rose-200 border border-slate-700"
          >
            Remove
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setCamError('');
            setIsOpen(true);
          }}
          className={`${
            compact ? 'py-1.5 px-2.5 text-[11px]' : 'py-2 px-3 text-xs flex-1'
          } rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-medium flex items-center justify-center gap-1.5 border border-slate-700/70`}
        >
          <Camera className="w-3.5 h-3.5" />
          {photo ? 'Retake Photo' : 'Camera'}
        </button>

        <label
          className={`${
            compact ? 'py-1.5 px-2.5 text-[11px]' : 'py-2 px-3 text-xs'
          } rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-200 cursor-pointer border border-slate-700/70 flex items-center gap-1.5`}
        >
          <ImagePlus className="w-3.5 h-3.5 text-sky-400" />
          Upload
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFallbackUpload}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}