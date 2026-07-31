import { AnimatePresence, motion } from 'framer-motion';
import { useToasts } from '@/state/toastStore';

export function ToastHost() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.button
            key={t.id}
            type="button"
            onClick={() => dismiss(t.id)}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            className="pointer-events-auto rounded-xl border border-line bg-surface p-4 text-left shadow-lg backdrop-blur"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              {t.kind === 'achievement' ? 'Succès débloqué' : 'Info'}
            </p>
            <p className="font-bold">{t.title}</p>
            {t.description && <p className="text-sm text-muted">{t.description}</p>}
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
