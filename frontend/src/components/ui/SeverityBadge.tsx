import { Badge } from './Badge';
import type { HazardSeverity } from '../../types';

interface SeverityBadgeProps {
  severity: HazardSeverity;
  className?: string;
}

export function SeverityBadge({ severity, className = '' }: SeverityBadgeProps) {
  const variant = 
    severity === 'high' ? 'danger' :
    severity === 'medium' ? 'warning' : 'success';
    
  return (
    <Badge variant={variant} className={className}>
      {severity.toUpperCase()}
    </Badge>
  );
}
