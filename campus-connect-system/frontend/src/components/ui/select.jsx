export default function Select({
  value,
  onValueChange,
  placeholder = 'Select...',
  children,
  className = '',
  required,
}) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      required={required}
      className={`flex h-11 w-full rounded-lg border-2 border-[#D4CFC4] bg-white px-3 py-2 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${className}`}
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
}

export function SelectTrigger({ children, className = '' }) {
  return children;
}

export function SelectContent({ children }) {
  return children;
}

export function SelectItem({ value, children }) {
  return <option value={value}>{children}</option>;
}

export function SelectValue({ placeholder }) {
  return placeholder;
}
