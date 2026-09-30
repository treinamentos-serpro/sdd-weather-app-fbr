import { useEffect, useRef } from 'react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  const panelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <section
      aria-atomic="true"
      aria-live="assertive"
      className="flex min-h-[420px] items-center justify-center rounded-3xl border border-red-300/20 bg-red-400/10 p-5 text-center shadow-glass backdrop-blur-md sm:p-6"
      ref={panelRef}
      role="alert"
      tabIndex={-1}
    >
      <div className="max-w-md">
        <p className="text-lg font-medium text-white">{message}</p>
        <button
          className="mt-5 rounded-xl bg-accent-500 px-5 py-3 font-semibold text-white transition hover:bg-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 focus:ring-offset-night-900"
          onClick={onRetry}
          type="button"
        >
          Tentar novamente
        </button>
      </div>
    </section>
  );
}
