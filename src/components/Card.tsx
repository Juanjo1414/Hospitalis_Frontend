import type { HTMLAttributes, ReactNode } from 'react';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export const Card = ({ className = '', ...props }: CardProps) => {
  return <div className={`card ${className}`} {...props} />;
};