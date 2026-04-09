import { TextareaHTMLAttributes, forwardRef } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, hint, id, className = '', ...props }, ref) {
    const textareaId = id || label.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1">
        <label htmlFor={textareaId} className="block text-sm font-medium text-text-heading">
          {label}
          {props.required && <span className="text-error ml-0.5">*</span>}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full rounded-md border px-4 py-3 text-text-heading
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            ${error ? 'border-error' : 'border-border'} ${className}`}
          aria-invalid={!!error}
          rows={4}
          {...props}
        />
        {hint && !error && <p className="text-xs text-text-body">{hint}</p>}
        {error && <p className="text-sm text-error">{error}</p>}
      </div>
    )
  }
)
