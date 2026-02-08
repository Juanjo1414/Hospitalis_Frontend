import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
  children: ReactNode;
};

export const Button = ({ variant = 'primary', className = '', ...props }: ButtonProps) => {
  return (
    <button className={`btn ${variant} ${className}`} {...props} />
  );
};