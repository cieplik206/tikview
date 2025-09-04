import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error' | 'ghost' | 'link';
type ButtonStyle = '' | 'outline' | 'soft' | 'dash';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type ButtonShape = '' | 'square' | 'circle' | 'wide' | 'block';

interface ButtonProps {
  variant?: ButtonVariant;
  style?: ButtonStyle;
  size?: ButtonSize;
  shape?: ButtonShape;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  loading?: boolean;
  active?: boolean;
  fullWidth?: boolean;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  style = '',
  size = 'md',
  shape = '',
  type = 'button',
  disabled = false,
  loading = false,
  active = false,
  fullWidth = false,
  className = '',
  onClick,
  children,
  ...props
}) => {
  const getButtonClasses = () => {
    const base = 'btn';
    
    // Color variants
    const variantMap: Record<ButtonVariant, string> = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      accent: 'btn-accent',
      neutral: 'btn-neutral',
      info: 'btn-info',
      success: 'btn-success',
      warning: 'btn-warning',
      error: 'btn-error',
      ghost: 'btn-ghost',
      link: 'btn-link'
    };
    
    // DaisyUI style modifiers
    const styleMap: Record<string, string> = {
      outline: 'btn-outline',
      soft: 'btn-soft',
      dash: 'btn-dash'
    };
    
    // Size modifiers
    const sizeMap: Record<ButtonSize, string> = {
      xs: 'btn-xs',
      sm: 'btn-sm',
      md: 'btn-md',
      lg: 'btn-lg',
      xl: 'btn-xl'
    };
    
    // Shape modifiers
    const shapeMap: Record<string, string> = {
      square: 'btn-square',
      circle: 'btn-circle',
      wide: 'btn-wide',
      block: 'btn-block'
    };
    
    const width = fullWidth ? 'btn-block' : '';
    const activeClass = active ? 'btn-active' : '';
    const disabledClass = disabled ? 'btn-disabled' : '';
    
    return [
      base,
      variantMap[variant],
      style ? styleMap[style] : '',
      sizeMap[size],
      shape ? shapeMap[shape] : '',
      width,
      activeClass,
      disabledClass,
      className
    ].filter(Boolean).join(' ');
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading && onClick) {
      onClick(event);
    }
  };

  return (
    <button
      type={type}
      className={getButtonClasses()}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && <span className="loading loading-spinner loading-xs"></span>}
      {children}
    </button>
  );
};

export default Button;