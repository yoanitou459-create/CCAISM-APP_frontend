import React, { useState, useRef, useEffect } from 'react';
import { Camera } from 'lucide-react';
import logoImg from './logo.png';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
  const [logoImage, setLogoImage] = useState<string | null>(() => {
    return localStorage.getItem('cscm_chamber_logo');
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpdate = () => {
    setLogoImage(localStorage.getItem('cscm_chamber_logo'));
  };

  useEffect(() => {
    window.addEventListener('chamber_logo_updated', handleLogoUpdate);
    return () => {
      window.removeEventListener('chamber_logo_updated', handleLogoUpdate);
    };
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoImage(result);
        localStorage.setItem('cscm_chamber_logo', result);
        window.dispatchEvent(new Event('chamber_logo_updated'));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div className="relative w-32 h-32 mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <div className="absolute inset-0 bg-cscm-gold rounded-2xl rotate-3 shadow-lg flex items-center justify-center overflow-hidden border-2 border-cscm-green/20">
          {logoImage ? (
            <img src={logoImage} alt="Custom Logo" className="w-full h-full object-cover -rotate-3" />
          ) : logoImg ? (
            <img src={logoImg} alt="Official Logo" className="w-full h-full object-contain p-2 -rotate-3" />
          ) : (
            <div className="flex flex-col items-center">
               <div className="flex gap-1 mb-1">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold">★</div>
                  <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-[8px] text-white font-bold">★</div>
               </div>
               <div className="w-12 h-8 bg-cscm-green/20 rounded flex items-center justify-center">
                  <span className="text-cscm-green font-black text-xl">CSCM</span>
               </div>
            </div>
          )}
        </div>
        
        {/* Overlay for upload */}
        <div className="absolute inset-0 bg-black/40 rounded-2xl rotate-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="text-white w-8 h-8 -rotate-3" />
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImageChange} 
          className="hidden" 
          accept="image/*" 
        />
      </div>
      <h2 className="text-cscm-gold font-serif text-lg leading-tight">Chambre</h2>
      <p className="text-cscm-good text-cscm-gold/85 text-[10px] uppercase tracking-widest font-bold">Sénégalaise de Commerce au Maroc</p>
    </div>
  );
};
