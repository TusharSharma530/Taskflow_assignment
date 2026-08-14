import type { ReactNode, SelectHTMLAttributes } from 'react';
import type { Priority } from '../types';
import { ChevronDownIcon } from './icons';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  value: string | number;
  onChange: (value: string) => void;
  /** When provided, renders a colored dot indicating the selected priority. */
  priorityDot?: Priority | null;
  children: ReactNode;
}

export function Select({ value, onChange, priorityDot, children, ...rest }: SelectProps) {
  return (
    <div className={`select-wrap${priorityDot ? ' select-wrap-dot' : ''}`}>
      {priorityDot ? (
        <span className={`select-dot select-dot-${priorityDot.toLowerCase()}`} aria-hidden="true" />
      ) : null}
      <select className="styled-select" value={value} onChange={(event) => onChange(event.target.value)} {...rest}>
        {children}
      </select>
      <ChevronDownIcon width={16} height={16} className="select-chevron" />
    </div>
  );
}