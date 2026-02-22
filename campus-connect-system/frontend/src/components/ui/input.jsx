import { forwardRef } from 'react';

const Input = forwardRef(({ className = '', ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`flex h-11 w-full rounded-lg border-2 border-[#D4CFC4] bg-white px-3 py-2 text-foreground placeholder:text-[#9CA39C] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export { Input };
