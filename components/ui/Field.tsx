import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';

const fieldClass =
  'w-full rounded-xl border border-line bg-coal px-4 py-3 text-base text-paper placeholder:text-mist/60 focus:border-gold focus:outline-none';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string | null;
}

export function TextField({ label, hint, error, className = '', ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-paper/90 text-sm font-medium">
        {label}
      </label>
      <input id={id} className={fieldClass} aria-invalid={Boolean(error)} {...rest} />
      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-mist text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}

export function TextArea({ label, hint, className = '', ...rest }: TextAreaProps) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-paper/90 text-sm font-medium">
        {label}
      </label>
      <textarea id={id} rows={3} className={`${fieldClass} resize-y`} {...rest} />
      {hint && <p className="text-mist text-xs">{hint}</p>}
    </div>
  );
}
