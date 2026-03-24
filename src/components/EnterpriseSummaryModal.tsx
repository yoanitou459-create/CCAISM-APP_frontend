import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, FileText, Printer, Share2 } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface EnterpriseSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  enterprise: any;
}

export const EnterpriseSummaryModal: React.FC<EnterpriseSummaryModalProps> = ({ isOpen, onClose, enterprise }) => {
  useBodyScrollLock(isOpen);

  if (!isOpen || !enterprise) return null;

  const handleDownloadPDF = () => {
    alert(`Téléchargement de la fiche technique pour ${enterprise.name}...`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white w-full max-w-4xl rounded-sm shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[95vh] border-[12px] border-[#1A3F23]"
        >
          {/* Technical Sheet Header */}
          <div className="p-6 border-b-2 border-[#1A3F23] flex justify-between items-start bg-white">
            <div className="flex gap-6 items-center">
              <div className="w-24 h-24 border-2 border-[#1A3F23] flex items-center justify-center font-bold text-[#1A3F23] bg-gray-50 overflow-hidden">
                {enterprise.logo ? (
                  <img src={enterprise.logo} alt={enterprise.name} className="w-full h-full object-cover" />
                ) : (
                  "LOGO"
                )}
              </div>
              <div>
                <h1 className="text-3xl font-serif font-bold text-[#1A3F23] uppercase tracking-tighter">Fiche Technique Entreprise</h1>
                <p className="text-[#D4AF37] font-bold tracking-widest text-sm">RÉFÉRENCE : {enterprise.memberNo}</p>
                <div className="h-1 w-20 bg-[#D4AF37] mt-1" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDownloadPDF} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#1A3F23]">
                <Printer className="w-6 h-6" />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-red-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Technical Sheet Body */}
          <div className="p-10 overflow-y-auto bg-white font-sans">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Left Column - Identity */}
              <div className="md:col-span-2 space-y-8">
                <section>
                  <h2 className="text-lg font-bold bg-[#1A3F23] text-white px-4 py-1 mb-4 inline-block">IDENTITÉ DE L'ENTREPRISE</h2>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div>
                      <p className="text-gray-500 uppercase text-[10px] font-bold">Dénomination</p>
                      <p className="font-bold text-lg border-b border-gray-200 pb-1">{enterprise.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 uppercase text-[10px] font-bold">Raison Sociale</p>
                      <p className="font-bold text-lg border-b border-gray-200 pb-1">{enterprise.raisonSociale}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 uppercase text-[10px] font-bold">Forme Juridique</p>
                      <p className="font-medium">{enterprise.formeJuridique || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 uppercase text-[10px] font-bold">Date de Création</p>
                      <p className="font-medium">{enterprise.dateCreation || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 uppercase text-[10px] font-bold">N° Registre Commerce</p>
                      <p className="font-medium">{enterprise.numRC || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 uppercase text-[10px] font-bold">NINEA / ICE</p>
                      <p className="font-medium">{enterprise.ninea || 'N/A'}</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-bold bg-[#1A3F23] text-white px-4 py-1 mb-4 inline-block">ACTIVITÉ & EXPERTISE</h2>
                  <div className="bg-gray-50 p-6 border-l-4 border-[#D4AF37] space-y-4">
                    <div>
                      <p className="text-gray-500 uppercase text-[10px] font-bold mb-1">Secteur d'activité principal</p>
                      <p className="font-bold text-[#1A3F23]">{enterprise.secteur}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 uppercase text-[10px] font-bold mb-1">Description technique</p>
                      <p className="text-sm leading-relaxed text-gray-700 italic">
                        {enterprise.description || "Détails techniques non renseignés."}
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column - Status & Contact */}
              <div className="space-y-8 border-l border-gray-100 pl-8">
                <section>
                  <h2 className="text-lg font-bold text-[#1A3F23] border-b-2 border-[#1A3F23] mb-4">STATUT</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 uppercase">État Membre</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        enterprise.statutMembre === 'Actif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {enterprise.statutMembre}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 uppercase">Effectif</span>
                      <span className="font-bold">{enterprise.effectif} pers.</span>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-bold text-[#1A3F23] border-b-2 border-[#1A3F23] mb-4">COORDONNÉES</h2>
                  <div className="space-y-4 text-sm">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded">📍</div>
                      <div>
                        <p className="font-bold">{enterprise.ville}</p>
                        <p className="text-xs text-gray-500">{enterprise.pays}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded">📞</div>
                      <p className="font-medium">{enterprise.telephone}</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-gray-100 flex items-center justify-center rounded">✉️</div>
                      <p className="font-medium break-all">{enterprise.email}</p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* Technical Sheet Footer */}
          <div className="p-6 bg-[#F8F9FA] border-t border-gray-200 flex justify-between items-center">
            <div className="text-[10px] text-gray-400 uppercase tracking-widest">
              Généré le {new Date().toLocaleDateString()} • CCAISM Technical Database
            </div>
            <button
              onClick={handleDownloadPDF}
              className="bg-[#1A3F23] text-[#D4AF37] px-10 py-3 rounded-sm flex items-center gap-3 hover:bg-[#14321B] transition-all shadow-lg font-bold uppercase tracking-widest text-sm"
            >
              <Download className="w-5 h-5" />
              Exporter Fiche
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
