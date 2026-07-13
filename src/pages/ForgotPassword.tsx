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
        <div className="w-full lg:w-5/12 bg-gradient-to-br from-[#122410] via-[#0c180b] to-[#040804] p-8 md:p-12 flex flex-col items-center justify-center text-white relative min-h-[350px] lg:min-h-full">
          {/* Subtle background blurs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[2.5rem_0_0_2.5rem]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cscm-gold/10 rounded-full blur-3xl" />
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
          </div>
          
          <div className="relative z-10 flex flex-col items-center justify-center space-y-6 text-center w-full">
            {/* Elegant outer design ring around the logo */}
            <div className="relative p-10 rounded-[2.5rem] bg-white/5 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md transition-all duration-300 hover:border-cscm-gold/30">
              <div className="absolute -inset-1 rounded-[2.7rem] bg-gradient-to-tr from-cscm-gold/20 via-transparent to-emerald-500/20 blur opacity-40 transition duration-500" />
              <Logo className="scale-110 text-white" />
            </div>
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
                  Adresse Email
                </label>
                <input 
                  type="email" 
                  required
                  placeholder="Saisissez votre adresse email"
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
