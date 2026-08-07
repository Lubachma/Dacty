import { AnimatePresence, motion } from 'framer-motion';
import { useToasts } from '@/state/toastStore';
import { useT } from '@/i18n';

export function ToastHost() {
  const t = useT();
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.button
            key={toast.id}
            type="button"
            onClick={() => dismiss(toast.id)}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            className="pointer-events-auto rounded-xl border border-line bg-surface p-4 text-left shadow-lg backdrop-blur"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              {toast.kind === 'achievement' ? t('toast.achievement') : t('toast.info')}
            </p>
            <p className="font-bold">{toast.title}</p>
            {toast.description && <p className="text-sm text-muted">{toast.description}</p>}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
