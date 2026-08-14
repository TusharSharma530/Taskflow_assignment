import { useEffect, useRef } from 'react';
import { SearchIcon } from './icons';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Search tasks...' }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onFocusSearch = (): void => {
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    document.addEventListener('taskflow:focus-search', onFocusSearch);
    return () => document.removeEventListener('taskflow:focus-search', onFocusSearch);
  }, []);

  return (
    <div className="search-input">
      <SearchIcon width={16} height={16} />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}