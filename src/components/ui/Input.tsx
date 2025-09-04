import React, { useState, useId } from 'react';
import { AlertCircle } from 'lucide-react';

type InputSize = 'xs' | 'sm' | 'md' | 'lg';
type InputVariant = 'bordered' | 'ghost' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error';

interface InputProps {
  value?: string | number;
  label?: string;
  type?: string;
  placeholder?: string;
  icon?: React.ComponentType<{ className?: string }>;
  error?: string;
  hint?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  size?: InputSize;
  variant?: InputVariant;
  id?: string;
  showError?: boolean;
  className?: string;
  onChange?: (value: string) => void;
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

const Input: React.FC<InputProps> = ({
  value = '',
  label = '',
  type = 'text',
  placeholder = '',
  icon: Icon,
  error = '',
  hint = '',
  disabled = false,
  readOnly = false,
  required = false,
  size = 'md',
  variant = 'bordered',
  id: providedId,
  showError = true,
  className = '',
  onChange,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const generatedId = useId();
  const inputId = providedId || generatedId;

  const getInputClasses = () => {
    const base = 'input w-full transition-all duration-200';
    
    // Size modifiers
    const sizeMap: Record<InputSize, string> = {
      xs: 'input-xs',
      sm: 'input-sm',
      md: 'input-md',
      lg: 'input-lg'
    };
    
    // Variant modifiers
    const variantMap: Record<InputVariant, string> = {
      bordered: 'input-bordered',
      ghost: 'input-ghost',
      primary: 'input-primary',
      secondary: 'input-secondary',
      accent: 'input-accent',
      info: 'input-info',
      success: 'input-success',
      warning: 'input-warning',
      error: 'input-error'
    };
    
    const iconPadding = Icon ? 'pl-10' : '';
    const errorClass = showError && error ? 'input-error' : '';
    const disabledClass = disabled ? 'input-disabled opacity-50 cursor-not-allowed' : '';
    const focusClass = isFocused ? 'input-focus' : '';
    
    return [
      base,
      sizeMap[size],
      !error ? variantMap[variant] : '',
      iconPadding,
      errorClass,
      disabledClass,
      focusClass,
      className
    ].filter(Boolean).join(' ');
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      onChange(event.target.value);
    }
  };

  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (onFocus) {
      onFocus(event);
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    if (onBlur) {
      onBlur(event);
    }
  };

  return (
    <div className="form-control w-full">
      {label && (
        <label htmlFor={inputId} className="label">
          <span className="label-text text-base-content">{label}</span>
          {required && <span className="label-text-alt text-error">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-base-content/50" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          className={getInputClasses()}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {showError && error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-error" />
          </div>
        )}
      </div>
      {((showError && error) || hint) && (
        <label className="label">
          {showError && error ? (
            <span className="label-text-alt text-error">{error}</span>
          ) : hint ? (
            <span className="label-text-alt text-base-content/70">{hint}</span>
          ) : null}
        </label>
      )}
    </div>
  );
};

export default Input;