import { useState } from 'react';
import { Camera, Video, MapPin, Send } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { UploadZone } from '../components/domain/UploadZone';
import { DetectionResult } from '../components/domain/DetectionResult';

export function ReportPage() {
  const [reportType, setReportType] = useState<'photo' | 'video'>('photo');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleFileSelect = () => {
    // Simulate AI processing delay
    setIsAnalyzing(true);
    setShowResult(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 2500);
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
                onClick={() => setReportType('video')}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md text-sm font-medium transition-all ${
                  reportType === 'video'
                    ? 'bg-slate-800 text-teal-400 shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Video className="w-4 h-4 mr-2" />
                Video Report
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h3 className="text-lg font-semibold text-slate-100 mb-4">1. Media Upload</h3>
              <UploadZone type={reportType} onFileSelect={handleFileSelect} />
            </section>

            {showResult && (
              <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">2. AI Analysis</h3>
                <DetectionResult 
                  type="Severe Pothole" 
                  confidence={96} 
                  severity="high" 
                  isProcessing={isAnalyzing} 
                />
              </section>
            )}

            <section className={showResult && !isAnalyzing ? 'opacity-100' : 'opacity-50 pointer-events-none'}>
              <h3 className="text-lg font-semibold text-slate-100 mb-4">3. Location</h3>
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <Button variant="secondary" icon={MapPin} className="w-full sm:w-auto">
                      Use Current Location
                    </Button>
                    <div className="flex-1">
                      <input 
                        type="text" 
                        placeholder="Or enter nearest address / landmark"
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                  </div>
                  
                  {/* Placeholder for actual map */}
                  <div className="w-full h-48 bg-slate-950 rounded-lg border border-slate-800 relative overflow-hidden flex items-center justify-center">
                     <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                     <MapPin className="w-8 h-8 text-teal-500 absolute" />
                     <p className="text-sm text-slate-500 absolute bottom-4">Map Location Selector UI</p>
                  </div>
                  
                  <div className="flex gap-4 mt-4 text-xs text-slate-500 font-mono">
                    <span>Lat: 34.0522</span>
                    <span>Lng: -118.2437</span>
                  </div>
                </CardContent>
              </Card>
            </section>
            
            <div className={`pt-6 ${showResult && !isAnalyzing ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <Button size="lg" className="w-full h-14 text-lg" icon={Send}>
                Submit Hazard Report
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
