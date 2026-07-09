import React, { useState } from 'react';
import { UserCircle, LogOut, Settings } from 'lucide-react';
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
      <header className="bg-white/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-gray-100 sticky top-0 z-40 shadow-sm px-6 md:px-8">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => navigate('/dashboard')}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4B9040] to-[#2E5F25] flex items-center justify-center text-white font-sans font-bold text-sm shadow-md shadow-cscm-green/25 group-hover:scale-105 transition-transform duration-300">
            CS
          </div>
          <div>
            <h1 className="text-lg font-sans font-bold text-[#274420] leading-none group-hover:text-cscm-green transition-colors duration-300">CSCM</h1>
            <p className="text-[9px] text-[#22301C]/55 uppercase tracking-widest font-bold mt-0.5">Chambre Sénégalaise</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-[#274420] leading-tight">{user.prenom} {user.nom}</span>
            <span className="text-[10px] text-cscm-green font-medium">
              {user.role === 'ADMIN' ? 'Administrateur' : user.role === 'MODERATEUR' ? 'Modérateur' : 'Membre Privilégié'}
            </span>
          </div>
          
          <button 
            onClick={() => setIsProfileOpen(true)} 
            className="w-10 h-10 rounded-full bg-cscm-green-soft flex items-center justify-center text-cscm-green hover:scale-105 hover:shadow-md hover:shadow-cscm-green/15 transition-all duration-300 cursor-pointer relative border border-cscm-green/15"
            title="Mon Profil"
          >
            <UserCircle className="w-6 h-6" />
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
