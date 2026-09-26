import { useState, useRef } from 'react';
import { Camera, Video, MapPin, Send, Loader2 } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { supabase } from '../lib/supabase';
import axios from 'axios';
import ConeMascot from '../components/ConeMascot';

export function ReportPage() {
  const [reportType, setReportType] = useState<'photo' | 'video'>('photo');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mlResult, setMlResult] = useState<any>(null);
  const [mlError, setMlError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitLockRef = useRef(false);

  const analyzeImage = async (selectedFile: File) => {
    setIsAnalyzing(true);
    setMlResult(null);
    setMlError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await axios.post(`${backendUrl}/api/ml/detect`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        }
      });
      setMlResult(response.data);
    } catch (err: any) {
      console.error('ML detection error:', err);
      setMlError(err.response?.data?.detail || 'AI analysis failed. Please try again or use a different image.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (reportType === 'photo' && !validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Only JPG, PNG, and WEBP are supported.');
      setFile(null);
      setPreview(null);
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size too large. Maximum size is 10MB.');
      setFile(null);
      setPreview(null);
      return;
    }
    
    setError('');
    setMlError('');
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    
    await analyzeImage(selectedFile);
  };

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
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };
  const clearFile = () => {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setMlResult(null);
    setMlError('');
  };

  const handleGetLocation = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (err) => {
        setLocationError(err.message || 'Unable to retrieve location.');
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    if (!file) {
      setError('Please upload a photo before submitting.');
      return;
    }
    if (!location) {
      setError('Please provide a location before submitting.');
      return;
    }
    if (isAnalyzing || mlError || !mlResult) {
      setError('Please wait for AI analysis to complete successfully before submitting.');
      return;
    }
    
    if (submitLockRef.current) {
      return;
    }
    submitLockRef.current = true;
    
    setIsSubmitting(true);
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) throw new Error('Authentication required to submit report.');
      const user = session.user;
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('hazard-images')
        .upload(fileName, file);
      if (uploadError) throw new Error(`Failed to upload image: ${uploadError.message}`);
      let overallSeverity = mlResult?.overall_severity || 'low';
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
      const hazardPayload = {
        image_url: fileName,
        latitude: location.lat,
        longitude: location.lng,
        description: description || undefined,
        ai_detections: mlResult?.detected_objects || [],
        severity: overallSeverity
      };
      await axios.post(`${backendUrl}/api/hazards`, hazardPayload, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      setSuccess('Hazard reported successfully.');
      clearFile();
      setDescription('');
      setLocation(null);
    } catch (err: any) {
      console.error('Submission error:', err);
      const backendError = err.response?.data?.detail;
      setError(typeof backendError === 'string' ? backendError : JSON.stringify(backendError) || err.message || 'An error occurred while submitting the report.');
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="fixed inset-0 left-64 bg-[#0E1013] -z-10" />
      <div className="font-['Inter'] text-[#F3F4F6] pb-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#F3F4F6] font-['Sora',sans-serif]">Report a Road Hazard</h1>
          <p className="text-[#9CA3AF] mt-1">Help make roads safer by reporting a hazard. Our AI will automatically analyze your submission.</p>
        </div>

        <div className="max-w-4xl">
          <div className="mb-8 p-1 bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] flex">
            <button
              onClick={() => setReportType('photo')}
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-full text-sm font-bold transition-all ${
                reportType === 'photo'
                  ? 'bg-[#FFC629] text-[#0E1013]'
                  : 'text-[#9CA3AF] bg-transparent hover:text-[#F3F4F6]'
              }`}
            >
              <Camera className="w-4 h-4 mr-2" />
              Photo Report
            </button>
            <button
              disabled
              className={`flex-1 flex items-center justify-center py-3 px-4 rounded-full text-sm font-bold transition-all opacity-50 cursor-not-allowed text-[#9CA3AF] bg-transparent`}
            >
              <Video className="w-4 h-4 mr-2" />
              Video Report (Coming Soon)
            </button>
          </div>

          {error && <div className="mb-6 p-4 bg-[#EF4444]/10 border border-[#EF4444]/50 rounded-lg text-[#EF4444]">{error}</div>}
          {success && <div className="mb-6 p-4 bg-[#22C55E]/10 border border-[#22C55E]/50 rounded-lg text-[#22C55E]">{success}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <h3 className="text-lg font-semibold text-[#F3F4F6] font-['Sora',sans-serif] mb-4">1. Media Upload</h3>
                <div className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] overflow-hidden aspect-video relative flex flex-col items-center justify-center">
                  {preview ? (
                    <>
                      <img src={preview} alt="Upload Preview" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-center">
                        <button onClick={clearFile} className="text-sm font-medium text-[#F3F4F6] hover:text-white underline">
                          Retake / Remove
                        </button>
                      </div>
                    </>
                  ) : (
                    <div 
                      className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging ? 'bg-[#FFC629]/5' : 'hover:bg-[#FFC629]/5'}`}
                      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="w-12 h-12 text-[#9CA3AF] mb-3" />
                      <p className="text-[#9CA3AF] mb-4">Take a photo or drop an image here</p>
                      <button className="px-4 py-2 bg-[#FFC629] text-[#0E1013] text-sm font-bold rounded-full">
                        Choose Photo
                      </button>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" ref={fileInputRef} onChange={(e) => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }} />
                </div>
              </section>

              {(isAnalyzing || mlResult || mlError) && (
                <section className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] p-6 shadow-lg shadow-[#FFC629]/5">
                  <h3 className="text-lg font-semibold text-[#F3F4F6] font-['Sora',sans-serif] mb-4">AI Detection Results</h3>
                  {isAnalyzing ? (
                    <div className="flex items-center gap-3 p-4 bg-[#0E1013] rounded-[16px] border border-[rgba(255,255,255,0.08)]">
                      <Loader2 className="w-5 h-5 animate-spin text-[#FFC629]" />
                      <p className="text-[#F3F4F6]">Analyzing image...</p>
                    </div>
                  ) : mlError ? (
                    <div className="p-4 bg-[#EF4444]/10 rounded-[16px] border border-[#EF4444]/20 text-center">
                      <p className="text-[#EF4444] mb-3">{mlError}</p>
                      <button 
                        onClick={() => file && analyzeImage(file)}
                        className="px-4 py-2 bg-[#EF4444] text-[#F3F4F6] text-sm font-bold rounded-full hover:opacity-90 transition-opacity"
                        type="button"
                      >
                        Retry AI Analysis
                      </button>
                    </div>
                  ) : mlResult?.total_detections === 0 ? (
                    <div className="p-4 bg-[#0E1013] rounded-[16px] border border-[rgba(255,255,255,0.08)] text-center">
                      <p className="text-[#9CA3AF]">No hazards detected</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-[#FFC629]">
                        Total detected hazards: {mlResult?.total_detections}
                      </p>
                      <div className="grid gap-3">
                        {mlResult?.detected_objects.map((obj: any, idx: number) => {
                          const normalizedConfidence = obj.confidence > 1 ? obj.confidence / 100 : obj.confidence;
                          let severity: 'high' | 'medium' | 'low' = 'low';
                          if (normalizedConfidence >= 0.75) severity = 'high';
                          else if (normalizedConfidence >= 0.50) severity = 'medium';
                          return (
                            <div key={idx} className="bg-[#0E1013] p-4 rounded-[16px] border border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex flex-col">
                                <span className="text-xs text-[#9CA3AF] uppercase font-semibold">Hazard type</span>
                                <span className="text-[#F3F4F6] font-bold capitalize">{obj.class_name}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-[#9CA3AF] uppercase font-semibold">Confidence</span>
                                <span className="text-[#F3F4F6] font-bold">{Math.round(normalizedConfidence * 100)}%</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-[#9CA3AF] uppercase font-semibold">Severity</span>
                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase mt-1 ${
                                  severity === 'high' ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20' :
                                  severity === 'medium' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20' :
                                  'bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20'
                                }`}>
                                  {severity}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </section>
              )}

              <section className={file ? 'opacity-100' : 'opacity-50 pointer-events-none'}>
                <h3 className="text-lg font-semibold text-[#F3F4F6] font-['Sora',sans-serif] mb-4">2. Description</h3>
                <textarea 
                  className="w-full h-32 bg-[#161A20] border border-[rgba(255,255,255,0.08)] rounded-[24px] p-5 text-[#F3F4F6] focus:ring-[#FFC629] focus:border-[#FFC629] outline-none transition-all placeholder:text-[#9CA3AF]"
                  placeholder="Optional: Describe the hazard in more detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </section>

              <section className={file ? 'opacity-100' : 'opacity-50 pointer-events-none'}>
                <h3 className="text-lg font-semibold text-[#F3F4F6] font-['Sora',sans-serif] mb-4">3. Location</h3>
                <div className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] p-6">
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <button 
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-[#0E1013] text-[#F3F4F6] border border-[rgba(255,255,255,0.08)] rounded-lg font-medium hover:border-[#FFC629]/50 transition-colors"
                      onClick={handleGetLocation}
                      type="button"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Use Current Location
                    </button>
                    <div className="flex-1 flex items-center pl-2">
                      {locationError && <span className="text-[#EF4444] text-sm font-medium">{locationError}</span>}
                      {location && <span className="text-[#22C55E] text-sm font-medium">Location captured successfully</span>}
                    </div>
                  </div>
                  
                  <div className="w-full h-48 bg-[#0E1013] rounded-[16px] border border-[rgba(255,255,255,0.08)] relative overflow-hidden flex items-center justify-center">
                     <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                     <MapPin className={`w-8 h-8 absolute ${location ? 'text-[#FFC629]' : 'text-[#9CA3AF]'}`} />
                     <p className="text-sm text-[#9CA3AF] absolute bottom-4">
                       {location ? 'Map Location Pin' : 'Location Required'}
                     </p>
                  </div>
                  
                  {location && (
                    <div className="flex gap-4 mt-4 text-xs text-[#9CA3AF] font-mono">
                      <span>Lat: {location.lat.toFixed(6)}</span>
                      <span>Lng: {location.lng.toFixed(6)}</span>
                    </div>
                  )}
                </div>
              </section>
              
              <div className={`pt-4 ${file && location ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <button 
                  className="w-full h-14 inline-flex items-center justify-center bg-[#FFC629] text-[#0E1013] rounded-[16px] font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !file || !location || isAnalyzing || !!mlError || !mlResult}
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                  {isSubmitting ? 'Submitting report...' : 'Submit Hazard Report'}
                </button>
              </div>
            </div>
            
            <div className="hidden lg:block">
              <div className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] sticky top-8 p-6">
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-[rgba(255,255,255,0.08)]">
                  <ConeMascot title="" waving={false} size={56} />
                  <h4 className="font-semibold text-[#F3F4F6] font-['Sora',sans-serif]">Reporting Guidelines</h4>
                </div>
                <ul className="space-y-4 text-sm text-[#9CA3AF]">
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF7A1A] mt-1.5 shrink-0"></div>
                    <p>Ensure you are in a safe location before capturing photos or videos.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF7A1A] mt-1.5 shrink-0"></div>
                    <p>Do not use your phone while driving.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF7A1A] mt-1.5 shrink-0"></div>
                    <p>Clear, well-lit photos result in higher AI detection accuracy.</p>
                  </li>
                  <li className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF7A1A] mt-1.5 shrink-0"></div>
                    <p>Include some surrounding context to help authorities locate the issue.</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
