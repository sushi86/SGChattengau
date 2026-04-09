import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, hint, id, className = '', ...props }, ref) {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="space-y-1">
        <label htmlFor={inputId} className="block text-sm font-medium text-text-heading">
          {label}
          {props.required && <span className="text-error ml-0.5">*</span>}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-md border px-4 py-3 text-text-heading
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            ${error ? 'border-error' : 'border-border'}
            ${className}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-text-body">{hint}</p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-error">{error}</p>
        )}
      </div>
    )
  }
)
