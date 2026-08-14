import type { Filter } from '../types';

const OPTIONS: Array<{ value: Filter; label: string }> = [
  { value: 'ALL', label: 'All priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

interface PriorityFilterProps {
  value: Filter;
  onChange: (value: Filter) => void;
  label?: string;
  id?: string;
}

export function PriorityFilter({ value, onChange, label = 'Priority', id }: PriorityFilterProps) {
  return (
    <div className="select-control">
      {label ? (
        <label className="select-label" htmlFor={id}>
          {label}
        </label>
      ) : null}
      <select
        id={id}
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value as Filter)}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}