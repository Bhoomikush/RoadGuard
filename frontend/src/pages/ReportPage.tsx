import { useState, useRef } from 'react';
import { Camera, Video, MapPin, Send, Loader2 } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UploadZone } from '../components/domain/UploadZone';
import { DetectionResult } from '../components/domain/DetectionResult';
import { supabase } from '../lib/supabase';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export function ReportPage() {
  const [reportType, setReportType] = useState<'photo' | 'video'>('photo');
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mlResult, setMlResult] = useState<any>(null);
  const navigate = useNavigate();

  const handleFileSelect = async (selectedFile: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (reportType === 'photo' && !validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Only JPG, PNG, and WEBP are supported.');
      setFile(null);
      return;
    }
    // Validate file size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size too large. Maximum size is 10MB.');
      setFile(null);
      return;
    }
    
    setError('');
    setFile(selectedFile);
    
    // Call ML API
    setIsAnalyzing(true);
    setMlResult(null);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await axios.post(`${backendUrl}/api/ml/detect`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setMlResult(response.data);
    } catch (err: any) {
      console.error('ML detection error:', err);
    } finally {
      setIsAnalyzing(false);
    }
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
    console.log("0. handleSubmit started");
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

    setIsSubmitting(true);
    try {
      // 1. Get the current user session
      console.log("5. session retrieved");
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      if (authError || !session) {
        throw new Error('Authentication required to submit report.');
      }

      console.log("6. access token exists");
      const user = session.user;
      
      // 2. Upload image to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      console.log("3. storage upload started", fileName);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('hazard-images')
        .upload(fileName, file);

      console.log("4. storage upload completed", uploadError ? "with error" : "success");
      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Calculate overall severity
      let overallSeverity = 'low';
      if (mlResult && mlResult.detected_objects && mlResult.detected_objects.length > 0) {
        let maxScore = 0;
        for (const obj of mlResult.detected_objects) {
          const normalizedConfidence = obj.confidence > 1 ? obj.confidence / 100 : obj.confidence;
          if (normalizedConfidence > maxScore) maxScore = normalizedConfidence;
        }
        if (maxScore >= 0.75) overallSeverity = 'high';
        else if (maxScore >= 0.50) overallSeverity = 'medium';
      }

      // 3. Post to backend API
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
      const hazardPayload = {
        image_url: fileName,
        latitude: location.lat,
        longitude: location.lng,
        description: description || undefined,
        ai_detections: mlResult?.detected_objects || [],
        severity: overallSeverity
      };

      console.log("7. API request started to:", `${backendUrl}/api/hazards`);
      const response = await axios.post(`${backendUrl}/api/hazards`, hazardPayload, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log("8. API response received:", response.status);
      setSuccess('Hazard reported successfully.');
      
      // Clear form
      setFile(null);
      setDescription('');
      setLocation(null);
      
    } catch (err: any) {
      console.error('Submission error:', err);
      const backendError = err.response?.data?.detail;
      setError(typeof backendError === 'string' ? backendError : JSON.stringify(backendError) || err.message || 'An error occurred while submitting the report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader 
        title="Report a Road Hazard" 
        description="Help make roads safer by reporting a hazard. Our AI will automatically analyze your submission."
      />

      <div className="max-w-4xl">
        <Card className="mb-8 bg-slate-900 border-slate-800">
          <CardContent className="p-1">
            <div className="flex bg-slate-950 p-1 rounded-lg">
              <button
                onClick={() => setReportType('photo')}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md text-sm font-medium transition-all ${
                  reportType === 'photo'
                    ? 'bg-slate-800 text-teal-400 shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Camera className="w-4 h-4 mr-2" />
                Photo Report
              </button>
              <button
                disabled
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md text-sm font-medium transition-all opacity-50 cursor-not-allowed text-slate-400`}
              >
                <Video className="w-4 h-4 mr-2" />
                Video Report (Coming Soon)
              </button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-teal-900/50 border border-teal-500 rounded-lg text-teal-200">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h3 className="text-lg font-semibold text-slate-100 mb-4">1. Media Upload</h3>
              <UploadZone type="photo" onFileSelect={handleFileSelect} />
            </section>

            {/* Detection Results */}
            {(isAnalyzing || mlResult) && (
              <section className="bg-slate-900/80 p-6 rounded-xl border-2 border-teal-500/20 shadow-lg shadow-teal-900/20">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">AI Detection Results</h3>
                {isAnalyzing ? (
                  <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-lg border border-slate-700">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                    <p className="text-slate-300">Analyzing image...</p>
                  </div>
                ) : mlResult?.total_detections === 0 ? (
                  <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 text-center">
                    <p className="text-slate-300">No hazards detected</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-teal-400">
                      Total detected hazards: {mlResult?.total_detections}
                    </p>
                    <div className="grid gap-3">
                      {mlResult?.detected_objects.map((obj: any, idx: number) => {
                        const normalizedConfidence = obj.confidence > 1 ? obj.confidence / 100 : obj.confidence;
                        let severity: 'high' | 'medium' | 'low' = 'low';
                        if (normalizedConfidence >= 0.75) severity = 'high';
                        else if (normalizedConfidence >= 0.50) severity = 'medium';

                        return (
                          <div key={idx} className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-500 uppercase font-semibold">Hazard type</span>
                              <span className="text-slate-200 font-medium capitalize">{obj.class_name}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-500 uppercase font-semibold">Confidence</span>
                              <span className="text-teal-400 font-medium">{Math.round(normalizedConfidence * 100)}%</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-slate-500 uppercase font-semibold">Severity</span>
                              <span className={`text-sm font-bold uppercase ${
                                severity === 'high' ? 'text-red-400' :
                                severity === 'medium' ? 'text-orange-400' :
                                'text-green-400'
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
              <h3 className="text-lg font-semibold text-slate-100 mb-4">2. Description</h3>
              <textarea 
                className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Optional: Describe the hazard in more detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </section>

            <section className={file ? 'opacity-100' : 'opacity-50 pointer-events-none'}>
              <h3 className="text-lg font-semibold text-slate-100 mb-4">3. Location</h3>
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <Button 
                      variant="secondary" 
                      icon={MapPin} 
                      className="w-full sm:w-auto"
                      onClick={handleGetLocation}
                      type="button"
                    >
                      Use Current Location
                    </Button>
                    <div className="flex-1 flex items-center pl-2">
                      {locationError && <span className="text-red-400 text-sm">{locationError}</span>}
                      {location && <span className="text-teal-400 text-sm">Location captured successfully</span>}
                    </div>
                  </div>
                  
                  {/* Placeholder for actual map */}
                  <div className="w-full h-48 bg-slate-950 rounded-lg border border-slate-800 relative overflow-hidden flex items-center justify-center">
                     <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                     <MapPin className={`w-8 h-8 absolute ${location ? 'text-teal-500' : 'text-slate-600'}`} />
                     <p className="text-sm text-slate-500 absolute bottom-4">
                       {location ? 'Map Location Pin' : 'Location Required'}
                     </p>
                  </div>
                  
                  {location && (
                    <div className="flex gap-4 mt-4 text-xs text-slate-500 font-mono">
                      <span>Lat: {location.lat.toFixed(6)}</span>
                      <span>Lng: {location.lng.toFixed(6)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
            
            <div className={`pt-6 ${file && location ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <Button 
                size="lg" 
                className="w-full h-14 text-lg disabled:opacity-70 disabled:cursor-not-allowed" 
                icon={isSubmitting ? Loader2 : Send}
                onClick={handleSubmit}
                disabled={isSubmitting || !file || !location}
              >
                {isSubmitting ? 'Submitting report...' : 'Submit Hazard Report'}
              </Button>
            </div>
          </div>
          
          <div className="hidden lg:block">
            <Card className="bg-slate-900/50 border-slate-800 sticky top-8">
              <CardContent className="p-6">
                <h4 className="font-semibold text-slate-200 mb-4">Reporting Guidelines</h4>
                <ul className="space-y-4 text-sm text-slate-400">
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0"></div>
                    <p>Ensure you are in a safe location before capturing photos or videos.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0"></div>
                    <p>Do not use your phone while driving.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0"></div>
                    <p>Clear, well-lit photos result in higher AI detection accuracy.</p>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0"></div>
                    <p>Include some surrounding context to help authorities locate the issue.</p>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
