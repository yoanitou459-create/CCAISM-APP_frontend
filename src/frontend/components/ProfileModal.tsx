import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Camera, X, CheckSquare } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { getStoredUsers, saveStoredUsers } from '../../database/userStorage';
import { ModalPortal } from './ModalPortal';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onLogout }) => {
  useBodyScrollLock(isOpen);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{"nom": "Admin", "prenom": "System", "email": "admin@cscm.com"}');
  
  const [formData, setFormData] = useState({
    nom: user.nom || 'Admin',
    prenom: user.prenom || 'System',
    email: user.email || 'admin@cscm.com',
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
    <ModalPortal>
    <AnimatePresence>
      {isOpen && (
        <div key="profile-modal-container" className="modal-overlay">
          <motion.div
            key="profile-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="modal-backdrop"
          />
            <motion.div
              key="profile-modal-body"
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="modal-shell max-w-xl bg-white/95 text-cscm-dark font-sans"
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
                      <label className="field-label">PRÉNOM</label>
                      <input 
                        type="text" 
                        value={formData.prenom}
                        onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                        className="field-input"
                      />
                    </div>
                    <div>
                      <label className="field-label">NOM</label>
                      <input 
                        type="text" 
                        value={formData.nom}
                        onChange={(e) => setFormData({...formData, nom: e.target.value})}
                        className="field-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="field-label">EMAIL</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="field-input"
                    />
                  </div>

                  <div>
                    <label className="field-label">NOM DE L'ENTREPRISE (RAISON SOCIALE)</label>
                    <input 
                      type="text" 
                      value={formData.entreprise}
                      onChange={(e) => setFormData({...formData, entreprise: e.target.value})}
                      placeholder="Non spécifié"
                      className="field-input"
                    />
                  </div>

                  <div>
                    <label className="field-label">LANGUE</label>
                    <select
                      value={formData.langue}
                      onChange={(e) => setFormData({...formData, langue: e.target.value})}
                      className="field-select"
                    >
                      <option value="Français" className="text-gray-950 bg-white">Français</option>
                      <option value="Anglais" className="text-gray-950 bg-white">English</option>
                      <option value="Arabe" className="text-gray-950 bg-white">العربية (Arabe)</option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label">APPARENCE</label>
                    <select
                      value={formData.apparence}
                      onChange={(e) => setFormData({...formData, apparence: e.target.value})}
                      className="field-select"
                    >
                      <option value="Clair" className="text-gray-950 bg-white">Clair</option>
                      <option value="Sombre" className="text-gray-950 bg-white">Sombre (Bêta)</option>
                    </select>
                  </div>

                  {/* Save button matching exact dark green in Screenshot 4 */}
                  <div className="pt-4">
                    <button 
                      onClick={handleSave}
                      className="btn-cta"
                    >
                      {/* Floppy disk style verification icon */}
                      <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>Enregistrer les modifications</span>
                    </button>
                    
                    <button
                      onClick={onLogout}
                      className="w-full mt-3 bg-rose-50 hover:bg-rose-100 text-rose-600 py-3 px-6 rounded-xl border border-rose-100 transition-all font-bold text-xs uppercase tracking-wider cursor-pointer flex items-center justify-center active:scale-[0.99]"
                    >
                      Déconnexion administrative
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
        </div>
      )}
    </AnimatePresence>
    </ModalPortal>
  );
};
