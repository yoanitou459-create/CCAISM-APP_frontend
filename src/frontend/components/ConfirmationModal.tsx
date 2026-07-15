import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

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

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#E5E5E5] w-full max-w-md rounded-lg shadow-2xl relative z-10 border-2 border-black p-8 text-center"
        >
          <h3 className="text-2xl font-serif font-bold text-[#4A3728] mb-8">
            {title}
          </h3>
          
          <div className="flex justify-center gap-8">
            <button
              onClick={onConfirm}
              className="bg-[#A81C1C] text-white px-8 py-2 rounded-md border-2 border-black font-bold text-xl hover:bg-[#8B1717] transition-colors shadow-md"
            >
              Valider
            </button>
            <button
              onClick={onClose}
              className="bg-[#E1F1F1] text-black px-8 py-2 rounded-md border-2 border-black font-bold text-xl hover:bg-[#D1E1E1] transition-colors shadow-md"
            >
              Retour
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
