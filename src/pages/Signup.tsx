import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Logo } from '../components/Logo';

export const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Mock signup for frontend-only demo
    if (formData.email && formData.password) {
      navigate('/login', { state: { message: 'Inscription réussie (Mode Démo) ! Connectez-vous.' } });
      return;
    }
    
    setError('Veuillez remplir tous les champs');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card flex flex-col md:flex-row-reverse max-w-4xl w-full overflow-hidden"
      >
        {/* Right Side: Form */}
        <div className="flex-1 p-8 md:p-12 bg-cscm-gold/10">
          <h1 className="text-3xl font-serif text-cscm-gold mb-12 text-center">Inscription</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-cscm-gold text-sm mb-1">Nom</label>
                <input 
                  type="text" 
                  className="input-field"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-cscm-gold text-sm mb-1">Prénom</label>
                <input 
                  type="text" 
                  className="input-field"
                  value={formData.prenom}
                  onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-cscm-gold text-sm mb-1">Email</label>
              <input 
                type="email" 
                className="input-field"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            
            <div>
              <label className="block text-cscm-gold text-sm mb-1">Mot de passe</label>
              <input 
                type="password" 
                className="input-field"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <div className="flex flex-col items-center gap-4 pt-4">
              <button type="submit" className="btn-primary">
                S'inscrire
              </button>
              <p className="text-sm text-cscm-gold/80">
                Avez-vous déjà un compte ? <Link to="/login" className="text-cscm-gold font-bold hover:underline">Se connecter</Link>
              </p>
            </div>
          </form>
        </div>

        {/* Left Side: Logo/Branding */}
        <div className="flex-1 bg-cscm-gold flex items-center justify-center p-12">
          <Logo />
        </div>
      </motion.div>
    </div>
  );
};
