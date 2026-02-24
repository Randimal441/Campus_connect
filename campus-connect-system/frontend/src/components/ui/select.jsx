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
      className={`flex h-11 w-full appearance-none rounded-xl border-[1.5px] border-border bg-background px-4 py-2.5 pr-10 text-foreground font-body text-sm transition-all duration-200 cursor-pointer hover:border-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%2378716c%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3E%3C/svg%3E')] bg-[length:1.5em_1.5em] bg-[position:right_0.75rem_center] bg-no-repeat ${className}`}
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
