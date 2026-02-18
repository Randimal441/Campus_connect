const buttonVariants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary-dark',
  outline: 'border-2 border-primary text-primary hover:bg-primary/10',
  ghost: 'hover:bg-primary/10',
};

export default function Button({
  className = '',
  variant = 'default',
  disabled,
  children,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-semibold transition-colors disabled:pointer-events-none disabled:opacity-70 ${buttonVariants[variant] || buttonVariants.default} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
