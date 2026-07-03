import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '../components/Logo';
import { getStoredUsers, saveStoredUsers } from '../utils/userStorage';
import { ShieldCheck, User, Eye, EyeOff, Sparkles, Building2, Lock } from 'lucide-react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Make sure users exist in storage
  useEffect(() => {
    getStoredUsers();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    const users = getStoredUsers();
    
    // Find matching user
    const matchedUser = users.find(u => u.email.toLowerCase() === trimmedEmail);
    
    if (matchedUser) {
      // Validate active status
      if (matchedUser.status === 'Inactif') {
        setError("Votre compte est inactif. Vous n'avez pas l'autorisation de vous connecter.");
        return;
      }

      // Validate password
      if (matchedUser.password && matchedUser.password !== password) {
        setError('Mot de passe incorrect pour cet utilisateur.');
        return;
      }
      
      localStorage.setItem('token', `mock-token-${matchedUser.id}`);
      localStorage.setItem('user', JSON.stringify({
        id: matchedUser.id,
        nom: matchedUser.nom,
        prenom: matchedUser.prenom,
        email: matchedUser.email,
        role: matchedUser.role
      }));
      
      // Let layout know role changed
      window.dispatchEvent(new Event('user_profile_updated'));
      navigate('/dashboard');
    } else {
      // If user not found, we'll create them as standard MEMBRE to make the app friendly
      const newUser = {
        id: 'u_' + Date.now(),
        nom: 'Nouveau',
        prenom: 'Membre',
        email: email,
        role: 'MEMBRE' as const,
        status: 'Actif' as const,
        password: password,
        dateCreation: new Date().toISOString().split('T')[0]
      };
      saveStoredUsers([...users, newUser]);
      
      localStorage.setItem('token', `mock-token-${newUser.id}`);
      localStorage.setItem('user', JSON.stringify({
        id: newUser.id,
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        role: newUser.role
      }));
      
      window.dispatchEvent(new Event('user_profile_updated'));
      navigate('/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const gUser = result.user;
      if (gUser && gUser.email) {
        const email = gUser.email;
        const users = getStoredUsers();
        let matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!matchedUser) {
          // If not found, register them as a new MEMBRE
          const names = gUser.displayName ? gUser.displayName.split(' ') : ['Google', 'User'];
          const prenom = names[0] || 'Utilisateur';
          const nom = names.slice(1).join(' ') || 'Google';
          matchedUser = {
            id: 'u_' + Date.now(),
            nom,
            prenom,
            email,
            role: 'MEMBRE',
            status: 'Actif',
            dateCreation: new Date().toISOString().split('T')[0]
          };
          const updatedUsers = [...users, matchedUser];
          saveStoredUsers(updatedUsers);
        }
        
        // Validate active status
        if (matchedUser.status === 'Inactif') {
          setError("Votre compte est inactif. Vous n'avez pas l'autorisation de vous connecter.");
          return;
        }
        
        localStorage.setItem('token', `google-token-${matchedUser.id}`);
        localStorage.setItem('user', JSON.stringify({
          id: matchedUser.id,
          nom: matchedUser.nom,
          prenom: matchedUser.prenom,
          email: matchedUser.email,
          role: matchedUser.role
        }));
        
        window.dispatchEvent(new Event('user_profile_updated'));
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      if (err.code === 'auth/popup-blocked') {
        setError("Le popup Google a été bloqué par le navigateur. Veuillez ouvrir l'application dans un nouvel onglet.");
      } else {
        setError("Erreur de connexion Google: " + err.message);
      }
    }
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

        {/* Right Side: Form & Quick Credentials Switcher */}
        <div className="w-full lg:w-7/12 p-8 md:p-12 flex flex-col justify-between bg-white">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div className="text-center lg:text-left">
              <h1 className="text-2xl md:text-3xl font-serif font-black text-[#1b381c]">
                Espace de Connexion
              </h1>
              <p className="text-gray-400 text-xs font-semibold mt-1">
                Authentifiez-vous pour accéder à vos droits réglementaires
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cscm-gold" />
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

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-cscm-gold" />
                    Mot de passe
                  </label>
                  <Link to="/forgot-password" className="text-[10px] font-bold text-gray-400 hover:text-cscm-green transition-all">
                    Oublié ?
                  </Link>
                </div>
                
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required
                    placeholder="Saisissez votre mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 border border-gray-200 focus:border-cscm-green rounded-xl outline-none font-sans text-xs text-gray-800 transition-all bg-[#FAF9F5]/30 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cscm-green transition-all cursor-pointer outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-100/65 rounded-xl text-red-600 text-xs text-center font-bold">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                id="login-submit-btn"
                className="w-full py-3.5 bg-cscm-green hover:bg-[#152e16] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-black/10 flex items-center justify-center cursor-pointer select-none font-sans"
              >
                Se connecter au portail
              </button>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-black uppercase tracking-widest">ou</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3.5 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md select-none font-sans"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.83 2.97c.9-2.7 3.42-4.49 6.78-4.49z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.1 2.66-2.33 3.49l3.62 2.81c2.12-1.95 3.77-4.83 3.77-8.45z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.22 14.73c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.39 7.56C.5 9.36 0 11.38 0 13.5s.5 4.14 1.39 5.94l3.83-2.97z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.62-2.81c-1.1.74-2.51 1.18-4.34 1.18-3.36 0-5.88-1.79-6.78-4.49L1.39 16.94C3.37 20.33 7.35 23 12 23z"
                />
              </svg>
              Continuer avec Google
            </button>
          </div>

          <div className="mt-8 pt-5 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold text-gray-400">
            <div className="flex gap-1">
              <span>Nouveau sur le portail ?</span>
              <Link to="/signup" className="text-cscm-green hover:underline">
                S'enregistrer
              </Link>
            </div>
            <span>© 2026 CSCM • Chambre Sénégalaise</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
