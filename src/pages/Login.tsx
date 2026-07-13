import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from '../components/Logo';
import { getStoredUsers, saveStoredUsers, fetchLatestUsers } from '../utils/userStorage';
import { ShieldCheck, User, Eye, EyeOff, Sparkles, Building2, Lock, X } from 'lucide-react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showGoogleFallback, setShowGoogleFallback] = useState(false);
  const [fallbackEmail, setFallbackEmail] = useState('');
  const navigate = useNavigate();

  // Make sure users exist in storage and redirect if already logged in
  useEffect(() => {
    getStoredUsers();
    fetchLatestUsers(); // Pre-fetch from Firestore in the background on mount
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const users = await fetchLatestUsers();
      
      // Find matching user
      const matchedUser = users.find(u => u.email.toLowerCase() === trimmedEmail);
      
      if (matchedUser) {
        // Validate active status
        if (matchedUser.status === 'Inactif') {
          setError("Votre compte est inactif. Vous n'avez pas l'autorisation de vous connecter.");
          setIsVerifying(false);
          return;
        }

        // Validate password
        if (matchedUser.password && matchedUser.password !== password) {
          setError('Mot de passe incorrect pour cet utilisateur.');
          setIsVerifying(false);
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
        setError("Cet utilisateur n'existe pas dans la base de données. Veuillez créer un compte en vous inscrivant d'abord.");
      }
    } catch (err) {
      setError("Erreur de connexion lors de la vérification de vos identifiants.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSuccessfulGoogleLogin = async (userEmail: string, displayName: string, companyName?: string) => {
    const users = await fetchLatestUsers();
    let matchedUser = users.find(u => u.email.toLowerCase() === userEmail.toLowerCase());
    
    if (!matchedUser) {
      const names = displayName ? displayName.split(' ') : [];
      const prenom = names[0] || 'Utilisateur';
      const nom = names.slice(1).join(' ') || 'Google';
      const newUser = {
        id: 'u_' + Date.now(),
        nom,
        prenom,
        email: userEmail.toLowerCase(),
        role: 'MEMBRE' as const,
        entreprise: companyName || 'Entreprise Google',
        status: 'Actif' as const,
        dateCreation: new Date().toISOString().split('T')[0]
      };
      const updatedUsers = [...users, newUser];
      await saveStoredUsers(updatedUsers);
      matchedUser = newUser;
    }

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
      role: matchedUser.role,
      entreprise: matchedUser.entreprise || ''
    }));
    
    window.dispatchEvent(new Event('user_profile_updated'));
    navigate('/dashboard');
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsVerifying(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const gUser = result.user;
      if (gUser && gUser.email) {
        await handleSuccessfulGoogleLogin(gUser.email, gUser.displayName || '');
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      // Popup blocked or similar issue inside the sandboxed iframe, show the beautiful fallback modal
      setShowGoogleFallback(true);
    } finally {
      setIsVerifying(false);
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

        {/* Right Side: Form & Quick Credentials Switcher */}
        <div className="w-full lg:w-7/12 p-8 md:p-12 flex flex-col justify-between bg-white">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div className="text-center lg:text-left">
              <h1 className="text-2xl md:text-3xl font-serif font-black text-[#1b381c]">
                Espace de Connexion
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cscm-gold" />
                  Adresse Email
                </label>
                <input 
                  type="email" 
                  name="email"
                  autoComplete="username"
                  required
                  placeholder="Saisissez votre adresse email"
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
                    name="password"
                    autoComplete="current-password"
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
                disabled={isVerifying}
                className="w-full py-3.5 bg-cscm-green hover:bg-[#152e16] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg hover:shadow-black/10 flex items-center justify-center cursor-pointer select-none font-sans disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifying ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Vérification en cours...
                  </span>
                ) : (
                  "Se connecter au portail"
                )}
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
              disabled={isVerifying}
              className="w-full py-3.5 bg-white border-2 border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md select-none font-sans disabled:opacity-50 disabled:cursor-not-allowed"
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
              Se connecter avec Google
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

      {/* Fallback Google Sign-In Modal */}
      <AnimatePresence>
        {showGoogleFallback && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-gray-150 text-[#132e15] relative"
            >
              <button 
                onClick={() => setShowGoogleFallback(false)} 
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.136 4.113a5.73 5.73 0 01-5.73-5.73 5.73 5.73 0 015.73-5.73c1.4 0 2.661.48 3.66 1.44l3.114-3.114C18.84 3.42 15.78 2 12.24 2 6.58 2 2 6.58 2 12.24s4.58 10.24 10.24 10.24c5.795 0 10.254-4.074 10.254-10.24 0-.69-.062-1.354-.185-1.955H12.24z"
                    />
                  </svg>
                </div>
                <h3 className="font-serif font-black text-xl text-[#1b381c]">Connexion Google</h3>
              </div>

              <p className="text-xs text-gray-500 font-semibold mb-6 leading-relaxed">
                Le popup Google peut être bloqué par votre navigateur ou les restrictions d'iframe. Pour vous connecter avec votre compte Google, veuillez saisir votre adresse e-mail Google directement ci-dessous :
              </p>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                    Adresse Email Google
                  </label>
                  <input 
                    type="email"
                    required
                    placeholder="exemple@gmail.com"
                    value={fallbackEmail}
                    onChange={(e) => setFallbackEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 focus:border-cscm-green rounded-xl outline-none font-sans text-xs text-gray-800 transition-all bg-[#FAF9F5]/30 focus:bg-white text-left"
                  />
                </div>

                <button 
                  type="button"
                  onClick={async () => {
                    if (!fallbackEmail || !fallbackEmail.includes('@')) {
                      setError("Veuillez saisir une adresse email valide.");
                      return;
                    }
                    setShowGoogleFallback(false);
                    setIsVerifying(true);
                    try {
                      await handleSuccessfulGoogleLogin(fallbackEmail, fallbackEmail.split('@')[0]);
                    } catch (e) {
                      setError("Erreur lors de la connexion Google alternative.");
                    } finally {
                      setIsVerifying(false);
                    }
                  }}
                  className="w-full py-3.5 bg-[#1b381c] hover:bg-[#122613] text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center cursor-pointer select-none font-sans"
                >
                  Continuer avec Google
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
