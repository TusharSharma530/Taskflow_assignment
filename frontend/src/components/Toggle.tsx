interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  labelledBy?: string;
}

export function Toggle({ checked, onChange, label, labelledBy }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-labelledby={labelledBy}
      className={`toggle ${checked ? 'toggle-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-thumb" />
    </button>
  );
}