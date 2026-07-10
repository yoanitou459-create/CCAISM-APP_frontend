import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AuthBrandPanel } from '../components/AuthBrandPanel';
import { Eye, EyeOff } from 'lucide-react';
import { saveStoredUsers, fetchLatestUsers } from '../utils/userStorage';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
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

    if (formData.email && formData.password && formData.nom && formData.prenom) {
      setIsVerifying(true);
      try {
        const users = await fetchLatestUsers();
        const trimmedEmail = formData.email.trim().toLowerCase();
        const matchedUser = users.find(u => u.email.toLowerCase() === trimmedEmail);

        if (!matchedUser) {
          setError("Cette adresse email n'est pas autorisée ou enregistrée dans notre base de données. L'accès à la plateforme est restreint. Veuillez contacter l'administrateur.");
          return;
        }

        const updatedUsers = users.map(u => {
          if (u.email.toLowerCase() === trimmedEmail) {
            return {
              ...u,
              nom: formData.nom.trim(),
              prenom: formData.prenom.trim(),
              password: formData.password,
              status: 'Actif' as const
            };
          }
          return u;
        });

        saveStoredUsers(updatedUsers);
        navigate('/login', { state: { message: 'Votre compte a été configuré avec succès ! Connectez-vous avec votre mot de passe.' } });
      } catch {
        setError("Une erreur est survenue lors de la vérification de l'adresse email. Veuillez réessayer.");
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
      if (gUser?.email) {
        const email = gUser.email.toLowerCase();
        const users = await fetchLatestUsers();
        const matchedUser = users.find(u => u.email.toLowerCase() === email);

        if (!matchedUser) {
          setError(`Votre adresse email Google (${email}) n'est pas autorisée ou enregistrée dans notre base de données. Veuillez contacter l'administrateur.`);
          return;
        }

        const names = gUser.displayName ? gUser.displayName.split(' ') : [];
        const prenom = names[0] || matchedUser.prenom || '';
        const nom = names.slice(1).join(' ') || matchedUser.nom || '';

        setFormData({ nom, prenom, email, password: '' });
        setSuccessMessage(`Compte Google associé avec succès ! Votre adresse email (${email}) a été injectée. Veuillez maintenant choisir votre mot de passe ci-dessous pour finaliser l'inscription.`);
      }
    } catch (err: unknown) {
      console.error('Google signup error:', err);
      const code = err && typeof err === 'object' && 'code' in err ? String((err as { code: string }).code) : '';
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      if (code === 'auth/popup-blocked') {
        setError("Le popup Google a été bloqué par le navigateur. Veuillez ouvrir l'application dans un nouvel onglet.");
      } else {
        setError("Erreur d'inscription Google: " + message);
      }
    } finally {
      setIsVerifying(false);
    }
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
              <h1 className="text-3xl font-bold text-cscm-green tracking-tight">Créer un compte</h1>
              <p className="text-sm text-gray-400 font-normal">Rejoignez le réseau de la Chambre Sénégalaise de Commerce au Maroc.</p>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={isVerifying}
              className="auth-google-btn disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.83 2.97c.9-2.7 3.42-4.49 6.78-4.49z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.43c-.28 1.44-1.1 2.66-2.33 3.49l3.62 2.81c2.12-1.95 3.77-4.83 3.77-8.45z" />
                <path fill="#FBBC05" d="M5.22 14.73c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.39 7.56C.5 9.36 0 11.38 0 13.5s.5 4.14 1.39 5.94l3.83-2.97z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.62-2.81c-1.1.74-2.51 1.18-4.34 1.18-3.36 0-5.88-1.79-6.78-4.49L1.39 16.94C3.37 20.33 7.35 23 12 23z" />
              </svg>
              S'inscrire avec Google
            </button>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-200" />
              <span className="flex-shrink mx-4 text-gray-300 text-xs">ou</span>
              <div className="flex-grow border-t border-gray-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="auth-fields-box space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Prénom</label>
                    <input
                      type="text"
                      name="given-name"
                      autoComplete="given-name"
                      required
                      placeholder="Prénom"
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      className="auth-input"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Nom</label>
                    <input
                      type="text"
                      name="family-name"
                      autoComplete="family-name"
                      required
                      placeholder="Nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      className="auth-input"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">Email</label>
                  <input
                    type="email"
                    name="email"
                    autoComplete="username"
                    required
                    placeholder="nom@exemple.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="auth-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">Mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete="new-password"
                      required
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="auth-input pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cscm-green transition-colors cursor-pointer outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {successMessage && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs text-center font-medium leading-relaxed">
                    {successMessage}
                  </motion.div>
                )}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs text-center font-medium">
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit" disabled={isVerifying} className="auth-submit-btn disabled:opacity-50 disabled:cursor-not-allowed">
                {isVerifying ? 'Vérification en cours...' : 'Créer mon compte'}
              </button>
            </form>

            <div className="flex justify-center items-center text-xs font-medium pt-1">
              <span className="text-gray-500">Compte existant ?</span>
              <Link to="/login" className="text-cscm-green hover:underline underline-offset-2 ml-1.5">
                Se connecter
              </Link>
            </div>
          </div>
        </div>

        <AuthBrandPanel
          glassTitle="Rejoignez le réseau"
          glassText="Rejoignez la communauté d'affaires de la Chambre Sénégalaise de Commerce au Maroc."
        />
      </motion.div>
    </div>
  );
};
