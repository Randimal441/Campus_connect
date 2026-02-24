const buttonVariants = {
  default: 'bg-gradient-to-br from-primary to-primary-light text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200',
  outline: 'border-2 border-primary text-primary bg-white hover:bg-primary/5 shadow-xs hover:shadow-sm transition-all duration-200',
  ghost: 'text-primary hover:bg-primary/10 transition-colors duration-200',
  destructive: 'bg-gradient-to-br from-destructive to-red-500 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
  secondary: 'bg-muted text-foreground hover:bg-muted/80 shadow-xs hover:shadow-sm transition-all duration-200',
};

export default function Button({
  className = '',
  variant = 'default',
  size = 'default',
  disabled,
  children,
  ...props
}) {
  const sizeClasses = {
    sm: 'h-9 px-3 text-sm',
    default: 'h-11 px-6',
    lg: 'h-12 px-8 text-lg',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold font-heading disabled:pointer-events-none disabled:opacity-60 disabled:cursor-not-allowed ${sizeClasses[size] || sizeClasses.default} ${buttonVariants[variant] || buttonVariants.default} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
