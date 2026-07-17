import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ArrowLeft, Check, Info, ShieldAlert } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { ModalPortal } from './ModalPortal';

export type ConfirmationVariant = 'danger' | 'warning' | 'info';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  /** Titre court (ex. « Supprimer cet utilisateur ? ») */
  title?: string;
  /** Texte explicatif sous le titre */
  description?: string;
  /** Détail mis en avant (nom, montant, etc.) */
  highlight?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmationVariant;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmer cette action ?',
  description = 'Cette action est définitive et ne pourra pas être annulée.',
  highlight,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
}) => {
  useBodyScrollLock(isOpen);

  const styles = {
    danger: {
      iconWrap: 'bg-rose-50 border-rose-100 text-rose-600',
      icon: <ShieldAlert className="w-6 h-6" />,
      confirmClass: 'btn-danger',
      eyebrow: 'Action irréversible',
      eyebrowColor: 'text-rose-600',
    },
    warning: {
      iconWrap: 'bg-amber-50 border-amber-100 text-amber-600',
      icon: <AlertTriangle className="w-6 h-6" />,
      confirmClass: 'btn-primary',
      eyebrow: 'Attention requise',
      eyebrowColor: 'text-amber-600',
    },
    info: {
      iconWrap: 'bg-emerald-50 border-emerald-100 text-cscm-green',
      icon: <Info className="w-6 h-6" />,
      confirmClass: 'btn-primary',
      eyebrow: 'Confirmation',
      eyebrowColor: 'text-cscm-green',
    },
  }[variant];

  return (
    <ModalPortal>
      <AnimatePresence>
        {isOpen && (
          <div key="confirmation-modal-container" className="modal-overlay">
            <motion.div
              key="confirmation-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="modal-backdrop"
            />

            <motion.div
              key="confirmation-modal-body"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirmation-title"
              aria-describedby="confirmation-desc"
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="modal-shell-md overflow-hidden"
            >
              <div className="p-6 md:p-8 text-center">
                <div
                  className={`mx-auto mb-4 w-14 h-14 rounded-2xl border flex items-center justify-center shadow-sm ${styles.iconWrap}`}
                >
                  {styles.icon}
                </div>

                <p className={`text-[10px] font-black uppercase tracking-[0.18em] mb-2 ${styles.eyebrowColor}`}>
                  {styles.eyebrow}
                </p>

                <h3 id="confirmation-title" className="text-xl font-serif font-black text-[#1A3D18] leading-snug">
                  {title}
                </h3>

                {highlight && (
                  <div className="mt-3 inline-flex max-w-full items-center justify-center px-3 py-2 rounded-xl bg-[#1A3D18]/5 border border-[#1A3D18]/10">
                    <span className="text-xs font-bold text-[#1A3D18] truncate">{highlight}</span>
                  </div>
                )}

                <p id="confirmation-desc" className="mt-3 text-sm font-medium text-[#1A3D18]/55 leading-relaxed">
                  {description}
                </p>
              </div>

              <div className="modal-footer !border-t border-[#1A3D18]/8 !bg-white/50">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">
                  <ArrowLeft className="w-4 h-4" />
                  {cancelLabel}
                </button>
                <button type="button" onClick={onConfirm} className={`${styles.confirmClass} flex-1`}>
                  <Check className="w-4 h-4" />
                  {confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
};
