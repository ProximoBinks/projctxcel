"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Native modal semantics, focus containment, Escape and focus restoration. */
export default function AdminDialog({ children, label, onClose, width = "max-w-md" }: {
  children: ReactNode;
  label: string;
  onClose: () => void;
  width?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      className={`m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl border-0 bg-white p-0 shadow-xl backdrop:bg-black/50 ${width}`}
    >
      {children}
    </dialog>
  );
}
