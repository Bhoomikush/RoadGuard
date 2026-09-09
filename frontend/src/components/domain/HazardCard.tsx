import { MapPin, Calendar, Clock } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { SeverityBadge } from '../ui/SeverityBadge';
import { StatusBadge } from '../ui/StatusBadge';
import type { Hazard } from '../../types';

interface HazardCardProps {
  hazard: Hazard;
}

export function HazardCard({ hazard }: HazardCardProps) {
  // Format the date
  const date = new Date(hazard.createdAt);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <Card className="group hover:border-teal-500/50 transition-colors cursor-pointer overflow-hidden flex flex-col h-full">
      {hazard.imageUrl ? (
        <div className="h-48 bg-slate-800 relative overflow-hidden">
          <img 
            src={hazard.imageUrl} 
            alt={hazard.type} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent"></div>
          <div className="absolute top-3 right-3 flex gap-2">
            <StatusBadge status={hazard.status} />
          </div>
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-lg font-bold text-white">{hazard.type}</h3>
          </div>
        </div>
      ) : (
        <div className="p-4 border-b border-slate-800 flex justify-between items-start">
          <h3 className="text-lg font-bold text-slate-100">{hazard.type}</h3>
          <StatusBadge status={hazard.status} />
        </div>
      )}
      
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          <div className="flex items-start text-sm text-slate-400">
            <MapPin className="w-4 h-4 mr-2 mt-0.5 text-slate-500 shrink-0" />
            <span className="line-clamp-2">{hazard.location}</span>
          </div>
          <div className="flex items-center text-sm text-slate-400">
            <Calendar className="w-4 h-4 mr-2 text-slate-500 shrink-0" />
            <span>{formattedDate}</span>
            <Clock className="w-4 h-4 ml-3 mr-1 text-slate-500 shrink-0" />
            <span>{formattedTime}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
          <span className="text-sm text-slate-500 font-medium">Severity</span>
          <SeverityBadge severity={hazard.severity} />
        </div>
      </CardContent>
    </Card>
  );
}
