import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ModalPortal } from '../components/ModalPortal';
import { Logo } from '../components/Logo';
import { Building2, User, Lock, Mail, Eye, EyeOff, X, Sparkles } from 'lucide-react';
import { getStoredUsers, saveStoredUsers, fetchLatestUsers } from '../../database/userStorage';
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

export const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    entreprise: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showGoogleFallback, setShowGoogleFallback] = useState(false);
  const [fallbackEmail, setFallbackEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchLatestUsers();
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (formData.email && formData.password && formData.nom && formData.prenom && formData.entreprise) {
      setIsVerifying(true);
      try {
        const users = await fetchLatestUsers();
        const trimmedEmail = formData.email.trim().toLowerCase();

        const matchedUser = users.find(u => u.email.toLowerCase() === trimmedEmail);
        let updatedUsers;

        const finalUser = matchedUser
          ? {
              ...matchedUser,
              nom: formData.nom.trim(),
              prenom: formData.prenom.trim(),
              password: formData.password,
              entreprise: formData.entreprise.trim(),
              status: 'Actif' as const
            }
          : {
              id: 'u_' + Date.now(),
              nom: formData.nom.trim(),
              prenom: formData.prenom.trim(),
              email: trimmedEmail,
              role: (users.length === 0 ? 'ADMIN' : 'MEMBRE') as 'ADMIN' | 'MODERATEUR' | 'MEMBRE',
              password: formData.password,
              entreprise: formData.entreprise.trim(),
              status: 'Actif' as const,
              dateCreation: new Date().toISOString().split('T')[0]
            };

        if (matchedUser) {
          updatedUsers = users.map(u => u.email.toLowerCase() === trimmedEmail ? finalUser : u);
        } else {
          updatedUsers = [...users, finalUser];
        }

        await saveStoredUsers(updatedUsers);

        localStorage.setItem('token', `mock-token-${finalUser.id}`);
        localStorage.setItem('user', JSON.stringify({
          id: finalUser.id,
          nom: finalUser.nom,
          prenom: finalUser.prenom,
          email: finalUser.email,
          role: finalUser.role,
          entreprise: finalUser.entreprise
        }));
        localStorage.setItem('cscm_just_registered', 'true');

        window.dispatchEvent(new Event('user_profile_updated'));
        navigate('/dashboard', { replace: true });
      } catch (err: any) {
        setError("Une erreur est survenue lors de la création du compte. Veuillez réessayer.");
      } finally {
        setIsVerifying(false);
      }
      return;
    }

    setError('Veuillez remplir tous les champs');
  };

  const handleGoogleSignup = async () => {
    setError('');
    setSuccessMessage('');
    setIsVerifying(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const gUser = result.user;
      if (gUser && gUser.email) {
        const email = gUser.email.toLowerCase();
        const users = await fetchLatestUsers();
        const matchedUser = users.find(u => u.email.toLowerCase() === email);

        const names = gUser.displayName ? gUser.displayName.split(' ') : [];
        const prenom = names[0] || (matchedUser ? matchedUser.prenom : '');
        const nom = names.slice(1).join(' ') || (matchedUser ? matchedUser.nom : '');

        setFormData({
          nom,
          prenom,
          email,
          password: '',
          entreprise: matchedUser?.entreprise || '',
        });

        if (!matchedUser) {
          setSuccessMessage(`Compte Google associé avec succès ! Votre adresse email (${email}) a été injectée. Veuillez maintenant choisir votre entreprise et mot de passe ci-dessous pour finaliser la création de votre compte.`);
        } else {
          setSuccessMessage(`Compte Google associé avec succès ! Votre adresse email (${email}) est déjà pré-autorisée. Veuillez maintenant choisir votre entreprise et mot de passe ci-dessous pour finaliser l'inscription.`);
        }
      }
    } catch (err: any) {
      console.error("Google signup error:", err);
      setShowGoogleFallback(true);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleFallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fallbackEmail.trim()) return;
    setFormData({ ...formData, email: fallbackEmail.trim().toLowerCase() });
    setSuccessMessage(`Adresse email (${fallbackEmail.trim().toLowerCase()}) injectée. Veuillez compléter les champs restants pour finaliser votre inscription.`);
    setShowGoogleFallback(false);
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
            <h1 className="auth-title">Créer un compte</h1>
            <p className="auth-subtitle">Rejoignez le réseau de la Chambre Sénégalaise de Commerce au Maroc</p>

            <div className="mt-6 space-y-5">
              <button type="button" onClick={handleGoogleSignup} disabled={isVerifying} className="google-btn">
                <GoogleIcon />
                S'inscrire avec Google
              </button>

              <div className="auth-divider">ou</div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="field-label">
                      <User />
                      Prénom
                    </label>
                    <input
                      type="text"
                      autoComplete="given-name"
                      required
                      placeholder="Votre prénom"
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label className="field-label">
                      <User />
                      Nom
                    </label>
                    <input
                      type="text"
                      autoComplete="family-name"
                      required
                      placeholder="Votre nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="field-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">
                    <Mail />
                    Adresse Email
                  </label>
                  <input
                    type="email"
                    autoComplete="username"
                    required
                    placeholder="Saisissez votre adresse email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="field-input"
                  />
                </div>

                <div>
                  <label className="field-label">
                    <Building2 />
                    Nom de l'entreprise
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Saisissez le nom de votre entreprise"
                    value={formData.entreprise}
                    onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                    className="field-input"
                  />
                </div>

                <div>
                  <label className="field-label">
                    <Lock />
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      placeholder="Saisissez votre mot de passe"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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

                {successMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100/70 rounded-xl text-emerald-800 text-xs text-center font-semibold leading-relaxed">
                    {successMessage}
                  </div>
                )}

                <button type="submit" disabled={isVerifying} className="btn-cta">
                  {isVerifying ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Vérification en cours...
                    </>
                  ) : (
                    'Créer mon compte'
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-5 border-t border-gray-100 flex justify-between items-center text-xs font-bold">
              <span className="text-gray-400 font-semibold">Compte existant ?</span>
              <Link to="/login" className="text-[#12210E]/70 hover:text-cscm-green transition-colors">
                Se connecter
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
                <Sparkles className="w-4.5 h-4.5 text-cscm-gold" />
              </div>
              <h3 className="font-serif font-bold text-lg text-cscm-gold">Rejoignez le réseau</h3>
              <p className="text-white/60 text-xs font-medium leading-relaxed mt-2">
                Un espace unique pour valoriser votre entreprise et développer vos opportunités au sein de la communauté CCAISM.
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
                    <h3 className="font-serif font-bold text-lg text-[#ebd078]">Inscription Google</h3>
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
                    <Mail />
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
