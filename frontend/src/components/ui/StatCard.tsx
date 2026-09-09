import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className = '' }: StatCardProps) {
  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
            <h4 className="text-2xl font-bold text-slate-50">{value}</h4>
          </div>
          <div className="w-12 h-12 bg-slate-800/50 rounded-lg flex items-center justify-center">
            <Icon className="w-6 h-6 text-teal-500" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            <span className={`font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend.isPositive ? '+' : '-'}{trend.value}
            </span>
            <span className="text-slate-500 ml-2">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
