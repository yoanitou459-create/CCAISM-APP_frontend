import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ModalPortal } from '../components/ModalPortal';
import { Logo } from '../components/Logo';
import { getStoredUsers, saveStoredUsers, fetchLatestUsers } from '../../database/userStorage';
import { User, Eye, EyeOff, Lock, X, ShieldCheck } from 'lucide-react';
import { auth } from '../../database/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
  </svg>
);

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showGoogleFallback, setShowGoogleFallback] = useState(false);
  const [fallbackEmail, setFallbackEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    getStoredUsers();
    fetchLatestUsers();
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
      const matchedUser = users.find(u => u.email.toLowerCase() === trimmedEmail);

      if (matchedUser) {
        if (matchedUser.status === 'Inactif') {
          setError("Votre compte est inactif. Vous n'avez pas l'autorisation de vous connecter.");
          setIsVerifying(false);
          return;
        }

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
      setShowGoogleFallback(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fallbackEmail.trim()) return;
    setShowGoogleFallback(false);
    await handleSuccessfulGoogleLogin(fallbackEmail.trim(), '');
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
            <h1 className="auth-title">Connexion</h1>
            <p className="auth-subtitle">Accédez à la plateforme CCAISM</p>

            <div className="mt-7 space-y-5">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isVerifying}
                className="google-btn"
              >
                <GoogleIcon />
                Continuer avec Google
              </button>

              <div className="auth-divider">ou</div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="field-label">
                    <User />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    required
                    placeholder="Saisissez votre adresse email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field-input"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label className="field-label">
                      <Lock />
                      Mot de passe
                    </label>
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
                      className="field-input pr-11"
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
                  <div className="p-3 bg-red-50 border border-red-100/70 rounded-xl text-red-600 text-xs text-center font-bold">
                    {error}
                  </div>
                )}

                <button type="submit" id="login-submit-btn" disabled={isVerifying} className="btn-cta">
                  {isVerifying ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Vérification en cours...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </button>
              </form>

              <p className="text-center text-[11px] font-semibold text-gray-400 leading-relaxed">
                Une connexion rapide et sécurisée pour accéder à votre espace CCAISM.
              </p>
            </div>

            <div className="mt-7 pt-5 border-t border-gray-100 flex justify-between items-center text-xs font-bold">
              <Link to="/signup" className="text-[#12210E]/70 hover:text-cscm-green transition-colors">
                Créer un compte
              </Link>
              <Link to="/forgot-password" className="text-[#12210E]/70 hover:text-cscm-green transition-colors">
                Mot de passe oublié ?
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
                <ShieldCheck className="w-4.5 h-4.5 text-cscm-gold" />
              </div>
              <h3 className="font-serif font-bold text-lg text-cscm-gold">Gestion simple et sécurisée</h3>
              <p className="text-white/60 text-xs font-medium leading-relaxed mt-2">
                Connectez-vous pour accéder aux entreprises, aux imports et aux outils de suivi selon votre rôle.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Fallback Google (popup bloquée) */}
      <ModalPortal>
      <AnimatePresence>
        {showGoogleFallback && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGoogleFallback(false)}
              className="modal-backdrop"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="modal-shell-md"
            >
              <div className="modal-header-dark">
                <div className="flex items-center gap-3">
                  <GoogleIcon className="shrink-0" />
                  <div>
                    <h3 className="font-serif font-bold text-lg text-[#ebd078]">Connexion Google</h3>
                    <p className="text-white/60 text-xs font-medium">Saisissez votre email Google pour continuer</p>
                  </div>
                </div>
                <button onClick={() => setShowGoogleFallback(false)} className="text-white/60 hover:text-white transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleFallbackSubmit} className="modal-body space-y-4">
                <div>
                  <label className="field-label">
                    <User />
                    Adresse Email Google
                  </label>
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="prenom.nom@gmail.com"
                    value={fallbackEmail}
                    onChange={(e) => setFallbackEmail(e.target.value)}
                    className="field-input"
                  />
                </div>
                <button type="submit" className="btn-cta">Continuer</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </ModalPortal>
    </div>
  );
};
