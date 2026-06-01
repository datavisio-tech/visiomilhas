"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type HTMLAttributes,
  type ReactNode,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";

type DropdownContextValue = {
  isOpen: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  triggerRef: RefObject<HTMLButtonElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
};

const DropdownContext = createContext<DropdownContextValue | null>(null);

export function DropdownMenu({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const value = { isOpen, setOpen: setIsOpen, triggerRef, contentRef };

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (contentRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [isOpen]);

  return (
    <DropdownContext.Provider value={value}>
      {children}
    </DropdownContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const context = useContext(DropdownContext);
  if (!context) return null;

  return (
    <button
      ref={context.triggerRef}
      type="button"
      className={className}
      onClick={() => context.setOpen(!context.isOpen)}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const context = useContext(DropdownContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!context?.isOpen || !mounted) return null;

  const triggerRect = context.triggerRef.current?.getBoundingClientRect();
  const estimatedHeight = 280;
  const spacing = 8;
  const bottomSpace = window.innerHeight - (triggerRect?.bottom ?? 0);
  const topSpace = triggerRect?.top ?? 0;
  const shouldOpenAbove =
    bottomSpace < estimatedHeight && topSpace > estimatedHeight;
  const top = shouldOpenAbove
    ? Math.max(
        (triggerRect?.top ?? 0) + window.scrollY - estimatedHeight - spacing,
        12,
      )
    : (triggerRect?.bottom ?? 0) + window.scrollY + spacing;
  const left = Math.min(
    Math.max((triggerRect?.right ?? 0) + window.scrollX - 240, 12),
    window.innerWidth - 260,
  );

  return createPortal(
    <div
      ref={context.contentRef}
      className={`fixed z-50 min-w-60 max-h-[calc(100vh-24px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.14)] ${className}`}
      style={{ top, left }}
    >
      {children}
    </div>,
    document.body,
  );
}

export function DropdownMenuItem({
  children,
  className = "",
  onClick,
  destructive = false,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  destructive?: boolean;
}) {
  const context = useContext(DropdownContext);

  return (
    <button
      type="button"
      className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition ${
        destructive
          ? "text-rose-700 hover:bg-rose-50"
          : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
      } ${className}`}
      onClick={() => {
        onClick?.();
        context?.setOpen(false);
      }}
    >
      {children}
    </button>
  );
}

export function DropdownMenuLabel({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 ${className}`}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className = "",
}: {
  className?: string;
}) {
  return <div className={`my-2 h-px bg-slate-100 ${className}`} />;
}
