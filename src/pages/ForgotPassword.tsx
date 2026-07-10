import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AuthBrandPanel } from '../components/AuthBrandPanel';

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
    <div className="auth-shell">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="auth-card"
      >
        <div className="auth-form-panel">
          <div className="max-w-sm mx-auto w-full space-y-6">
            <div className="space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-cscm-gold">CCAISM</p>
              <h1 className="text-3xl font-bold text-cscm-green tracking-tight">Mot de passe oublié ?</h1>
              <p className="text-sm text-gray-400 font-normal">Saisissez votre e-mail pour recevoir un lien d'accès sécurisé.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="auth-fields-box">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">Email</label>
                  <input 
                    type="email" 
                    required
                    placeholder="nom@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input"
                  />
                </div>
              </div>

              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs text-center font-medium">
                      {message}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit" className="auth-submit-btn">
                Envoyer le lien de réinitialisation
              </button>
            </form>

            <div className="flex justify-center items-center text-xs font-medium pt-1">
              <Link to="/login" className="text-cscm-green hover:underline underline-offset-2">
                Retourner à l'écran de connexion
              </Link>
            </div>
          </div>
        </div>

        <AuthBrandPanel
          glassTitle="Récupération sécurisée"
          glassText="Votre sécurité est notre priorité. Récupérez l'accès à votre compte en quelques instants."
        />
      </motion.div>
    </div>
  );
};
