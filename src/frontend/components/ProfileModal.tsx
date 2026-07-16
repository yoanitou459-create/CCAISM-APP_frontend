import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Camera, X, CheckSquare } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { getStoredUsers, saveStoredUsers } from '../../database/userStorage';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onLogout }) => {
  useBodyScrollLock(isOpen);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{"nom": "Admin", "prenom": "System", "email": "admin@ccaism.com"}');
  
  const [formData, setFormData] = useState({
    nom: user.nom || 'Admin',
    prenom: user.prenom || 'System',
    email: user.email || 'admin@ccaism.com',
    entreprise: user.entreprise || '',
    langue: 'Français',
    apparence: 'Clair'
  });

  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => {
    return localStorage.getItem('profile_photo');
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setProfilePhoto(result);
        localStorage.setItem('profile_photo', result);
        
        // Update user in users list
        const storedUsers = getStoredUsers();
        const updatedUsersList = storedUsers.map(u => {
          if (u.email.toLowerCase() === user.email.toLowerCase()) {
            return { ...u, photo: result };
          }
          return u;
        });
        saveStoredUsers(updatedUsersList);

        window.dispatchEvent(new Event('user_profile_updated'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const updatedUser = { 
      ...user, 
      nom: formData.nom, 
      prenom: formData.prenom, 
      email: formData.email,
      entreprise: formData.entreprise
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Update user in users list
    const storedUsers = getStoredUsers();
    const currentPhoto = localStorage.getItem('profile_photo');
    const updatedUsersList = storedUsers.map(u => {
      if (u.email.toLowerCase() === user.email.toLowerCase()) {
        return { 
          ...u, 
          nom: formData.nom, 
          prenom: formData.prenom, 
          email: formData.email,
          entreprise: formData.entreprise,
          photo: currentPhoto || u.photo
        };
      }
      return u;
    });
    saveStoredUsers(updatedUsersList);

    // Save appearance preference
    localStorage.setItem('appearance_theme', formData.apparence);
    
    // Notify application
    window.dispatchEvent(new Event('user_profile_updated'));
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="profile-modal-root">
          {/* Backdrop */}
          <motion.div
            key="profile-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[80]"
          />
          
          {/* Modal Container */}
          <div key="profile-modal-container" className="fixed inset-0 flex items-center justify-center p-4 z-[90] pointer-events-none">
            <motion.div
              key="profile-modal-body"
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white text-cscm-dark w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden pointer-events-auto relative flex flex-col max-h-[92vh] border border-[#a69371]/20 font-sans"
            >
              {/* Back Button (Left Arrow) */}
              <button 
                onClick={onClose}
                className="absolute top-6 left-6 p-2 hover:bg-gray-100 rounded-full transition-colors z-10 cursor-pointer"
                aria-label="Retour"
              >
                <ChevronLeft className="w-6 h-6 text-gray-700" />
              </button>

              {/* Close Button (X) */}
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors z-10 cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>

              <div className="p-8 md:p-10 flex flex-col items-center overflow-y-auto">
                {/* Large Circle Avatar with TriKeys layout */}
                <div className="relative mb-8 mt-4">
                  <div className="w-48 h-48 bg-[#5E7D6A] rounded-full flex items-center justify-center shadow-md overflow-hidden border-2 border-[#a69371]/50 bg-radial from-[#496554] to-[#2B4033]">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Crest Lion" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-white relative">
                        {/* Senegal Star in Green, Morocco Star in Red on dark crest */}
                        <div className="flex gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-black border border-white/20 shadow-sm">★</span>
                          <span className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center text-[10px] font-black border border-white/20 shadow-sm">★</span>
                        </div>
                        <div className="font-serif font-black text-xs text-[#ebd078] tracking-wider">CSCM</div>
                        <div className="text-[6px] text-white/80 font-mono mt-1 font-black w-32 leading-tight">CHAMBRE SÉNÉGALAISE DE COMMERCE</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Camera Float Action Icon */}
                  <label 
                    htmlFor="profile-photo-upload"
                    className="absolute bottom-2 right-2 bg-[#ebd078] hover:bg-amber-400 p-3.5 rounded-full shadow-lg transition-transform hover:scale-105 cursor-pointer border-2 border-white flex items-center justify-center text-cscm-dark shrink-0 z-20"
                    title="Changer de photo"
                  >
                    <Camera className="w-5 h-5" />
                  </label>

                  <input 
                    type="file" 
                    id="profile-photo-upload"
                    onChange={handlePhotoChange} 
                    className="hidden" 
                    accept="image/*" 
                  />
                </div>

                {/* Form Inputs based on Screenshot */}
                <div className="w-full space-y-5 text-left">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-[#12210E]/60 uppercase tracking-widest mb-1.5">PRÉNOM</label>
                      <input 
                        type="text" 
                        value={formData.prenom}
                        onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                        className="w-full bg-[#FAF9F5] border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-600 focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-[#12210E]/60 uppercase tracking-widest mb-1.5">NOM</label>
                      <input 
                        type="text" 
                        value={formData.nom}
                        onChange={(e) => setFormData({...formData, nom: e.target.value})}
                        className="w-full bg-[#FAF9F5] border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-[#12210E]/60 uppercase tracking-widest mb-1.5">EMAIL</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-[#FAF9F5] border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-[#12210E]/60 uppercase tracking-widest mb-1.5">NOM DE L'ENTREPRISE (RAISON SOCIALE)</label>
                    <input 
                      type="text" 
                      value={formData.entreprise}
                      onChange={(e) => setFormData({...formData, entreprise: e.target.value})}
                      placeholder="Non spécifié"
                      className="w-full bg-[#FAF9F5] border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-[#12210E]/60 uppercase tracking-widest mb-1.5">LANGUE</label>
                    <select
                      value={formData.langue}
                      onChange={(e) => setFormData({...formData, langue: e.target.value})}
                      className="w-full bg-[#FAF9F5] border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-600 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Français" className="text-gray-950 bg-white">Français</option>
                      <option value="Anglais" className="text-gray-950 bg-white">English</option>
                      <option value="Arabe" className="text-gray-950 bg-white">العربية (Arabe)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-[#12210E]/60 uppercase tracking-widest mb-1.5">APPARENCE</label>
                    <select
                      value={formData.apparence}
                      onChange={(e) => setFormData({...formData, apparence: e.target.value})}
                      className="w-full bg-[#FAF9F5] border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-emerald-600 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Clair" className="text-gray-950 bg-white">Clair</option>
                      <option value="Sombre" className="text-gray-950 bg-white">Sombre (Bêta)</option>
                    </select>
                  </div>

                  {/* Save button matching exact dark green in Screenshot 4 */}
                  <div className="pt-4">
                    <button 
                      onClick={handleSave}
                      className="w-full bg-[#1b381c] hover:bg-[#122613] text-white py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/20 transition-all font-bold text-sm cursor-pointer"
                    >
                      {/* Floppy disk style verification icon */}
                      <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Enregistrer les modifications</span>
                    </button>
                    
                    <button
                      onClick={onLogout}
                      className="w-full mt-3 bg-rose-50 hover:bg-rose-100/50 text-rose-600 py-3 px-6 rounded-2xl transition-all font-bold text-xs cursor-pointer flex items-center justify-center"
                    >
                      Déconnexion administrative
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
