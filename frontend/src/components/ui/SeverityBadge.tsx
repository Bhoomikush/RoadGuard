import { Badge } from './Badge';
import type { HazardSeverity } from '../../types';

interface SeverityBadgeProps {
  severity: HazardSeverity;
  className?: string;
}

export function SeverityBadge({ severity, className = '' }: SeverityBadgeProps) {
  const sev = (severity || 'low').toString().toLowerCase();
  const variant = 
    sev === 'high' || sev === 'critical' ? 'danger' :
    sev === 'medium' ? 'warning' : 'success';
    
  return (
    <Badge variant={variant} className={className}>
      {sev.toUpperCase()}
    </Badge>
  );
}
