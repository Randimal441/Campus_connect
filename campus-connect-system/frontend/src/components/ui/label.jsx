export default function Label({ htmlFor, className = '', required, children, ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-semibold font-heading text-foreground mb-1.5 ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}
