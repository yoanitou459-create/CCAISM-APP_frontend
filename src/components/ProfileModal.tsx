import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Pencil, LogOut, UserCircle2, Camera, Save, X } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onLogout }) => {
  useBodyScrollLock(isOpen);

  const [isEditing, setIsEditing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{"nom": "Utilisateur", "prenom": "Démo", "email": "demo@example.com"}');
  
  const [formData, setFormData] = useState({
    nom: user.nom,
    prenom: user.prenom,
    email: user.email
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // In a real app, we would send this to the backend
    const updatedUser = { ...user, ...formData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setIsEditing(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#E5E5E5] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden pointer-events-auto relative flex flex-col max-h-[90vh]"
            >
              {/* Back Button */}
              <button 
                onClick={isEditing ? () => setIsEditing(false) : onClose}
                className="absolute top-6 left-6 p-2 hover:bg-black/5 rounded-full transition-colors z-10"
              >
                <ChevronLeft className="w-8 h-8 text-black" />
              </button>

              {isEditing && (
                <button 
                  onClick={() => setIsEditing(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-black/5 rounded-full transition-colors z-10"
                >
                  <X className="w-6 h-6 text-black" />
                </button>
              )}

              <div className="p-8 md:p-12 flex flex-col items-center overflow-y-auto">
                {/* Large Avatar / Photo Upload */}
                <div className="relative mb-12">
                  <div className="w-64 h-64 bg-[#5E7D6A] rounded-full flex items-center justify-center shadow-inner overflow-hidden border-4 border-white">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle2 className="w-48 h-48 text-white/90" />
                    )}
                  </div>
                  {isEditing && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-4 right-4 bg-cscm-gold p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
                    >
                      <Camera className="w-8 h-8 text-white" />
                    </button>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoChange} 
                    className="hidden" 
                    accept="image/*" 
                  />
                </div>

                {!isEditing ? (
                  <>
                    <div className="text-center mb-12">
                      <h2 className="text-3xl font-serif font-bold text-cscm-dark">{user.prenom} {user.nom}</h2>
                      <p className="text-gray-600">{user.email}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="flex-1 bg-[#A69371] hover:bg-[#968361] text-black font-serif text-xl py-4 px-6 rounded-lg flex items-center justify-center gap-3 shadow-md transition-all active:scale-95"
                      >
                        <Pencil className="w-6 h-6" />
                        Modifier les informations
                      </button>
                      
                      <button 
                        onClick={onLogout}
                        className="flex-1 bg-[#C85250] hover:bg-[#B84240] text-black font-serif text-xl py-4 px-6 rounded-lg flex items-center justify-center gap-3 shadow-md transition-all active:scale-95"
                      >
                        <LogOut className="w-6 h-6" />
                        Déconnexion
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="w-full max-w-lg space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prénom</label>
                        <input 
                          type="text" 
                          value={formData.prenom}
                          onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                          className="w-full bg-white border rounded-lg p-3 outline-none focus:ring-2 focus:ring-cscm-green"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom</label>
                        <input 
                          type="text" 
                          value={formData.nom}
                          onChange={(e) => setFormData({...formData, nom: e.target.value})}
                          className="w-full bg-white border rounded-lg p-3 outline-none focus:ring-2 focus:ring-cscm-green"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-white border rounded-lg p-3 outline-none focus:ring-2 focus:ring-cscm-green"
                      />
                    </div>
                    <div className="pt-6">
                      <button 
                        onClick={handleSave}
                        className="w-full bg-cscm-green hover:bg-cscm-green/90 text-white font-serif text-xl py-4 px-6 rounded-lg flex items-center justify-center gap-3 shadow-md transition-all active:scale-95"
                      >
                        <Save className="w-6 h-6" />
                        Enregistrer les modifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
