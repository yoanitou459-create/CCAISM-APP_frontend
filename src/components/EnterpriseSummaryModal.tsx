import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Shield, MapPin, Phone, Mail, Award, FileText, ChevronLeft } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { jsPDF } from 'jspdf';

interface EnterpriseSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  enterprise: any;
}

export const EnterpriseSummaryModal: React.FC<EnterpriseSummaryModalProps> = ({ isOpen, onClose, enterprise }) => {
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !enterprise) return null;

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    doc.setDrawColor(19, 46, 21);
    doc.setLineWidth(1);
    doc.rect(8, 8, 194, 281);
    doc.setDrawColor(235, 208, 120);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277);

    doc.setFillColor(19, 46, 21);
    doc.rect(12, 12, 186, 32, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.text("FICHE TECHNIQUE OFFICIELLE", 20, 28);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(235, 208, 120);
    doc.text("Chambre Sénégalaise de Commerce au Maroc (CSCM)", 20, 36);

    doc.setFillColor(245, 245, 245);
    doc.rect(15, 55, 180, 10, 'F');
    doc.setTextColor(19, 46, 21);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text("1. IDENTITÉ DE L'ENTREPRISE", 20, 61);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    const details = [
      { label: "Raison sociale :", val: enterprise.raisonSociale || enterprise.name },
      { label: "Forme Juridique :", val: enterprise.formeJuridique || 'Société à Responsabilité Limitée' },
      { label: "Date de création :", val: enterprise.dateCreation || 'N/A' },
      { label: "N° Registre Commerce :", val: enterprise.numRC || 'Non Spécifié' },
      { label: "Ninea / ICE :", val: enterprise.ninea || 'Non disponible' },
      { label: "Secteur d'activité :", val: enterprise.secteur || 'Non disponible' },
      { label: "Effectif :", val: `${enterprise.effectif || 'N/A'} personnes` }
    ];

    let y = 72;
    details.forEach(item => {
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(item.label, 20, y);

      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(19, 46, 21);
      doc.text(String(item.val), 70, y);
      y += 8;
    });

    doc.setFillColor(245, 245, 245);
    doc.rect(15, y + 5, 180, 10, 'F');
    doc.setTextColor(19, 46, 21);
    doc.setFont('Helvetica', 'bold');
    doc.text("2. COORDONNÉES DE CONTACT", 20, y + 11);

    y += 22;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text("Adresse :", 20, y);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(19, 46, 21);
    doc.text(`${enterprise.ville}, ${enterprise.pays}`, 70, y);

    y += 8;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text("Téléphone :", 20, y);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(19, 46, 21);
    doc.text(enterprise.telephone || 'Non disponible', 70, y);

    y += 8;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text("E-mail de contact :", 20, y);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(19, 46, 21);
    doc.text(enterprise.email || 'Non disponible', 70, y);

    y += 12;
    doc.setFillColor(245, 245, 245);
    doc.rect(15, y, 180, 10, 'F');
    doc.setTextColor(19, 46, 21);
    doc.setFont('Helvetica', 'bold');
    doc.text("3. DESCRIPTION DE L'ACTIVITÉ", 20, y + 6);

    y += 17;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const desc = enterprise.description || "Nous faisons du conseil et accompagnement technique dans le secteur correspondant.";
    const splitDesc = doc.splitTextToSize(desc, 170);
    doc.text(splitDesc, 20, y);

    if (enterprise.certifications && enterprise.certifications.length > 0) {
      y += 20;
      doc.setFillColor(245, 245, 245);
      doc.rect(15, y, 180, 10, 'F');
      doc.setTextColor(19, 46, 21);
      doc.setFont('Helvetica', 'bold');
      doc.text("4. CERTIFICATS & DOCUMENTS TECHNIQUES", 20, y + 6);

      y += 15;
      enterprise.certifications.forEach((cert: any, idx: number) => {
        if (y < 250) {
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(19, 46, 21);
          doc.text(`${idx + 1}. ${cert.name}`, 20, y);

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);
          doc.text(`Réf: ${cert.code || 'N/A'} | Émis par : ${cert.issuer || 'N/A'} le ${cert.date || 'N/A'}`, 25, y + 5);
          y += 12;
        }
      });
    }

    doc.setTextColor(120, 120, 120);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text("Document officiel généré depuis la base de données administrative de la Chambre.", 15, 260);
    doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 15, 264);

    doc.save(`Fiche_${enterprise.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col bg-cscm-forest/40 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
        />

        {/* Barre supérieure */}
        <div className="relative z-10 shrink-0 flex items-center justify-between gap-3 px-4 md:px-8 py-3.5 bg-gradient-to-r from-[#1E4D2B] via-[#1A4226] to-[#16301E] border-b border-white/15 shadow-lg">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-white bg-white/15 hover:bg-white/25 border border-white/20 font-semibold text-xs md:text-sm transition-all cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-5 h-5 text-cscm-gold-light" />
            <span>Retour à la liste</span>
          </button>
          <p className="text-sm md:text-base font-bold text-white truncate px-2">
            Fiche technique — {enterprise.name}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl text-white/70 hover:bg-white/15 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu centré */}
        <div className="relative z-10 flex-1 flex items-start justify-center overflow-y-auto p-4 md:p-8 min-h-0">
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-4xl rounded-[1.75rem] ring-1 ring-black/5 shadow-[0_30px_80px_-24px_rgba(22,48,30,0.35)] overflow-hidden flex flex-col max-h-full font-sans text-cscm-dark my-auto"
          >
            {/* En-tête fiche */}
            <div className="p-5 md:p-6 bg-gradient-to-r from-cscm-green-soft/90 via-white to-cscm-green-soft/40 border-b border-cscm-green/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
              <div className="flex gap-4 items-center min-w-0">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-cscm-green-soft border border-cscm-green/15 flex items-center justify-center font-bold text-xs text-cscm-green overflow-hidden shadow-sm shrink-0">
                  {enterprise.logo ? (
                    <img src={enterprise.logo} alt={enterprise.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-center font-mono text-[10px] uppercase font-bold tracking-tighter">CSCM</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg md:text-2xl font-sans font-bold text-cscm-dark tracking-wide uppercase leading-tight">
                    Fiche Technique
                  </h1>
                  <p className="text-sm font-bold text-cscm-green mt-0.5 truncate">{enterprise.name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="text-[9px] bg-cscm-green-soft text-cscm-green border border-cscm-green/15 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Référence : {enterprise.memberNo || 'M001'}
                    </span>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full tracking-wide ${
                      enterprise.statutMembre === 'Actif' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                      {enterprise.statutMembre || 'Actif'}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleDownloadPDF} 
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cscm-green hover:bg-cscm-green-mid text-white text-xs font-bold transition-all cursor-pointer shadow-md shrink-0"
                title="Télécharger la fiche PDF"
              >
                <Download className="w-4 h-4" />
                Télécharger PDF
              </button>
            </div>

            {/* Corps */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 min-h-0">
              
              <div className="space-y-3">
                <div className="modal-section-badge">
                  <span className="w-5 h-5 rounded-lg bg-white text-cscm-green flex items-center justify-center text-[10px] font-bold tracking-tighter border border-cscm-green/15">ID</span>
                  <h2 className="text-xs font-bold uppercase tracking-wider">Identité de l'entreprise</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white border border-cscm-green/[0.08] p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-cscm-dark/55">Raison sociale</span>
                    <span className="text-sm font-bold text-cscm-dark mt-1.5 leading-tight">{enterprise.raisonSociale || enterprise.name}</span>
                  </div>
                  <div className="bg-white border border-cscm-green/[0.08] p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-cscm-dark/55">Date d'adhésion</span>
                    <span className="text-sm font-bold text-cscm-dark mt-1.5 leading-tight">{enterprise.dateAdhesion || 'Non spécifiée'}</span>
                  </div>
                  <div className="bg-white border border-cscm-green/[0.08] p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-cscm-dark/55">Forme Juridique</span>
                    <span className="text-xs font-bold text-cscm-dark mt-1.5 leading-tight">{enterprise.formeJuridique || 'Société à Responsabilité Limitée'}</span>
                  </div>
                  <div className="bg-white border border-cscm-green/[0.08] p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-cscm-dark/55">Date de création</span>
                    <span className="text-xs font-mono font-bold text-cscm-dark mt-1.5 leading-tight">{enterprise.dateCreation || 'N/A'}</span>
                  </div>
                  <div className="bg-white border border-cscm-green/[0.08] p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-cscm-dark/55">N° Registre Commerce</span>
                    <span className="text-xs font-mono font-bold text-cscm-dark mt-1.5 leading-tight">{enterprise.numRC || 'Non Spécifié'}</span>
                  </div>
                  <div className="bg-white border border-cscm-green/[0.08] p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-cscm-dark/55">Ninea / ICE</span>
                    <span className="text-xs font-mono font-bold text-cscm-dark mt-1.5 leading-tight">{enterprise.ninea || 'Non disponible'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <div className="modal-section-badge">
                    <MapPin className="w-4 h-4" />
                    <h2 className="text-xs font-bold uppercase tracking-wider">Coordonnées</h2>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-cscm-green/[0.08] space-y-4 shadow-sm">
                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-cscm-green-soft flex items-center justify-center text-cscm-green shrink-0 border border-cscm-green/15">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-cscm-dark/55 block">Adresse</span>
                        <span className="text-xs font-bold text-cscm-dark">{enterprise.ville}, {enterprise.pays}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-cscm-green-soft flex items-center justify-center text-cscm-green shrink-0 border border-cscm-green/15">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-cscm-dark/55 block">Téléphone</span>
                        <span className="text-xs font-mono font-bold text-cscm-dark">{enterprise.telephone || 'Non disponible'}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-cscm-green-soft flex items-center justify-center text-cscm-green shrink-0 border border-cscm-green/15">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-cscm-dark/55 block">E-mail de contact</span>
                        <span className="text-xs font-mono font-bold text-cscm-dark break-all">{enterprise.email || 'Non disponible'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="modal-section-badge">
                    <Shield className="w-4 h-4" />
                    <h2 className="text-xs font-bold uppercase tracking-wider">Statut & Effectif</h2>
                  </div>
                  <div className="bg-white p-5 rounded-2xl border border-cscm-green/[0.08] flex flex-col justify-between min-h-[210px] shadow-sm">
                    <div className="flex justify-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cscm-green-soft text-cscm-green border border-cscm-green/15">
                        <span className="w-2 h-2 rounded-full bg-cscm-green animate-pulse" />
                        {enterprise.statutMembre || 'Actif'}
                      </span>
                    </div>
                    <div className="modal-stat-card bg-cscm-green-soft/50">
                      <span className="text-2xl md:text-3xl font-sans font-bold text-cscm-dark tracking-tight block">
                        {enterprise.effectif || 'N/A'}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-cscm-dark/55 block">
                        Personnes enregistrées
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="modal-section-badge">
                  <Award className="w-4 h-4" />
                  <h2 className="text-xs font-bold uppercase tracking-wider">Activité & Expertise</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-cscm-green/[0.08] p-5 rounded-2xl shadow-sm">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-cscm-dark/55 block mb-1">Secteur d'activité</span>
                    <span className="text-sm font-bold text-cscm-dark leading-tight block">{enterprise.secteur}</span>
                  </div>
                  <div className="bg-white border border-cscm-green/[0.08] p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-cscm-dark/55 block mb-1">Description Technique</span>
                    <span className="text-xs font-medium text-cscm-dark/70 italic leading-relaxed block">
                      "{enterprise.description || "Nous faisons du conseil et accompagnement technique dans le secteur correspondant."}"
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="modal-section-badge">
                  <FileText className="w-4 h-4" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-left">Certificats & Documents Techniques</h2>
                </div>
                <div className="bg-white rounded-2xl border border-cscm-green/[0.08] overflow-hidden divide-y divide-cscm-green/10 shadow-sm text-left">
                  {enterprise.certifications && enterprise.certifications.length > 0 ? (
                    enterprise.certifications.map((cert: any, index: number) => (
                      <div key={index} className="p-4 flex items-center justify-between text-xs gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-cscm-green-soft flex items-center justify-center text-cscm-green shrink-0 border border-cscm-green/15 font-bold text-xs">
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-cscm-dark truncate">{cert.name}</p>
                            <p className="text-[9px] text-cscm-dark/55 font-bold uppercase tracking-wider">
                              Réf: {cert.code || 'N/A'} | Délivré par : {cert.issuer || 'N/A'} le {cert.date || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] bg-cscm-green-soft text-cscm-green border border-cscm-green/15 font-bold px-3 py-1 rounded-full uppercase tracking-wider shrink-0">
                          {cert.fileName ? "Document Joint" : "Validé"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-gray-500 font-medium">
                      Aucun certificat ou agrément technique enregistré pour le moment.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 md:p-6 bg-cscm-green-soft/40 border-t border-cscm-green/10 shrink-0 text-center space-y-1.5">
              <p className="text-[9px] font-bold tracking-widest text-cscm-green uppercase flex justify-center items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cscm-green" />
                Document officiel généré le {new Date().toLocaleDateString()}
                <span className="w-1.5 h-1.5 rounded-full bg-cscm-green" />
                CCAISM Technical Database
              </p>
              <p className="text-[8px] font-bold text-cscm-dark/50 tracking-wide uppercase">
                Ce document est strictement confidentiel et destiné aux vérifications administratives des membres de la CSCM.
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
