import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from './icons';

interface BackLinkProps {
  to: string;
  children?: string;
}

export function BackLink({ to, children = 'Back to Board' }: BackLinkProps) {
  return (
    <Link to={to} className="back-link">
      <ArrowLeftIcon width={16} height={16} />
      {children}
    </Link>
  );
}