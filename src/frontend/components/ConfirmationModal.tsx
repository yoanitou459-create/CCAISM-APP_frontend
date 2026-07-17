import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ArrowLeft, Check } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { ModalPortal } from './ModalPortal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confimer l'action ?" 
}) => {
  useBodyScrollLock(isOpen);

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
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="modal-shell-md !p-8 text-center"
          >
          <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-rose-50/90 border border-rose-100 flex items-center justify-center shadow-sm">
            <AlertTriangle className="w-7 h-7 text-rose-600" />
          </div>

          <h3 className="text-xl font-serif font-black text-[#1A3D18] mb-2">
            {title}
          </h3>
          <p className="text-xs font-semibold text-[#1A3D18]/45 mb-7">
            Cette action est définitive et ne pourra pas être annulée.
          </p>
          
          <div className="flex justify-center gap-3">
            <button onClick={onClose} className="btn-secondary flex-1">
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <button onClick={onConfirm} className="btn-danger flex-1">
              <Check className="w-4 h-4" />
              Valider
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
  </ModalPortal>
  );
};
