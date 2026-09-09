import { Badge } from './Badge';
import type { HazardStatus } from '../../types';

interface StatusBadgeProps {
  status: HazardStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const variant = 
    status === 'active' ? 'danger' :
    status === 'under-repair' ? 'warning' :
    status === 'fixed' ? 'success' : 'default';
    
  const label = status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
