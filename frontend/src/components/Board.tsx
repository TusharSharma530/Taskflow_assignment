import type { ReactNode } from 'react';

interface BoardProps {
  children: ReactNode;
}

export function Board({ children }: BoardProps) {
  return <div className="board">{children}</div>;
}