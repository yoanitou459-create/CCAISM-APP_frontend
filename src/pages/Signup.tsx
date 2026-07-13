import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { AuthBrandPanel } from '../components/AuthBrandPanel';
import { Eye, EyeOff } from 'lucide-react';
import { saveStoredUsers, fetchLatestUsers } from '../utils/userStorage';

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

  // Redirect if already logged in
  useEffect(() => {
    fetchLatestUsers(); // Pre-fetch from Firestore in the background on mount
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
        let updatedUsers;

        const finalUser = matchedUser 
          ? {
              ...matchedUser,
              nom: formData.nom.trim(),
              prenom: formData.prenom.trim(),
              password: formData.password,
              status: 'Actif' as const
            }
          : {
              id: 'u_' + Date.now(),
              nom: formData.nom.trim(),
              prenom: formData.prenom.trim(),
              email: trimmedEmail,
              role: 'MEMBRE' as const,
              password: formData.password,
              status: 'Actif' as const,
              dateCreation: new Date().toISOString().split('T')[0]
            };

        if (matchedUser) {
          updatedUsers = users.map(u => u.email.toLowerCase() === trimmedEmail ? finalUser : u);
        } else {
          updatedUsers = [...users, finalUser];
        }

        await saveStoredUsers(updatedUsers);

        // Immediate Auto-Login
        localStorage.setItem('token', `mock-token-${finalUser.id}`);
        localStorage.setItem('user', JSON.stringify({
          id: finalUser.id,
          nom: finalUser.nom,
          prenom: finalUser.prenom,
          email: finalUser.email,
          role: finalUser.role
        }));
        localStorage.setItem('cscm_just_registered', 'true');

        // Notify app shell of profile update and navigate directly to dashboard
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

  return (
    <div className="auth-shell auth-shell--decorated">
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

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="auth-fields-box space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Prénom</label>
                    <input type="text" name="given-name" autoComplete="given-name" required placeholder="Prénom" value={formData.prenom} onChange={(e) => setFormData({ ...formData, prenom: e.target.value })} className="auth-input" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500">Nom</label>
                    <input type="text" name="family-name" autoComplete="family-name" required placeholder="Nom" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="auth-input" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">Email</label>
                  <input type="email" name="email" autoComplete="username" required placeholder="nom@exemple.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="auth-input" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500">Mot de passe</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} name="password" autoComplete="new-password" required placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="auth-input pr-11" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cscm-green transition-colors cursor-pointer outline-none" tabIndex={-1}>
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
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
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
