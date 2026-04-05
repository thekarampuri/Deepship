import React from 'react';

type ButtonVariant = 'default' | 'outline' | 'ghost';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    'bg-[hsl(var(--lp-accent))] text-[hsl(var(--lp-accent-foreground))] hover:opacity-90 shadow-sm',
  outline:
    'border border-[hsl(var(--lp-border))] bg-transparent text-[hsl(var(--lp-text))] hover:bg-[hsl(var(--lp-bg))]',
  ghost:
    'bg-transparent text-[hsl(var(--lp-text-muted))] hover:text-[hsl(var(--lp-text))] hover:bg-[hsl(var(--lp-bg))]',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-10 px-5 py-2 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-12 px-8 py-3 text-base',
  icon: 'h-10 w-10',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--lp-ring))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      />
    );
  },
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
