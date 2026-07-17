import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Logo } from '../components/Logo';
import { Mail, KeyRound, ArrowLeft } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Si cet email existe, un lien de réinitialisation a été envoyé.');
    setTimeout(() => navigate('/login'), 4000);
  };

  return (
    <div className="auth-page">
      {/* Accents d'ambiance */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#1b381c]/5 to-transparent pointer-events-none" />
      <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-[#ebd078]/10 blur-3xl pointer-events-none animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-[#1b381c]/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="auth-shell"
      >
        {/* Panneau formulaire */}
        <div className="auth-form-panel">
          <div className="max-w-sm mx-auto w-full">
            <p className="auth-eyebrow">CCAISM</p>
            <h1 className="auth-title">Mot de passe oublié ?</h1>
            <p className="auth-subtitle">Saisissez votre e-mail pour recevoir un lien d'accès sécurisé</p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              <div>
                <label className="field-label">
                  <Mail />
                  Adresse Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="Saisissez votre adresse email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field-input"
                />
              </div>

              {message && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs text-center font-bold">
                  {message}
                </div>
              )}

              <button type="submit" className="btn-cta">
                Envoyer le lien de réinitialisation
              </button>
            </form>

            <div className="mt-7 pt-5 border-t border-gray-100">
              <Link to="/login" className="inline-flex items-center gap-2 text-xs font-bold text-[#12210E]/70 hover:text-cscm-green transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                Retourner à l'écran de connexion
              </Link>
            </div>
          </div>
        </div>

        {/* Panneau de marque */}
        <div className="auth-brand-panel">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cscm-gold/10 rounded-full blur-3xl" />
            <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
            <div className="absolute bottom-10 right-10 w-32 h-32 border border-white/5 rounded-full" />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center gap-8 w-full">
            <Logo className="scale-110 text-white" />

            <div className="brand-glass">
              <div className="mx-auto mb-3 w-9 h-9 rounded-xl bg-cscm-gold/15 border border-cscm-gold/30 flex items-center justify-center">
                <KeyRound className="w-4.5 h-4.5 text-cscm-gold" />
              </div>
              <h3 className="font-serif font-bold text-lg text-cscm-gold">Récupération sécurisée</h3>
              <p className="text-white/60 text-xs font-medium leading-relaxed mt-2">
                Nous vous aidons à retrouver l'accès à votre espace CCAISM en toute sécurité et en quelques instants.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
