import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mic, Camera, MapPin, Send, ArrowRight, ArrowLeft, 
  RefreshCw, CheckCircle, AlertTriangle, ExternalLink, Copy, Check, UploadCloud, 
  Shield, Building, Phone, Mail, Globe, StopCircle, RotateCcw, 
  Loader2, Info
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { supabase } from '../lib/supabase';
import axios from 'axios';
import type { Authority } from '../types';

interface GeocodeResult {
  display_name: string;
  road: string;
  suburb: string;
  city: string;
  district: string;
  state: string;
  postcode: string;
  country: string;
  latitude: number;
  longitude: number;
  map_link: string;
  is_geocoded: boolean;
  suggested_authority: Authority;
  available_authorities: Authority[];
}

export function VoiceComplaintPage() {
  const navigate = useNavigate();

  // Wizard state: 1 = Record, 2 = Location, 3 = Transcript, 4 = Review Letter & Authority, 5 = Confirm & Send
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0); // 0 to 60s
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>('video/webm');
  const [recordingError, setRecordingError] = useState<string>('');

  // Location State
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locationAddress, setLocationAddress] = useState<string>('');
  const [roadName, setRoadName] = useState<string>('');
  const [cityName, setCityName] = useState<string>('');
  const [districtName, setDistrictName] = useState<string>('');
  const [stateName, setStateName] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string>('');
  const [isManualLocation, setIsManualLocation] = useState<boolean>(false);

  // Authority & Geocode State
  const [suggestedAuthority, setSuggestedAuthority] = useState<Authority | null>(null);
  const [selectedAuthority, setSelectedAuthority] = useState<Authority | null>(null);
  const [availableAuthorities, setAvailableAuthorities] = useState<Authority[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<'email' | 'external_portal'>('email');

  // Transcription State
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [detectedLanguage, setDetectedLanguage] = useState<string>('en');
  const [transcriptionError, setTranscriptionError] = useState<string>('');

  // Complaint Letter State
  const [isGeneratingLetter, setIsGeneratingLetter] = useState<boolean>(false);
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [hasManuallyEditedLetter, setHasManuallyEditedLetter] = useState<boolean>(false);
  const [letterLanguage, setLetterLanguage] = useState<'en' | 'hi' | 'mr'>('en');
  const [generationError, setGenerationError] = useState<string>('');

  // Submission & Evidence State
  const [isUploadingEvidence, setIsUploadingEvidence] = useState<boolean>(false);
  const [evidenceStoragePath, setEvidenceStoragePath] = useState<string | null>(null);
  const [evidenceSignedUrl, setEvidenceSignedUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string>('');
  const [submissionSuccess, setSubmissionSuccess] = useState<any | null>(null);
  const [copiedLetter, setCopiedLetter] = useState<boolean>(false);

  // References
  const videoLiveRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerIntervalRef = useRef<any>(null);
  const submitLockRef = useRef<boolean>(false);

  const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

  const stopLiveStream = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
  }, [mediaStream]);

  // Cleanup media stream on unmount
  useEffect(() => {
    return () => {
      stopLiveStream();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [stopLiveStream]);

  // Connect live stream to video element
  useEffect(() => {
    if (videoLiveRef.current && mediaStream && isRecording) {
      videoLiveRef.current.srcObject = mediaStream;
    }
  }, [mediaStream, isRecording]);

  // -------------------------------------------------------------------------
  // STEP 1: Recording & Media Controls
  // -------------------------------------------------------------------------
  const startRecording = async () => {
    setRecordingError('');
    setRecordedBlob(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setRecordingDuration(0);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setRecordingError('Your browser does not support video/audio recording. Please use the file upload option below.');
      return;
    }

    try {
      // Prefer rear-facing camera on mobile devices
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMediaStream(stream);

      // Dynamically select best supported recording MIME type
      const possibleTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'video/mp4;codecs=avc1,mp4a',
        'video/mp4'
      ];
      const supportedType = possibleTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';
      setMediaType(supportedType || 'video/webm');

      const recorder = new MediaRecorder(stream, supportedType ? { mimeType: supportedType } : undefined);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: supportedType || 'video/webm' });
        setRecordedBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setPreviewUrl(url);
        stream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      };

      recorder.start(1000); // 1-second chunks
      setMediaRecorder(recorder);
      setIsRecording(true);

      // Timer with 60 second limit
      let seconds = 0;
      timerIntervalRef.current = setInterval(() => {
        seconds += 1;
        setRecordingDuration(seconds);
        if (seconds >= 60) {
          stopRecording(recorder);
        }
      }, 1000);

    } catch (err: any) {
      console.error('Camera/mic access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setRecordingError('Camera or microphone permission was denied. Please allow access in browser settings to record, or upload a video file below.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setRecordingError('No camera or microphone device found. You can upload a pre-recorded file instead.');
      } else {
        setRecordingError(`Unable to start recording: ${err.message || 'Device error'}`);
      }
    }
  };

  const stopRecording = (recorderInstance?: MediaRecorder) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRecording(false);

    const activeRecorder = recorderInstance || mediaRecorder;
    if (activeRecorder && activeRecorder.state !== 'inactive') {
      activeRecorder.stop();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setRecordingError('Uploaded file size exceeds the 50 MB limit. Please select a smaller recording.');
      return;
    }

    setRecordingError('');
    setRecordedBlob(file);
    setMediaType(file.type || 'video/webm');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // -------------------------------------------------------------------------
  // STEP 2: Location & Reverse Geocoding
  // -------------------------------------------------------------------------
  const captureGpsLocation = async () => {
    setLocationError('');
    setIsLocating(true);

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please enter location details manually.');
      setIsLocating(false);
      setIsManualLocation(true);
      return;
    }

    const applyPosition = async (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setLatitude(lat);
      setLongitude(lng);
      setAccuracy(Math.round(pos.coords.accuracy));
      setLocationError('');
      await performReverseGeocode(lat, lng);
      setIsLocating(false);
    };

    // Helper promise for getCurrentPosition
    const requestCoords = (options: PositionOptions): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    };

    try {
      // Pass 1: Try high accuracy with a 15-second timeout and 1-minute acceptable cache
      const position = await requestCoords({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      });
      await applyPosition(position);
      return;
    } catch (firstErr: any) {
      console.warn('High accuracy GPS timed out or failed, falling back to network/cell tower location...', firstErr);

      // If user explicitly denied permission, do not retry
      if (firstErr?.code === 1) { // PERMISSION_DENIED
        setLocationError('Location permission denied. Please allow location access in your browser/device settings, or enter details manually.');
        setIsLocating(false);
        setIsManualLocation(true);
        return;
      }

      // Pass 2: Retry with low accuracy (Cell/Wi-Fi positioning), allowing older cached location
      try {
        const fallbackPos = await requestCoords({
          enableHighAccuracy: false,
          timeout: 12000,
          maximumAge: 300000 // 5 minutes cache
        });
        await applyPosition(fallbackPos);
        return;
      } catch (secondErr: any) {
        console.warn('Network location also failed:', secondErr);
      }
    }

    // Pass 3: IP-based coarse fallback so the user is never stuck
    try {
      const ipRes = await fetch('https://ipapi.co/json/');
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        if (ipData.latitude && ipData.longitude) {
          const lat = parseFloat(ipData.latitude);
          const lng = parseFloat(ipData.longitude);
          setLatitude(lat);
          setLongitude(lng);
          setAccuracy(5000); // Coarse network indicator
          const coarseAddr = [ipData.city, ipData.region, ipData.country_name].filter(Boolean).join(', ');
          setLocationAddress(coarseAddr || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
          if (ipData.city) setCityName(ipData.city);
          if (ipData.region) setStateName(ipData.region);
          await performReverseGeocode(lat, lng);
          setLocationError('Exact GPS timed out (poor satellite visibility). Approximate network location was detected. You can refine the street name below.');
          setIsLocating(false);
          setIsManualLocation(true);
          return;
        }
      }
    } catch (ipErr) {
      console.warn('IP location fallback failed:', ipErr);
    }

    // If all fail, display helpful guidance
    setLocationError('GPS signal timed out (common indoors or under weak satellite coverage). Please enter the street name or landmark manually below.');
    setIsLocating(false);
    setIsManualLocation(true);
  };

  const performReverseGeocode = async (lat: number, lng: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await axios.get<GeocodeResult>(`${backendUrl}/api/complaints/reverse-geocode`, {
        params: { lat, lng },
        headers: session ? { 'Authorization': `Bearer ${session.access_token}` } : {}
      });

      const data = response.data;
      setLocationAddress(data.display_name || `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`);
      setRoadName(data.road || '');
      setCityName(data.city || '');
      setDistrictName(data.district || '');
      setStateName(data.state || '');

      if (data.suggested_authority) {
        setSuggestedAuthority(data.suggested_authority);
        setSelectedAuthority(data.suggested_authority);
      }
      if (data.available_authorities && data.available_authorities.length > 0) {
        setAvailableAuthorities(data.available_authorities);
      }
    } catch (err: any) {
      console.warn('Reverse geocode error:', err);
      setLocationAddress(`Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
    }
  };

  // -------------------------------------------------------------------------
  // STEP 3: Speech-to-Text Transcription
  // -------------------------------------------------------------------------
  const runTranscription = async () => {
    if (!recordedBlob) {
      setTranscriptionError('No recording found to transcribe.');
      return;
    }

    setIsTranscribing(true);
    setTranscriptionError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      const ext = mediaType.includes('mp4') ? 'mp4' : 'webm';
      formData.append('file', recordedBlob, `recording.${ext}`);

      const response = await axios.post(`${backendUrl}/api/complaints/transcribe`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        }
      });

      const resData = response.data;
      if (resData.is_empty) {
        setTranscript('');
        setTranscriptionError(resData.message || 'No distinct speech detected. You can type the complaint description directly.');
      } else {
        setTranscript(resData.transcript);
        setDetectedLanguage(resData.detected_language || 'en');
      }
    } catch (err: any) {
      console.error('Transcription error:', err);
      const detail = err.response?.data?.detail;
      setTranscriptionError(typeof detail === 'string' ? detail : 'Speech transcription failed. Please enter your complaint description manually below.');
    } finally {
      setIsTranscribing(false);
    }
  };

  // -------------------------------------------------------------------------
  // STEP 4: AI Complaint Letter Generation
  // -------------------------------------------------------------------------
  const generateComplaintLetter = async (targetLang: 'en' | 'hi' | 'mr' = letterLanguage) => {
    if (!transcript.trim()) {
      setGenerationError('Please provide a verbal or typed description before generating the complaint letter.');
      return;
    }

    setIsGeneratingLetter(true);
    setGenerationError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const payload = {
        transcript: transcript.trim(),
        latitude,
        longitude,
        address: locationAddress || [roadName, cityName, districtName, stateName].filter(Boolean).join(', '),
        authority_name: selectedAuthority?.name || 'Concerned Road Authority',
        language: targetLang,
        has_evidence: !!recordedBlob
      };

      const response = await axios.post(`${backendUrl}/api/complaints/generate-letter`, payload, {
        headers: session ? { 'Authorization': `Bearer ${session.access_token}` } : {}
      });

      setSubject(response.data.subject);
      setBody(response.data.body);
      setHasManuallyEditedLetter(false);
    } catch (err: any) {
      console.error('Complaint generation error:', err);
      const detail = err.response?.data?.detail;
      setGenerationError(typeof detail === 'string' ? detail : 'Failed to generate official complaint letter.');
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const handleRegenerateWithWarning = () => {
    if (hasManuallyEditedLetter) {
      const proceed = window.confirm('You have edited the complaint letter. Regenerating will replace your custom edits with new AI draft. Do you wish to proceed?');
      if (!proceed) return;
    }
    generateComplaintLetter(letterLanguage);
  };

  // -------------------------------------------------------------------------
  // STEP 5: Evidence Upload & Explicit Send Confirmation
  // -------------------------------------------------------------------------
  const uploadEvidenceFile = async (): Promise<{ storagePath: string | null; signedUrl: string | null }> => {
    if (!recordedBlob) return { storagePath: null, signedUrl: null };
    if (evidenceStoragePath) return { storagePath: evidenceStoragePath, signedUrl: evidenceSignedUrl };

    setIsUploadingEvidence(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      const ext = mediaType.includes('mp4') ? 'mp4' : 'webm';
      formData.append('file', recordedBlob, `evidence.${ext}`);

      const response = await axios.post(`${backendUrl}/api/complaints/evidence`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(session ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        }
      });

      const sp = response.data.storage_path;
      const su = response.data.signed_url;
      setEvidenceStoragePath(sp);
      setEvidenceSignedUrl(su);
      return { storagePath: sp, signedUrl: su };
    } catch (err) {
      console.warn('Evidence upload failed:', err);
      return { storagePath: null, signedUrl: null };
    } finally {
      setIsUploadingEvidence(false);
    }
  };

  const handleSendComplaint = async () => {
    setSubmissionError('');
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required to submit complaint.');

      // Upload evidence video to private bucket
      const evidence = await uploadEvidenceFile();

      const payload = {
        subject: subject.trim(),
        body: body.trim(),
        authority_name: selectedAuthority?.name || 'Concerned Road Authority',
        authority_email: selectedAuthority?.email || undefined,
        channel: selectedChannel,
        latitude,
        longitude,
        address: locationAddress || [roadName, cityName, districtName, stateName].filter(Boolean).join(', '),
        transcript: transcript.trim(),
        evidence_storage_path: evidence.storagePath
      };

      const response = await axios.post(`${backendUrl}/api/complaints/send`, payload, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      setSubmissionSuccess(response.data);
    } catch (err: any) {
      console.error('Submission failed:', err);
      const detail = err.response?.data?.detail;
      setSubmissionError(typeof detail === 'string' ? detail : err.message || 'Failed to submit complaint. Your draft is preserved.');
    } finally {
      submitLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const copyLetterToClipboard = () => {
    const fullText = `SUBJECT: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 3000);
  };

  // -------------------------------------------------------------------------
  // Navigation between steps with automated triggers
  // -------------------------------------------------------------------------
  const goToStep = async (step: 1 | 2 | 3 | 4 | 5) => {
    if (step === 2) {
      // Transitioning to location: trigger GPS if not already done
      if (latitude === null && !isLocating) {
        captureGpsLocation();
      }
    } else if (step === 3) {
      // Transitioning to transcription: trigger transcription if not done yet
      if (!transcript && recordedBlob && !isTranscribing) {
        runTranscription();
      }
    } else if (step === 4) {
      // Transitioning to complaint letter generation
      if (!body && transcript && !isGeneratingLetter) {
        generateComplaintLetter();
      }
    }
    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <DashboardLayout>
      <div className="fixed inset-0 left-0 lg:left-64 bg-[#0E1013] -z-10" />
      <div className="font-['Inter'] text-[#F3F4F6] max-w-4xl mx-auto px-4 py-6 sm:py-8 pb-36 sm:pb-28">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-[#FFC629]/10 text-[#FFC629] text-xs font-bold uppercase tracking-wider border border-[#FFC629]/20 flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" />
              Voice-Based Complaint Reporting
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F3F4F6] font-['Sora',sans-serif]">
            Report Road Hazard by Voice
          </h1>
          <p className="text-[#9CA3AF] text-sm mt-1">
            Record a short video explaining the problem. Our AI transcribes your speech, extracts location, and drafts an official complaint letter for civic authorities.
          </p>
        </div>

        {/* Step Progress Indicator */}
        <div className="mb-6 sm:mb-8 p-3 sm:p-4 bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] overflow-x-auto scrollbar-none">
          <div className="flex items-center justify-between min-w-[280px] relative">
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-[rgba(255,255,255,0.08)] -translate-y-1/2 -z-0" />
            
            {[
              { num: 1, label: 'Record' },
              { num: 2, label: 'Location' },
              { num: 3, label: 'Speech' },
              { num: 4, label: 'Draft' },
              { num: 5, label: 'Send' }
            ].map((s) => {
              const isPast = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <div key={s.num} className="flex flex-col items-center relative z-10 px-1">
                  <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-[11px] sm:text-sm transition-all ${
                    isPast 
                      ? 'bg-[#10B981] text-[#0E1013]' 
                      : isCurrent 
                      ? 'bg-[#FFC629] text-[#0E1013] ring-2 sm:ring-4 ring-[#FFC629]/20' 
                      : 'bg-[#0E1013] text-[#9CA3AF] border border-[rgba(255,255,255,0.1)]'
                  }`}>
                    {isPast ? <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" /> : s.num}
                  </div>
                  <span className={`text-[9px] sm:text-xs mt-1 sm:mt-1.5 font-medium whitespace-nowrap ${
                    isCurrent ? 'text-[#FFC629] font-bold' : 'text-[#9CA3AF]'
                  }`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 1: Video and Audio Recording */}
        {currentStep === 1 && (
          <div className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-['Sora',sans-serif] text-[#F3F4F6]">Step 1: Record Road Problem</h2>
                <p className="text-sm text-[#9CA3AF]">Record up to 60 seconds of video while verbally describing the road defect.</p>
              </div>
              <span className="text-xs text-[#9CA3AF] bg-[#0E1013] px-3 py-1 rounded-full border border-[rgba(255,255,255,0.08)]">
                Max 60s
              </span>
            </div>

            {recordingError && (
              <div className="p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-[#EF4444] text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>{recordingError}</div>
              </div>
            )}

            {/* Video Preview / Camera Viewport */}
            <div className="w-full aspect-[4/3] sm:aspect-video max-h-[380px] bg-[#0E1013] rounded-2xl border border-[rgba(255,255,255,0.12)] relative overflow-hidden flex items-center justify-center shadow-inner">
              {isRecording ? (
                <>
                  <video ref={videoLiveRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 bg-red-600/90 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 animate-pulse shadow-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    RECORDING ({60 - recordingDuration}s left)
                  </div>
                  {/* Progress Bar */}
                  <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/40">
                    <div 
                      className="h-full bg-[#FFC629] transition-all duration-1000" 
                      style={{ width: `${(recordingDuration / 60) * 100}%` }} 
                    />
                  </div>
                </>
              ) : previewUrl ? (
                <div className="relative w-full h-full bg-black">
                  <video src={previewUrl} controls className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FFC629]/10 border border-[#FFC629]/20 flex items-center justify-center mb-3 sm:mb-4 shadow-sm">
                    <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-[#FFC629]" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[#F3F4F6] mb-1 font-['Sora',sans-serif]">Camera Ready</h3>
                  <p className="text-xs sm:text-sm text-[#9CA3AF] max-w-xs sm:max-w-sm leading-relaxed">
                    Hold your phone or device to show the road defect (pothole, crack, waterlogging) while clearly describing the danger.
                  </p>
                </div>
              )}
            </div>

            {/* Recording Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[rgba(255,255,255,0.08)]">
              <div>
                {!isRecording && !previewUrl && (
                  <button
                    onClick={startRecording}
                    className="h-12 px-6 rounded-full bg-[#FFC629] text-[#0E1013] font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_4px_14px_rgba(255,198,41,0.2)]"
                  >
                    <Mic className="w-5 h-5" />
                    Start Video & Audio Recording
                  </button>
                )}

                {isRecording && (
                  <button
                    onClick={() => stopRecording()}
                    className="h-12 px-6 rounded-full bg-[#EF4444] text-white font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-red-500/20"
                  >
                    <StopCircle className="w-5 h-5" />
                    Stop Recording ({recordingDuration}s)
                  </button>
                )}

                {!isRecording && previewUrl && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={startRecording}
                      className="h-11 px-5 rounded-full bg-[#0E1013] border border-[rgba(255,255,255,0.15)] text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.05)] transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4 text-[#FFC629]" />
                      Re-record Video
                    </button>
                    <span className="text-xs text-[#10B981] flex items-center gap-1 font-medium">
                      <CheckCircle className="w-4 h-4" /> Ready for processing
                    </span>
                  </div>
                )}
              </div>

              {/* Upload fallback button */}
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="video/*,audio/*"
                  className="hidden"
                />
                {!isRecording && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-[#9CA3AF] hover:text-[#F3F4F6] underline flex items-center gap-1"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Or upload pre-recorded video/audio (Max 50MB)
                  </button>
                )}

                {recordedBlob && (
                  <button
                    onClick={() => goToStep(2)}
                    className="h-12 px-7 rounded-full bg-[#FFC629] text-[#0E1013] font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_4px_14px_rgba(255,198,41,0.2)] ml-auto"
                  >
                    Continue to Location
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Location Capture & Reverse Geocoding */}
        {currentStep === 2 && (
          <div className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold font-['Sora',sans-serif] text-[#F3F4F6]">Step 2: Confirm Location</h2>
                <p className="text-sm text-[#9CA3AF]">Road authorities require accurate location details to dispatch maintenance teams.</p>
              </div>
              <button
                onClick={captureGpsLocation}
                disabled={isLocating}
                className="self-start sm:self-auto h-9 px-4 rounded-full bg-[#0E1013] border border-[rgba(255,255,255,0.15)] text-[#FFC629] text-xs font-semibold hover:border-[#FFC629] transition-colors flex items-center gap-1.5 disabled:opacity-50 shrink-0"
              >
                {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
                {isLocating ? 'Detecting GPS...' : 'Refresh GPS Location'}
              </button>
            </div>

            {locationError && (
              <div className="p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-[#EF4444] text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>{locationError}</div>
              </div>
            )}

            {/* Location Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0E1013] p-5 rounded-2xl border border-[rgba(255,255,255,0.08)]">
                <span className="text-xs text-[#9CA3AF] uppercase font-bold tracking-wider">Detected GPS Coordinates</span>
                <div className="mt-2 text-lg font-mono text-[#F3F4F6]">
                  {latitude !== null && longitude !== null ? (
                    <div>
                      <span>{latitude.toFixed(6)}° N, {longitude.toFixed(6)}° E</span>
                      {accuracy !== null && (
                        <p className="text-xs text-[#9CA3AF] font-sans mt-1">Accuracy: ±{accuracy} meters</p>
                      )}
                      <a
                        href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-[#FFC629] hover:underline mt-2"
                      >
                        <ExternalLink className="w-3 h-3" /> View Pin on Google Maps
                      </a>
                    </div>
                  ) : (
                    <span className="text-sm text-[#9CA3AF]">No coordinates captured yet</span>
                  )}
                </div>
              </div>

              <div className="bg-[#0E1013] p-5 rounded-2xl border border-[rgba(255,255,255,0.08)]">
                <span className="text-xs text-[#9CA3AF] uppercase font-bold tracking-wider">Reverse-Geocoded Address</span>
                <p className="mt-2 text-sm text-[#F3F4F6] line-clamp-3">
                  {locationAddress || 'Address will appear after GPS detection.'}
                </p>
              </div>
            </div>

            {/* Manual Location Override Form */}
            <div className="pt-2">
              <button
                onClick={() => setIsManualLocation(!isManualLocation)}
                className="text-xs text-[#FFC629] hover:underline flex items-center gap-1 font-medium mb-3"
              >
                {isManualLocation ? 'Hide manual location fields' : 'Edit road name or landmark manually'}
              </button>

              {isManualLocation && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-[#0E1013] rounded-2xl border border-[rgba(255,255,255,0.08)] animate-in fade-in duration-200">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-[#9CA3AF] mb-1">Full Address / Landmark</label>
                    <input
                      type="text"
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                      placeholder="e.g. Near Shivajinagar Railway Station, Pune"
                      className="w-full h-10 px-3 bg-[#161A20] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-[#F3F4F6] focus:border-[#FFC629] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#9CA3AF] mb-1">Road Name / Highway No.</label>
                    <input
                      type="text"
                      value={roadName}
                      onChange={(e) => setRoadName(e.target.value)}
                      placeholder="e.g. NH-48 or FC Road"
                      className="w-full h-10 px-3 bg-[#161A20] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-[#F3F4F6] focus:border-[#FFC629] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#9CA3AF] mb-1">City / Town</label>
                    <input
                      type="text"
                      value={cityName}
                      onChange={(e) => setCityName(e.target.value)}
                      placeholder="e.g. Pune, Mumbai, Thane"
                      className="w-full h-10 px-3 bg-[#161A20] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-[#F3F4F6] focus:border-[#FFC629] outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.08)]">
              <button
                onClick={() => goToStep(1)}
                className="h-11 px-5 rounded-full bg-[#0E1013] border border-[rgba(255,255,255,0.15)] text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.05)] transition-colors text-sm font-medium flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Video
              </button>

              <button
                onClick={() => goToStep(3)}
                disabled={!locationAddress && latitude === null}
                className="h-12 px-7 rounded-full bg-[#FFC629] text-[#0E1013] font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_4px_14px_rgba(255,198,41,0.2)] disabled:opacity-50"
              >
                Continue to Transcript
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Review Transcript */}
        {currentStep === 3 && (
          <div className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-['Sora',sans-serif] text-[#F3F4F6]">Step 3: Review Speech Transcript</h2>
                <p className="text-sm text-[#9CA3AF]">Verify the transcribed words from your recording. You can edit or add details.</p>
              </div>
              <button
                onClick={runTranscription}
                disabled={isTranscribing}
                className="h-9 px-4 rounded-full bg-[#0E1013] border border-[rgba(255,255,255,0.15)] text-[#FFC629] text-xs font-semibold hover:border-[#FFC629] transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isTranscribing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {isTranscribing ? 'Transcribing...' : 'Re-transcribe Audio'}
              </button>
            </div>

            {isTranscribing && (
              <div className="p-8 bg-[#0E1013] rounded-2xl border border-[rgba(255,255,255,0.08)] text-center flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-[#FFC629] animate-spin mb-3" />
                <h4 className="font-bold text-[#F3F4F6]">Processing Speech Audio...</h4>
                <p className="text-xs text-[#9CA3AF] max-w-sm mt-1">
                  Transcribing your audio in English, Hindi, or Marathi with Gemini AI speech recognition.
                </p>
              </div>
            )}

            {transcriptionError && (
              <div className="p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-[#EF4444] text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>{transcriptionError}</div>
              </div>
            )}

            {!isTranscribing && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                    Spoken Description (Editable)
                  </label>
                  <span className="text-[11px] text-[#9CA3AF] bg-[#0E1013] px-2.5 py-0.5 rounded-full border border-[rgba(255,255,255,0.08)]">
                    Detected: {detectedLanguage.toUpperCase()}
                  </span>
                </div>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="e.g. There is a deep pothole on the right lane near the bus stop causing heavy vehicle swerving and risk of accidents."
                  rows={5}
                  className="w-full p-4 bg-[#0E1013] border border-[rgba(255,255,255,0.1)] rounded-2xl text-sm text-[#F3F4F6] focus:border-[#FFC629] outline-none leading-relaxed"
                />
                <p className="text-xs text-[#9CA3AF] mt-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-[#FFC629]" />
                  Feel free to correct any misspelled street names or add extra hazard severity notes above.
                </p>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.08)]">
              <button
                onClick={() => goToStep(2)}
                className="h-11 px-5 rounded-full bg-[#0E1013] border border-[rgba(255,255,255,0.15)] text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.05)] transition-colors text-sm font-medium flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Location
              </button>

              <button
                onClick={() => goToStep(4)}
                disabled={!transcript.trim() || isTranscribing}
                className="h-12 px-7 rounded-full bg-[#FFC629] text-[#0E1013] font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_4px_14px_rgba(255,198,41,0.2)] disabled:opacity-50"
              >
                Draft Formal Complaint
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: AI Complaint Letter & Authority Recommendation */}
        {currentStep === 4 && (
          <div className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold font-['Sora',sans-serif] text-[#F3F4F6]">Step 4: Review Official Complaint Letter</h2>
                <p className="text-sm text-[#9CA3AF]">AI has structured your verbal report into a formal civic grievance.</p>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-2 bg-[#0E1013] p-1 rounded-full border border-[rgba(255,255,255,0.08)]">
                {(['en', 'hi', 'mr'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLetterLanguage(lang);
                      generateComplaintLetter(lang);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                      letterLanguage === lang 
                        ? 'bg-[#FFC629] text-[#0E1013]' 
                        : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'मराठी'}
                  </button>
                ))}
              </div>
            </div>

            {generationError && (
              <div className="p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-[#EF4444] text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>{generationError}</div>
              </div>
            )}

            {/* Authority Recommendation Badge & Override */}
            <div className="p-5 bg-[#0E1013] rounded-2xl border border-[rgba(255,255,255,0.08)] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-[#FFC629]" />
                  <span className="text-xs text-[#9CA3AF] uppercase font-bold tracking-wider">Responsible Road Authority</span>
                </div>
                {suggestedAuthority?.reason && (
                  <span className="text-[11px] text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded-full border border-[#10B981]/20 font-medium">
                    {suggestedAuthority.reason}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#9CA3AF] mb-1">Select Authority (or keep suggested)</label>
                  <select
                    value={selectedAuthority?.id || ''}
                    onChange={(e) => {
                      const found = availableAuthorities.find(a => a.id === e.target.value);
                      if (found) setSelectedAuthority(found);
                    }}
                    className="w-full h-11 px-3 bg-[#161A20] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm text-[#F3F4F6] focus:border-[#FFC629] outline-none"
                  >
                    {availableAuthorities.map(auth => (
                      <option key={auth.id} value={auth.id} className="bg-[#161A20] text-[#F3F4F6]">
                        {auth.name} ({auth.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#9CA3AF] mb-1">Official Submission Channel</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedChannel('email')}
                      className={`flex-1 h-11 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                        selectedChannel === 'email' 
                          ? 'bg-[#FFC629] text-[#0E1013] border-[#FFC629]' 
                          : 'bg-[#161A20] text-[#9CA3AF] border-[rgba(255,255,255,0.1)]'
                      }`}
                    >
                      <Mail className="w-4 h-4" /> Send Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedChannel('external_portal')}
                      className={`flex-1 h-11 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
                        selectedChannel === 'external_portal' 
                          ? 'bg-[#FFC629] text-[#0E1013] border-[#FFC629]' 
                          : 'bg-[#161A20] text-[#9CA3AF] border-[rgba(255,255,255,0.1)]'
                      }`}
                    >
                      <Globe className="w-4 h-4" /> Official Portal
                    </button>
                  </div>
                </div>
              </div>

              {selectedAuthority && (
                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-[#9CA3AF]">
                  {selectedAuthority.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-[#FFC629]" /> {selectedAuthority.email}
                    </span>
                  )}
                  {selectedAuthority.helpline && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#10B981]" /> Helpline: {selectedAuthority.helpline}
                    </span>
                  )}
                  {selectedAuthority.portal_url && (
                    <a href={selectedAuthority.portal_url} target="_blank" rel="noreferrer" className="text-[#FFC629] hover:underline flex items-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5" /> Portal Link
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Editable Subject & Body */}
            {isGeneratingLetter ? (
              <div className="p-8 bg-[#0E1013] rounded-2xl border border-[rgba(255,255,255,0.08)] text-center flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#FFC629] animate-spin mb-3" />
                <h4 className="font-bold text-[#F3F4F6]">Generating Formal Complaint Letter...</h4>
                <p className="text-xs text-[#9CA3AF] max-w-sm mt-1">
                  Composing formal salutation, location coordinates, inspection request, and safety assessment using OpenRouter.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">Subject Line (Editable)</label>
                    <button
                      onClick={handleRegenerateWithWarning}
                      className="text-xs text-[#FFC629] hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Regenerate Letter
                    </button>
                  </div>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Complaint Subject"
                    className="w-full h-11 px-4 bg-[#0E1013] border border-[rgba(255,255,255,0.1)] rounded-xl text-sm font-semibold text-[#F3F4F6] focus:border-[#FFC629] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#9CA3AF] uppercase tracking-wider mb-1">
                    Official Letter Body (Editable)
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => {
                      setBody(e.target.value);
                      setHasManuallyEditedLetter(true);
                    }}
                    rows={12}
                    className="w-full p-4 bg-[#0E1013] border border-[rgba(255,255,255,0.1)] rounded-2xl text-sm text-[#F3F4F6] focus:border-[#FFC629] outline-none leading-relaxed font-sans"
                  />
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-[rgba(255,255,255,0.08)]">
              <button
                onClick={() => goToStep(3)}
                className="h-11 px-5 rounded-full bg-[#0E1013] border border-[rgba(255,255,255,0.15)] text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.05)] transition-colors text-sm font-medium flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Transcript
              </button>

              <button
                onClick={() => goToStep(5)}
                disabled={!subject.trim() || !body.trim() || isGeneratingLetter}
                className="h-12 px-7 rounded-full bg-[#FFC629] text-[#0E1013] font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_4px_14px_rgba(255,198,41,0.2)] disabled:opacity-50"
              >
                Proceed to Review & Confirm
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Review & Send Confirmation */}
        {currentStep === 5 && (
          <div className="bg-[#161A20] rounded-[24px] border border-[rgba(255,255,255,0.08)] p-6 sm:p-8 space-y-6">
            {!submissionSuccess ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold font-['Sora',sans-serif] text-[#F3F4F6]">Step 5: Final Review & Confirmation</h2>
                    <p className="text-sm text-[#9CA3AF]">
                      Please confirm all details. Your complaint will not be sent until you explicitly authorize it.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#FFC629]/10 text-[#FFC629] text-xs font-bold border border-[#FFC629]/20">
                    Awaiting User Confirmation
                  </span>
                </div>

                {submissionError && (
                  <div className="p-4 bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-xl text-[#EF4444] text-sm flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>{submissionError}</div>
                  </div>
                )}

                {/* Summary Card */}
                <div className="p-5 bg-[#0E1013] rounded-2xl border border-[rgba(255,255,255,0.08)] space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[#9CA3AF]">Target Road Authority:</span>
                      <p className="font-bold text-[#F3F4F6] text-sm mt-0.5">{selectedAuthority?.name || 'Concerned Authority'}</p>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF]">Submission Channel:</span>
                      <p className="font-bold text-[#FFC629] text-sm mt-0.5">
                        {selectedChannel === 'email' ? `Direct Email (${selectedAuthority?.email || 'Authority Email'})` : 'Official Grievance Portal'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF]">Confirmed Location:</span>
                      <p className="font-medium text-[#F3F4F6] mt-0.5">{locationAddress || 'As per GPS'}</p>
                    </div>
                    <div>
                      <span className="text-[#9CA3AF]">Video Evidence Attached:</span>
                      <p className="font-medium text-[#10B981] mt-0.5 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {recordedBlob ? 'Video recording attached & private signed link generated' : 'None'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[rgba(255,255,255,0.08)]">
                    <span className="text-xs text-[#9CA3AF]">Subject:</span>
                    <p className="font-bold text-[#F3F4F6] text-sm">{subject}</p>
                  </div>
                </div>

                {/* Warning notice */}
                <div className="p-4 bg-[#FFC629]/10 border border-[#FFC629]/30 rounded-xl text-xs text-[#F3F4F6] flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#FFC629] shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-[#FFC629]">Production Safety Notice:</strong> By clicking &quot;Confirm &amp; Send Complaint&quot;,
                    you verify that this road report is genuine and authorize submission to {selectedAuthority?.name}.
                  </div>
                </div>

                {/* Explicit Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                  <button
                    onClick={() => goToStep(4)}
                    disabled={isSubmitting}
                    className="h-11 px-5 rounded-full bg-[#0E1013] border border-[rgba(255,255,255,0.15)] text-[#F3F4F6] hover:bg-[rgba(255,255,255,0.05)] transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Go Back &amp; Edit
                  </button>

                  <div className="flex items-center gap-3 ml-auto">
                    <button
                      onClick={() => navigate('/reports')}
                      className="h-11 px-5 rounded-full bg-transparent text-[#9CA3AF] hover:text-[#F3F4F6] text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={handleSendComplaint}
                      disabled={isSubmitting}
                      className="h-12 px-8 rounded-full bg-[#10B981] text-[#0E1013] font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_4px_14px_rgba(16,185,129,0.25)] disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isUploadingEvidence ? 'Uploading Evidence...' : 'Submitting Complaint...'}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Confirm &amp; Send Complaint
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Success Screen */
              <div className="py-8 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center mx-auto border border-[#10B981]/30">
                  <CheckCircle className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-2xl font-bold font-['Sora',sans-serif] text-[#F3F4F6]">
                    Complaint Successfully Registered!
                  </h3>
                  <p className="text-sm text-[#9CA3AF] mt-1 max-w-md mx-auto">
                    {selectedChannel === 'email'
                      ? `Your formal road complaint has been dispatched to ${selectedAuthority?.name}. A copy has been saved to your account.`
                      : `Your complaint is saved and ready for official portal filing with ${selectedAuthority?.name}.`}
                  </p>
                </div>

                {/* Details box */}
                <div className="p-5 bg-[#0E1013] rounded-2xl border border-[rgba(255,255,255,0.08)] max-w-lg mx-auto text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Complaint ID:</span>
                    <span className="font-mono text-[#F3F4F6]">{submissionSuccess.id || 'Generated'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Status:</span>
                    <span className="font-bold text-[#10B981] capitalize">{submissionSuccess.status?.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#9CA3AF]">Authority:</span>
                    <span className="text-[#F3F4F6]">{selectedAuthority?.name}</span>
                  </div>
                </div>

                {/* Portal Submission Assist if channel was external */}
                {selectedChannel === 'external_portal' && selectedAuthority?.portal_url && (
                  <div className="p-5 bg-[#FFC629]/10 rounded-2xl border border-[#FFC629]/20 max-w-lg mx-auto text-left space-y-3">
                    <h4 className="text-sm font-bold text-[#FFC629] flex items-center gap-1.5">
                      <Globe className="w-4 h-4" /> Next Step: Submit to Official Portal
                    </h4>
                    <p className="text-xs text-[#9CA3AF]">
                      Copy your drafted complaint letter below and paste it directly into {selectedAuthority.name}&apos;s grievance portal.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={copyLetterToClipboard}
                        className="h-9 px-4 rounded-full bg-[#FFC629] text-[#0E1013] font-bold text-xs flex items-center gap-1.5"
                      >
                        {copiedLetter ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedLetter ? 'Copied to Clipboard!' : 'Copy Complaint Letter'}
                      </button>

                      <a
                        href={selectedAuthority.portal_url}
                        target="_blank"
                        rel="noreferrer"
                        className="h-9 px-4 rounded-full bg-[#0E1013] text-[#F3F4F6] border border-[rgba(255,255,255,0.15)] text-xs font-semibold flex items-center gap-1.5 hover:border-[#FFC629]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open Portal
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center gap-4 pt-4">
                  <Link
                    to="/reports"
                    className="h-11 px-6 rounded-full bg-[#FFC629] text-[#0E1013] font-bold text-sm hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    View in My Reports
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => {
                      setSubmissionSuccess(null);
                      setRecordedBlob(null);
                      setPreviewUrl(null);
                      setTranscript('');
                      setSubject('');
                      setBody('');
                      goToStep(1);
                    }}
                    className="h-11 px-6 rounded-full bg-[#0E1013] border border-[rgba(255,255,255,0.15)] text-[#F3F4F6] text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                  >
                    Report Another Hazard
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
