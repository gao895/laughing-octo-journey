import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { useMemoryRouter } from '../router';

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string };

export default function Link({ href, onClick, target: _target, ...rest }: LinkProps) {
  const router = useMemoryRouter();
  return (
    <a
      href={`#${href.replace(/[^a-zA-Z0-9._~-]/g, '')}`}
      {...rest}
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        e.preventDefault();
        router.navigate(href);
      }}
    />
  );
}
