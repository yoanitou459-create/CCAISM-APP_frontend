import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { ModalPortal } from './ModalPortal';

export type FeedbackToastType = 'success' | 'error';

interface FeedbackToastProps {
  message: { type: FeedbackToastType; text: string } | null;
  onDismiss?: () => void;
}

/** Toast de confirmation après ajout / modification — toujours au premier plan. */
export const FeedbackToast: React.FC<FeedbackToastProps> = ({ message, onDismiss }) => {
  return (
    <ModalPortal>
      <AnimatePresence>
        {message && (
          <motion.div
            key="app-feedback-toast"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: -24, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -16, x: '-50%' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed top-[5.5rem] sm:top-6 left-1/2 z-[600] max-w-[min(92vw,28rem)] w-max
              flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-[0_12px_40px_rgba(20,50,30,0.2)]
              border backdrop-blur-xl ${
                message.type === 'success'
                  ? 'bg-white/95 border-emerald-200/80 text-[#1A3D18]'
                  : 'bg-white/95 border-rose-200/80 text-[#1A3D18]'
              }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                message.type === 'success'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-600'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0 pt-0.5 flex-1">
              <p className={`text-[10px] font-black uppercase tracking-[0.14em] mb-0.5 ${
                message.type === 'success' ? 'text-emerald-700' : 'text-rose-600'
              }`}>
                {message.type === 'success' ? 'Enregistré' : 'Attention'}
              </p>
              <p className="text-sm font-semibold leading-snug">{message.text}</p>
            </div>
            {onDismiss && (
              <button
                type="button"
                onClick={onDismiss}
                className="p-1.5 rounded-lg text-[#1A3D18]/40 hover:text-[#1A3D18] hover:bg-black/5 transition-colors shrink-0"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
};

/** Messages clairs selon la section et le mode (ajout / modification). */
export function buildDetailFeedbackMessage(
  section: string,
  mode: 'add' | 'edit' = 'edit'
): string {
  const labels: Record<string, { add: string; edit: string }> = {
    'Informations générales': {
      add: 'Informations générales enregistrées.',
      edit: 'Informations générales mises à jour.',
    },
    'Métiers & expertises': {
      add: 'Métiers et expertises enregistrés.',
      edit: 'Métiers et expertises mis à jour.',
    },
    Certifications: {
      add: 'Certification ajoutée.',
      edit: 'Certification mise à jour.',
    },
    'Données financières': {
      add: 'Donnée financière ajoutée.',
      edit: 'Donnée financière mise à jour.',
    },
    Besoins: {
      add: 'Besoin ajouté.',
      edit: 'Besoin mis à jour.',
    },
    Contacts: {
      add: 'Contact ajouté.',
      edit: 'Contact mis à jour.',
    },
    Cotisations: {
      add: 'Cotisation ajoutée.',
      edit: 'Cotisation mise à jour.',
    },
  };

  const entry = labels[section];
  if (entry) return mode === 'add' ? entry.add : entry.edit;
  return mode === 'add' ? 'Informations ajoutées.' : 'Modifications enregistrées.';
}
