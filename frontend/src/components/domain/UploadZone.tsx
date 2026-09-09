import { UploadCloud, Image as ImageIcon, Video, X } from 'lucide-react';
import { useState } from 'react';

interface UploadZoneProps {
  type: 'photo' | 'video';
  onFileSelect?: (file: File) => void;
}

export function UploadZone({ type, onFileSelect }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Create a mock preview url for the UI
    const url = URL.createObjectURL(file);
    setPreview(url);
    if (onFileSelect) onFileSelect(file);
  };

  const clearPreview = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  if (preview) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-video flex items-center justify-center">
        {type === 'photo' ? (
          <img src={preview} alt="Preview" className="max-w-full max-h-full object-contain" />
        ) : (
          <video src={preview} controls className="max-w-full max-h-full" />
        )}
        <button 
          onClick={clearPreview}
          className="absolute top-2 right-2 p-1.5 bg-slate-950/80 text-white rounded-full hover:bg-red-500/80 transition-colors backdrop-blur-sm"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-center aspect-video ${
        isDragging 
          ? 'border-teal-500 bg-teal-500/10' 
          : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-800/50'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-upload')?.click()}
    >
      <input 
        type="file" 
        id="file-upload" 
        className="hidden" 
        accept={type === 'photo' ? "image/*" : "video/*"} 
        onChange={handleFileInput}
      />
      
      <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
        {type === 'photo' ? <ImageIcon className="w-8 h-8" /> : <Video className="w-8 h-8" />}
      </div>
      
      <h3 className="text-lg font-semibold text-slate-200 mb-2">
        Upload a road {type}
      </h3>
      
      <p className="text-sm text-slate-400 mb-6 max-w-xs">
        Drag and drop your file here, or click to browse from your device.
      </p>
      
      <div className="flex items-center text-xs text-slate-500">
        <UploadCloud className="w-4 h-4 mr-1.5" />
        {type === 'photo' ? 'Supports JPG, PNG, WEBP (Max 10MB)' : 'Supports MP4, MOV (Max 50MB)'}
      </div>
    </div>
  );
}
