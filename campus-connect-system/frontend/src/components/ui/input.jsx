import { forwardRef } from 'react';

const Input = forwardRef(({ className = '', ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`flex h-11 w-full rounded-xl border-[1.5px] border-border bg-background px-4 py-2.5 text-foreground font-body text-sm transition-all duration-200 placeholder:text-muted-foreground placeholder:opacity-70 hover:border-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted ${className}`}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
