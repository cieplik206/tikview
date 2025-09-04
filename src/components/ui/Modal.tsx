import React, { useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: ModalSize;
  showClose?: boolean;
  persistent?: boolean;
  className?: string;
  children: ReactNode;
  headerSlot?: ReactNode;
  footerSlot?: ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title = '',
  size = 'md',
  showClose = true,
  persistent = false,
  className = '',
  children,
  headerSlot,
  footerSlot,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !persistent && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, persistent, onClose]);

  const getModalClasses = () => {
    const base = 'modal-box bg-base-100 shadow-xl';
    
    const sizes = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      full: 'max-w-full'
    };
    
    return [base, sizes[size], className].filter(Boolean).join(' ');
  };

  const handleClose = () => {
    if (!persistent) {
      onClose();
    }
  };

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === backdropRef.current) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            ref={modalRef}
            className={`${getModalClasses()} transition-all duration-300 ${
              isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            }`}
          >
            {/* Header */}
            {(title || headerSlot) && (
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                  {headerSlot || title}
                </h3>
                {showClose && (
                  <button
                    onClick={handleClose}
                    className="btn btn-sm btn-circle btn-ghost"
                    type="button"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            
            {/* Body */}
            <div className="text-base-content/70">
              {children}
            </div>
            
            {/* Footer */}
            {footerSlot && (
              <div className="modal-action">
                {footerSlot}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;