import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Camera, X, CheckSquare } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

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
      email: formData.email 
    };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    // Save appearance preference
    localStorage.setItem('appearance_theme', formData.apparence);
    
    // Notify application
    window.dispatchEvent(new Event('user_profile_updated'));
    onClose();
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]"
          />
          
          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 z-[90] pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white text-[#22301C] w-full max-w-xl rounded-[2rem] ring-1 ring-black/5 shadow-[0_30px_80px_-24px_rgba(62,123,50,0.3)] overflow-hidden pointer-events-auto relative flex flex-col max-h-[92vh] font-sans"
            >
              {/* Back Button (Left Arrow) */}
              <button 
                onClick={onClose}
                className="absolute top-6 left-6 p-2 hover:bg-cscm-green-soft/70 rounded-full transition-colors duration-300 z-10 cursor-pointer"
                aria-label="Retour"
              >
                <ChevronLeft className="w-6 h-6 text-[#274420]" />
              </button>

              {/* Close Button (X) */}
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-cscm-green-soft/70 rounded-full transition-colors duration-300 z-10 cursor-pointer"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 text-[#274420]" />
              </button>

              <div className="p-8 md:p-10 flex flex-col items-center overflow-y-auto">
                {/* Large Circle Avatar with TriKeys layout */}
                <div className="relative mb-8 mt-4">
                  <div className="w-48 h-48 rounded-full flex items-center justify-center shadow-lg shadow-cscm-green/20 overflow-hidden ring-2 ring-cscm-gold/40 bg-gradient-to-br from-[#1E4D2B] via-[#1A4226] to-[#16301E]">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Crest Lion" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-white relative">
                        {/* Senegal Star in Green, Morocco Star in Red on dark crest */}
                        <div className="flex gap-2 mb-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-black border border-white/20 shadow-sm">★</span>
                          <span className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center text-[10px] font-black border border-white/20 shadow-sm">★</span>
                        </div>
                        <div className="font-sans font-bold text-xs text-cscm-gold-light tracking-wider">CSCM</div>
                        <div className="text-[6px] text-white/80 font-mono mt-1 font-black w-32 leading-tight">CHAMBRE SÉNÉGALAISE DE COMMERCE</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Camera Float Action Icon */}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 bg-[#E3C766] hover:bg-[#F4E3A8] p-3.5 rounded-full shadow-lg shadow-cscm-gold/30 transition-all duration-300 hover:scale-105 cursor-pointer border-2 border-white flex items-center justify-center text-[#274420] shrink-0"
                    title="Changer de photo"
                  >
                    <Camera className="w-5 h-5" />
                  </button>

                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoChange} 
                    className="hidden" 
                    accept="image/*" 
                  />
                </div>

                {/* Form Inputs based on Screenshot */}
                <div className="w-full space-y-5 text-left">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-[#22301C]/55 uppercase tracking-widest mb-1.5">PRÉNOM</label>
                      <input 
                        type="text" 
                        value={formData.prenom}
                        onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                        className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] focus:bg-white placeholder:text-gray-300 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold text-[#22301C]/55 uppercase tracking-widest mb-1.5">NOM</label>
                      <input 
                        type="text" 
                        value={formData.nom}
                        onChange={(e) => setFormData({...formData, nom: e.target.value})}
                        className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] focus:bg-white placeholder:text-gray-300 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-[#22301C]/55 uppercase tracking-widest mb-1.5">EMAIL</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] focus:bg-white placeholder:text-gray-300 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-[#22301C]/55 uppercase tracking-widest mb-1.5">LANGUE</label>
                    <select
                      value={formData.langue}
                      onChange={(e) => setFormData({...formData, langue: e.target.value})}
                      className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Français" className="text-gray-950 bg-white">Français</option>
                      <option value="Anglais" className="text-gray-950 bg-white">English</option>
                      <option value="Arabe" className="text-gray-950 bg-white">العربية (Arabe)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-[#22301C]/55 uppercase tracking-widest mb-1.5">APPARENCE</label>
                    <select
                      value={formData.apparence}
                      onChange={(e) => setFormData({...formData, apparence: e.target.value})}
                      className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm font-semibold text-gray-900 outline-none focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="Clair" className="text-gray-950 bg-white">Clair</option>
                      <option value="Sombre" className="text-gray-950 bg-white">Sombre (Bêta)</option>
                    </select>
                  </div>

                  {/* Save button matching exact dark green in Screenshot 4 */}
                  <div className="pt-4">
                    <button 
                      onClick={handleSave}
                      className="btn-sheen w-full bg-gradient-to-b from-[#4B9040] to-[#3A7230] hover:from-[#529B46] hover:to-[#417F36] text-white py-4 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-lg shadow-cscm-green/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 font-bold text-sm cursor-pointer"
                    >
                      {/* Floppy disk style verification icon */}
                      <CheckSquare className="w-5 h-5 text-cscm-gold-light shrink-0" />
                      <span>Enregistrer les modifications</span>
                    </button>
                    
                    <button
                      onClick={onLogout}
                      className="w-full mt-3 bg-rose-50 hover:bg-rose-100/70 text-rose-600 border border-rose-200/70 py-3 px-6 rounded-2xl transition-all duration-300 font-bold text-xs cursor-pointer flex items-center justify-center"
                    >
                      Déconnexion administrative
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
