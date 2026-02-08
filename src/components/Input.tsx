import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const Input = ({ label, className = '', ...props }: InputProps) => {
  return (
    <label className={`input-field ${className}`}>
      {label ? <span className="input-label">{label}</span> : null}
      <input className="input-control" {...props} />
    </label>
  );
};