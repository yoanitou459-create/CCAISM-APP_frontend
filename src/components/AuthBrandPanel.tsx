import React from 'react';
import { motion } from 'motion/react';
import logoImg from './logo.png';

interface AuthBrandPanelProps {
  glassTitle?: string;
  glassText?: string;
}

export const AuthBrandPanel: React.FC<AuthBrandPanelProps> = ({
  glassTitle = 'Gestion simple et sécurisée',
  glassText = "La plateforme de gestion des membres, cotisations et entreprises de la Chambre Sénégalaise de Commerce au Maroc.",
}) => {
  return (
    <div className="auth-brand-panel">
      <div className="auth-brand-watermark w-72 h-72 top-8 right-[-4rem] opacity-40" />
      <div className="auth-brand-watermark w-48 h-48 bottom-32 left-[-3rem] opacity-30" />
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-cscm-gold/40 blur-[1px]" />
      <div className="absolute top-32 right-16 w-1.5 h-1.5 rounded-full bg-white/30" />
      <div className="absolute bottom-48 left-12 w-1 h-1 rounded-full bg-cscm-gold/50" />

      <div className="relative z-10 flex-1 flex items-center justify-center py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="w-44 h-44 md:w-52 md:h-52"
        >
          <img src={logoImg} alt="Logo CSCM" className="w-full h-full object-contain drop-shadow-2xl" />
        </motion.div>
      </div>

      <div className="auth-glass-card">
        <div className="h-px w-12 bg-cscm-gold/60 mb-3" />
        <h3 className="text-sm font-semibold text-white mb-1.5">{glassTitle}</h3>
        <p className="text-xs text-white/65 leading-relaxed font-normal">{glassText}</p>
      </div>
    </div>
  );
};
