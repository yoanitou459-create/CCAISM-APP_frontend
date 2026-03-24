import React, { useState } from 'react';
import { UserCircle } from 'lucide-react';
import { ProfileModal } from './ProfileModal';
import { useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{"nom": "Utilisateur", "prenom": "Démo"}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      <header className="bg-white p-4 flex justify-between items-center border-b-2 border-[#4A3728]/10 sticky top-0 z-40">
        <div 
          className="flex items-center gap-4 cursor-pointer" 
          onClick={() => navigate('/dashboard')}
        >
          <img 
            src="/logo.png" 
            alt="CCAISM Logo" 
            className="h-12 w-auto" 
            onError={(e) => (e.currentTarget.src = 'https://picsum.photos/seed/cscm/100/100')} 
          />
          <h1 className="text-2xl font-bold text-[#1A3F23] font-serif">CCAISM</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:block text-sm font-medium text-[#4A3728]">{user.prenom} {user.nom}</span>
          <button onClick={() => setIsProfileOpen(true)} className="hover:scale-110 transition-transform">
            <UserCircle className="w-12 h-12 text-[#5E7D6A]" />
          </button>
        </div>
      </header>

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        onLogout={handleLogout}
      />
    </>
  );
};
