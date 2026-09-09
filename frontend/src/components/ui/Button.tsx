import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', icon: Icon, iconPosition = 'left', children, ...props }, ref) => {
    
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none';
    
    const variants = {
      primary: 'bg-teal-500 text-white hover:bg-teal-600',
      secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700',
      outline: 'border border-slate-700 text-slate-100 hover:bg-slate-800',
      ghost: 'text-slate-300 hover:text-slate-50 hover:bg-slate-800/50',
      danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base'
    };

    const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
      <button ref={ref} className={classes} {...props}>
        {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 mr-2" />}
        {children}
        {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 ml-2" />}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
