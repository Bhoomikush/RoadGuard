import { Badge } from './Badge';
import type { HazardStatus } from '../../types';

interface StatusBadgeProps {
  status: HazardStatus;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const s = (status || 'pending').toString().toLowerCase();

  const getVariant = (val: string) => {
    if (val === 'resolved' || val === 'fixed') return 'success';
    if (val === 'in_progress' || val === 'under-repair' || val === 'under_review') return 'warning';
    if (val === 'pending' || val === 'active') return 'danger';
    return 'default';
  };

  const getLabel = (val: string) => {
    if (val === 'pending') return 'Reported';
    if (val === 'under_review') return 'Under Review';
    if (val === 'in_progress') return 'In Progress';
    if (val === 'resolved') return 'Resolved';
    return val.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <Badge variant={getVariant(s)} className={className}>
      {getLabel(s)}
    </Badge>
  );
}
