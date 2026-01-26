/**
 * Reusable Modal Component
 * Supports overlay click, ESC key, and focus management
 */

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Store previous active element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Focus modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 0);
    } else {
      // Restore focus when modal closes
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
      onClick={(e) => {
        // Close on overlay click (not on modal content)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-md border border-slate-200 bg-white p-6 shadow-xl"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 id="modal-title" className="m-0 text-xl font-semibold">{title}</h3>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-transparent text-lg leading-none text-slate-400 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-slate-700"
            onClick={onClose}
            aria-label="Đóng"
          >
            ×
          </button>
        </div>
        <div className="mb-6">
          {children}
        </div>
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
