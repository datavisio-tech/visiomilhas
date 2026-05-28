"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type HTMLAttributes,
  type ReactNode,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";

type DialogContextValue = {
  isOpen: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const DialogContext = createContext<DialogContextValue | null>(null);

export function Dialog({
  isOpen,
  onOpenChange,
  children,
}: {
  isOpen: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
}) {
  const value = { isOpen, setOpen: onOpenChange };

  return (
    <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
  );
}
export default Dialog;

export function DialogTrigger({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const context = useContext(DialogContext);
  if (!context) return null;

  return (
    <button
      type="button"
      className={className}
      onClick={() => context.setOpen(true)}
    >
      {children}
    </button>
  );
}

export function DialogContent({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const context = useContext(DialogContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!context?.isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        context.setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [context]);

  if (!context?.isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        aria-label="Fechar diálogo"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        onClick={() => context.setOpen(false)}
      />
      <div
        className={`relative z-10 max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_120px_rgba(15,23,42,0.18)] ${className}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function DialogHeader({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={`space-y-2 ${className}`} {...props} />;
}

export function DialogTitle({
  className = "",
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={`text-2xl font-semibold tracking-[-0.03em] text-slate-950 ${className}`}
      {...props}
    />
  );
}

export function DialogDescription({
  className = "",
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm leading-6 text-slate-600 ${className}`} {...props} />
  );
}

export function DialogFooter({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mt-6 flex flex-wrap items-center justify-end gap-3 ${className}`}
      {...props}
    />
  );
}
