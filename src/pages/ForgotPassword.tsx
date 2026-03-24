import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Logo } from '../components/Logo';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Si cet email existe, un lien de réinitialisation a été envoyé.');
    setTimeout(() => navigate('/login'), 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card flex flex-col md:flex-row max-w-4xl w-full overflow-hidden"
      >
        <div className="flex-1 p-8 md:p-12 bg-cscm-gold/10">
          <h1 className="text-3xl font-serif text-cscm-gold mb-12 text-center">Réinitialiser le mot de passe</h1>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-cscm-gold text-sm mb-1">Email</label>
              <input 
                type="email" 
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {message && <p className="text-cscm-gold text-sm text-center">{message}</p>}

            <div className="flex justify-center pt-4">
              <button type="submit" className="btn-primary">
                Envoyer le lien
              </button>
            </div>
          </form>

          <div className="mt-12 text-center text-sm text-cscm-gold/80">
            <Link to="/login" className="hover:text-cscm-gold transition-colors">Retour à la connexion</Link>
          </div>
        </div>

        <div className="flex-1 bg-cscm-gold flex items-center justify-center p-12">
          <Logo />
        </div>
      </motion.div>
    </div>
  );
};
