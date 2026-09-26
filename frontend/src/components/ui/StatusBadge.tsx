import { Badge } from './Badge';
import type { HazardStatus } from '../../types';

interface StatusBadgeProps {
  status: HazardStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const getVariant = (s: string) => {
    if (s === 'resolved' || s === 'fixed') return 'success';
    if (s === 'in_progress' || s === 'under-repair' || s === 'under_review') return 'warning';
    if (s === 'pending' || s === 'active') return 'danger';
    return 'default';
  };

  const getLabel = (s: string) => {
    if (s === 'pending') return 'Reported';
    if (s === 'under_review') return 'Under Review';
    if (s === 'in_progress') return 'In Progress';
    if (s === 'resolved') return 'Resolved';
    return s.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Badge variant={getVariant(status as string)} className={className}>
      {getLabel(status as string)}
    </Badge>
  );
}
