import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Logo } from '../components/Logo';
import { Building2, Sparkles, Mail } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-[#f5faef] via-[#FAF9F5] to-[#fefbe3] flex flex-col justify-center items-center p-4 md:p-8 relative selection:bg-cscm-green selection:text-white">
      {/* Background ambient accents */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#1b381c]/5 to-transparent pointer-events-none" />
      <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-[#ebd078]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-[#1b381c]/5 blur-3xl pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl border border-gray-200/65 flex flex-col lg:flex-row overflow-hidden relative z-10"
      >
        {/* Left Side: Elegant Portal Introduction with Logo */}
        <div className="w-full lg:w-5/12 bg-gradient-to-br from-[#122410] via-[#0c180b] to-[#040804] p-8 md:p-12 flex flex-col justify-between text-white relative">
          {/* Subtle logo design */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-cscm-gold/10 rounded-full translate-x-20 -translate-y-20 blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cscm-green to-emerald-900 border border-white/20 flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5 text-cscm-gold" />
            </div>
            <div>
              <span className="text-xs font-serif font-bold text-cscm-gold tracking-wide block leading-none">CSCM</span>
              <span className="text-[7px] text-white/50 uppercase font-black tracking-widest leading-none mt-0.5 block">Portail Institutionnel</span>
            </div>
          </div>

          <div className="my-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/10 text-cscm-gold border border-white/5">
              <Sparkles className="w-3 h-3 text-cscm-gold" />
              Pilotage & Trésorerie
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tight leading-snug">
              Chambre Sénégalaise de Commerce au Maroc
            </h2>
            <p className="text-white/70 text-xs md:text-sm leading-relaxed">
              Votre espace d'administration de l'annuaire bilatéral, de comptabilisation des cotisations annuelles, et de pilotage des comptes accrédités.
            </p>
          </div>

          {/* Graphic interactive element representing our Logo */}
          <div className="flex items-center justify-center p-6 bg-white/5 rounded-2xl border border-white/5">
            <Logo className="scale-95 text-white/90" />
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-7/12 p-8 md:p-12 flex flex-col justify-between bg-white">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div className="text-center lg:text-left">
              <h1 className="text-2xl md:text-3xl font-serif font-black text-[#1b381c]">
                Mot de passe oublié ?
              </h1>
              <p className="text-gray-400 text-xs font-semibold mt-1">
                Saisissez votre e-mail pour recevoir un lien d'accès sécurisé
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cscm-gold" />
                  Adresse Email Pro
                </label>
                <input 
                  type="email" 
                  required
                  placeholder="nom@cscm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 focus:border-cscm-green rounded-xl outline-none font-sans text-xs text-gray-800 transition-all bg-[#FAF9F5]/30 focus:bg-white"
                />
              </div>

              {message && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs text-center font-bold">
                  {message}
                </div>
              )}

              <button 
                type="submit" 
                className="w-full py-3.5 bg-cscm-green hover:bg-[#152e16] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-black/10 flex items-center justify-center cursor-pointer select-none"
              >
                Envoyer le lien de réinitialisation
              </button>
            </form>
          </div>

          <div className="mt-8 pt-5 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-gray-400">
            <Link to="/login" className="text-cscm-green hover:underline">
              Retourner à l'écran de connexion
            </Link>
            <span>© 2026 CSCM • Chambre Sénégalaise</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
