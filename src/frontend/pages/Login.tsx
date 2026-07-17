import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Logo } from '../components/Logo';
import { fetchLatestUsers } from '../../database/userStorage';
import { User, Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react';
import {
  establishAppSessionFromGoogle,
  establishAppSessionFromFirebaseUser,
  signInWithGoogleAccountPicker,
  consumeGoogleRedirectResult,
  watchExistingGoogleSession,
  LAST_EMAIL_KEY,
} from '../utils/googleAuth';

const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
  </svg>
);

export const Login: React.FC = () => {
  const [email, setEmail] = useState(() => localStorage.getItem(LAST_EMAIL_KEY) || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [autoStatus, setAutoStatus] = useState('');
  const navigate = useNavigate();
  const autoLoginTried = useRef(false);

  const finishGoogleSession = async (userEmail: string, displayName: string) => {
    const result = await establishAppSessionFromGoogle(userEmail, displayName, { allowCreate: false });
    if (!result.ok) {
      const errorResult = result as { ok: false; reason: 'inactive' | 'not_found' };
      if (errorResult.reason === 'not_found') {
        setError("Ce compte Google n'est pas inscrit. Créez un compte d'abord ou choisissez un autre compte.");
      } else {
        setError("Votre compte est inactif. Vous n'avez pas l'autorisation de vous connecter.");
      }
      setAutoStatus('');
      return false;
    }
    setAutoStatus('Compte reconnu — connexion…');
    navigate('/dashboard', { replace: true });
    return true;
  };

  useEffect(() => {
    fetchLatestUsers();
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
      return;
    }

    let cancelled = false;

    const bootstrapGoogle = async () => {
      // 1) Retour d'un redirect Google
      try {
        const redirected = await consumeGoogleRedirectResult();
        if (cancelled) return;
        if (redirected?.email) {
          setIsVerifying(true);
          setAutoStatus('Connexion Google en cours…');
          await finishGoogleSession(redirected.email, redirected.displayName || '');
          setIsVerifying(false);
          return;
        }
      } catch (e) {
        console.error("Redirect check error:", e);
      }

      // 2) Session Google déjà active sur ce navigateur → connexion auto si inscrit
      if (localStorage.getItem('cscm_manual_logout') === '1') {
        return;
      }

      const unsub = watchExistingGoogleSession(async (gUser) => {
        if (autoLoginTried.current || cancelled || localStorage.getItem('token')) return;
        autoLoginTried.current = true;
        setIsVerifying(true);
        setAutoStatus('Compte Google détecté — connexion automatique…');
        try {
          const session = await establishAppSessionFromFirebaseUser(gUser, { allowCreate: false });
          if (!cancelled && session.ok) {
            setAutoStatus('Compte reconnu — connexion automatique…');
            navigate('/dashboard', { replace: true });
          } else if (!cancelled && !session.ok && 'reason' in session) {
            if (session.reason === 'inactive') {
              setError("Votre compte est inactif. Vous n'avez pas l'autorisation de vous connecter.");
            }
            // not_found : on ne force pas l'erreur au chargement (l'utilisateur peut choisir un autre compte)
            setAutoStatus('');
          }
        } catch (e) {
          console.error("Auto login check error:", e);
        } finally {
          setIsVerifying(false);
        }
      });

      return unsub;
    };

    let unsubFn: (() => void) | undefined;
    bootstrapGoogle().then((unsub) => {
      unsubFn = unsub;
    });

    return () => {
      cancelled = true;
      unsubFn?.();
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAutoStatus('');
    setIsVerifying(true);
    localStorage.removeItem('cscm_manual_logout');

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const users = await fetchLatestUsers();
      const matchedUser = users.find(u => u.email.toLowerCase() === trimmedEmail);

      if (matchedUser) {
        if (matchedUser.status === 'Inactif') {
          setError("Votre compte est inactif. Vous n'avez pas l'autorisation de vous connecter.");
          return;
        }

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
        localStorage.setItem(LAST_EMAIL_KEY, matchedUser.email);
        localStorage.setItem('cscm_auth_provider', 'password');

        window.dispatchEvent(new Event('user_profile_updated'));
        navigate('/dashboard', { replace: true });
      } else {
        setError("Cet utilisateur n'existe pas. Créez un compte ou utilisez Google.");
      }
    } catch {
      setError('Erreur de connexion lors de la vérification de vos identifiants.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setAutoStatus('');
    setIsVerifying(true);
    localStorage.removeItem('cscm_manual_logout');
    try {
      const gUser = await signInWithGoogleAccountPicker();
      if (gUser?.email) {
        setAutoStatus('Vérification du compte…');
        await finishGoogleSession(gUser.email, gUser.displayName || '');
      }
    } catch (err: any) {
      if (err?.code === 'auth/redirect-started') {
        setAutoStatus('Redirection vers Google…');
        return;
      }
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setError('');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setError(`Domaine non autorisé dans Firebase : veuillez ajouter "${window.location.hostname}" aux domaines autorisés dans votre console Firebase (Authentication > Paramètres).`);
      } else {
        console.error('Google login error:', err);
        setError('Connexion Google impossible. Réessayez ou autorisez les fenêtres Google.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const isIframe = window.self !== window.top;

  return (
    <div className="auth-page">
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#1b381c]/5 to-transparent pointer-events-none" />
      <div className="absolute top-20 left-10 w-96 h-96 rounded-full bg-[#ebd078]/10 blur-3xl pointer-events-none animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-[#1b381c]/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="auth-shell"
      >
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

              <form
                onSubmit={handleSubmit}
                className="space-y-4"
                autoComplete="on"
                method="post"
              >
                <div>
                  <label className="field-label" htmlFor="login-email">
                    <User />
                    Email
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    name="username"
                    autoComplete="username email"
                    required
                    placeholder="Saisissez votre adresse email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="field-input"
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="login-password">
                    <Lock />
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
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

                {autoStatus && !error && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100/70 rounded-xl text-emerald-800 text-xs text-center font-bold">
                    {autoStatus}
                  </div>
                )}

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
                      Connexion…
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </button>
              </form>

              <p className="text-center text-[11px] font-semibold text-gray-400 leading-relaxed">
                Déjà inscrit avec Google ? La connexion se fait automatiquement après le choix du compte.
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
    </div>
  );
};
