import { Link, useMatch, useResolvedPath } from 'react-router-dom';
import type { LinkProps } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavLinkProps extends LinkProps {
  activeClassName?: string;
  end?: boolean;
}

export function NavLink({ 
  to, 
  children, 
  className, 
  activeClassName = 'bg-accent text-accent-foreground', 
  end = false,
  ...props 
}: NavLinkProps) {
  const resolved = useResolvedPath(to);
  const match = useMatch({ path: resolved.pathname, end });

  return (
    <Link
      to={to}
      className={cn(className, match ? activeClassName : 'text-white')}
      {...props}
    >
      {children}
    </Link>
  );
}
