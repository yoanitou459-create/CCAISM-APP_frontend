import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Logo } from '../components/Logo';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Mock login for frontend-only demo
    if (email && password) {
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        nom: 'Utilisateur',
        prenom: 'Démo',
        email: email,
        role: 'MEMBRE'
      }));
      navigate('/dashboard');
      return;
    }
    
    setError('Veuillez remplir tous les champs');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card flex flex-col md:flex-row max-w-4xl w-full overflow-hidden"
      >
        {/* Left Side: Form */}
        <div className="flex-1 p-8 md:p-12 bg-cscm-gold/10">
          <h1 className="text-3xl font-serif text-cscm-gold mb-12 text-center">Connexion</h1>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-cscm-gold text-sm mb-1">Email</label>
              <input 
                type="email" 
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-cscm-gold text-sm mb-1">Mot de passe</label>
              <input 
                type="password" 
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <div className="flex justify-center pt-4">
              <button type="submit" className="btn-primary">
                Se connecter
              </button>
            </div>
          </form>

          <div className="mt-12 flex justify-between text-sm text-cscm-gold/80">
            <Link to="/signup" className="hover:text-cscm-gold transition-colors">S'inscrire</Link>
            <Link to="/forgot-password" className="hover:text-cscm-gold transition-colors">Mot de passe oublié ?</Link>
          </div>
        </div>

        {/* Right Side: Logo/Branding */}
        <div className="flex-1 bg-cscm-gold flex items-center justify-center p-12">
          <Logo />
        </div>
      </motion.div>
    </div>
  );
};
