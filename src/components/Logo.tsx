import React from 'react';
import logoImg from './logo.png';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      <div className="relative w-32 h-32 mb-4">
        <div className="absolute inset-0 bg-cscm-gold rounded-2xl rotate-3 shadow-lg flex items-center justify-center overflow-hidden border-2 border-cscm-green/20">
          {logoImg ? (
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
      </div>
      <h2 className="text-cscm-gold font-serif text-lg leading-tight">Chambre</h2>
      <p className="text-cscm-gold/85 text-[10px] uppercase tracking-widest font-bold">Sénégalaise de Commerce au Maroc</p>
    </div>
  );
};
