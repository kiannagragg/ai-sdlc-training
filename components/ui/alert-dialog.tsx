'use client';

import { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  return open ? (
    <AlertDialogPortal onClose={() => onOpenChange(false)}>
      {children}
    </AlertDialogPortal>
  ) : null;
}

function AlertDialogPortal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    contentRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      />
      <div
        ref={contentRef}
        role="alertdialog"
        aria-modal="true"
        tabIndex={-1}
        className="relative z-50 w-full max-w-lg rounded-xl border bg-card p-6 shadow-2xl animate-in fade-in-0 zoom-in-95"
      >
        {children}
      </div>
    </div>
  );
}

export function AlertDialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function AlertDialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mt-6 flex items-center justify-end gap-3', className)}>{children}</div>;
}

export function AlertDialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn('text-lg font-semibold text-foreground', className)}>{children}</h2>;
}

export function AlertDialogDescription({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <p id={id} className={cn('mt-1 text-sm text-muted-foreground', className)}>{children}</p>;
}

export function AlertDialogAction({ children, className, disabled, onClick }: { children: React.ReactNode; className?: string; disabled?: boolean; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function AlertDialogCancel({ children, className, disabled, onClick }: { children: React.ReactNode; className?: string; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function AlertDialogContent({ children, role, 'aria-describedby': ariaDescribedBy, onEscapeKeyDown, onPointerDownOutside }: {
  children: React.ReactNode;
  role?: string;
  'aria-describedby'?: string;
  onEscapeKeyDown?: (e: KeyboardEvent) => void;
  onPointerDownOutside?: (e: Event) => void;
}) {
  useEffect(() => {
    if (!onEscapeKeyDown) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscapeKeyDown(e);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onEscapeKeyDown]);

  return <div role={role} aria-describedby={ariaDescribedBy}>{children}</div>;
}
