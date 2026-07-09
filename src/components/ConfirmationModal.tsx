import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

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
          className="bg-white w-full max-w-md rounded-[2rem] ring-1 ring-black/5 shadow-[0_30px_80px_-24px_rgba(62,123,50,0.3)] relative z-10 p-8 text-center"
        >
          <h3 className="text-2xl font-sans font-bold text-[#274420] mb-8">
            {title}
          </h3>
          
          <div className="flex justify-center gap-4">
            <button
              onClick={onConfirm}
              className="bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white px-8 py-2.5 rounded-2xl font-bold text-base shadow-lg shadow-rose-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer"
            >
              Valider
            </button>
            <button
              onClick={onClose}
              className="bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 text-gray-600 px-8 py-2.5 rounded-2xl font-bold text-base shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
            >
              Retour
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
