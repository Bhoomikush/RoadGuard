import { Bot, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { SeverityBadge } from '../ui/SeverityBadge';
import type { HazardSeverity } from '../../types';

interface DetectionResultProps {
  type: string;
  confidence: number;
  severity: HazardSeverity;
  isProcessing?: boolean;
}

export function DetectionResult({ type, confidence, severity, isProcessing = false }: DetectionResultProps) {
  if (isProcessing) {
    return (
      <Card className="bg-slate-900 border-teal-500/30 overflow-hidden relative">
        <div className="absolute inset-0 bg-teal-500/5 animate-pulse"></div>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full border-2 border-teal-500/20 border-t-teal-500 animate-spin"></div>
              <Bot className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h4 className="text-slate-200 font-medium">RoadGuard AI is analyzing...</h4>
              <p className="text-sm text-slate-400">Detecting hazards and evaluating severity</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900 border-teal-500/50 shadow-[0_0_15px_rgba(20,184,166,0.1)]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
              <Bot className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">AI Detection Result</h3>
              <p className="text-xs text-teal-400 flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Analysis complete
              </p>
            </div>
          </div>
          <SeverityBadge severity={severity} />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
            <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Detected Object</p>
            <p className="text-lg font-semibold text-slate-100">{type}</p>
          </div>
          <div className="bg-slate-950 rounded-lg p-4 border border-slate-800">
            <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wider">Confidence</p>
            <div className="flex items-end gap-2">
              <p className="text-lg font-semibold text-teal-400">{confidence}%</p>
              <div className="flex-1 h-2 bg-slate-800 rounded-full mb-1.5 overflow-hidden">
                <div className="h-full bg-teal-500 rounded-full" style={{ width: `${confidence}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
