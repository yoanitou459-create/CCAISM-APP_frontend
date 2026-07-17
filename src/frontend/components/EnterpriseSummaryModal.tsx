import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Shield, MapPin, Phone, Mail, Award, CheckCircle2, Star, FileText, AlertCircle } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { jsPDF } from 'jspdf';
import { ModalPortal } from './ModalPortal';

interface EnterpriseSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  enterprise: any;
}

export const EnterpriseSummaryModal: React.FC<EnterpriseSummaryModalProps> = ({ isOpen, onClose, enterprise }) => {
  useBodyScrollLock(isOpen);

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Border decoration
    doc.setDrawColor(19, 46, 21); // #132e15
    doc.setLineWidth(1);
    doc.rect(8, 8, 194, 281); // outer margin
    doc.setDrawColor(235, 208, 120); // #ebd078 gold border
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277);

    // Header bar
    doc.setFillColor(19, 46, 21); // #132e15
    doc.rect(12, 12, 186, 32, 'F');

    // Header Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.text("FICHE TECHNIQUE OFFICIELLE", 20, 28);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(235, 208, 120); // gold
    doc.text("Chambre Sénégalaise de Commerce au Maroc (CSCM)", 20, 36);

    // Section 1: IDENTITÉ DE L'ENTREPRISE
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
      { label: "Nom de l'entreprise (Raison sociale) :", val: enterprise.raisonSociale || enterprise.name },
      { label: "Date d'adhésion :", val: enterprise.dateAdhesion || 'N/A' },
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

    // Section 2: COORDONNÉES DE CONTACT
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

    // Section 3: DESCRIPTION DE L'ACTIVITÉ
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

    // Section 4: CERTIFICATS & DOCUMENTS TECHNIQUES
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

    // Footer signature and seal
    doc.setTextColor(120, 120, 120);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text("Document officiel généré depuis la base de données administrative de la Chambre.", 15, 260);
    doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 15, 264);

    doc.save(`Fiche_${enterprise.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  return (
    <ModalPortal>
    <AnimatePresence>
      {isOpen && enterprise && (
        <div key="summary-modal-container" className="modal-overlay selection:bg-[#2E4D31] selection:text-[#ebd078]">
          <motion.div
            key="summary-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="modal-backdrop"
          />
          
          <motion.div
            key="summary-modal-body"
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            className="modal-shell max-w-4xl bg-white/95 font-sans text-[#1A3D18]"
          >
          {/* Header verre vert */}
          <div className="p-5 md:p-6 bg-gradient-to-r from-[#2E4D31] via-[#355a38] to-[#2E4D31] text-white flex justify-between items-start gap-4 relative overflow-hidden shrink-0 border-b border-white/10">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none blur-2xl" />
            
            <div className="flex gap-4 items-center relative z-10 min-w-0 flex-1">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white border-2 border-cscm-gold/50 flex items-center justify-center font-black text-xs text-[#2E4D31] overflow-hidden shadow-lg shrink-0">
                {enterprise.logo ? (
                  <img src={enterprise.logo} alt={enterprise.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-center font-mono text-[10px] uppercase font-black tracking-tighter">CSCM</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cscm-gold/90">Fiche technique</p>
                <h1 className="text-lg md:text-2xl font-serif font-black text-white tracking-tight leading-tight mt-0.5">
                  {enterprise.raisonSociale || enterprise.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[9px] bg-white/15 text-white border border-white/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Réf. {enterprise.memberNo || 'M001'}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wide ${
                    enterprise.statutMembre === 'Actif' ? 'bg-emerald-400/25 text-emerald-100 border border-emerald-300/30' : 'bg-rose-500/30 text-rose-100 border border-rose-300/30'
                  }`}>
                    {enterprise.statutMembre || 'Actif'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 relative z-10 shrink-0">
              <button 
                onClick={handleDownloadPDF} 
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 transition-all flex items-center justify-center text-cscm-gold cursor-pointer shrink-0 border border-white/20"
                title="Télécharger la fiche"
              >
                <Download className="w-5 h-5" />
              </button>
              <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 transition-all flex items-center justify-center text-white cursor-pointer shrink-0 border border-white/20"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Corps scrollable */}
          <div className="p-6 md:p-8 overflow-y-auto space-y-6 bg-gradient-to-b from-white/40 to-transparent">
            
            {/* Section: IDENTITÉ */}
            <div className="space-y-3">
              <div className="bg-[#2E4D31]/90 backdrop-blur-sm px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-white shadow-md shadow-[#2E4D31]/15">
                <span className="w-6 h-6 rounded-lg bg-cscm-gold/20 text-cscm-gold flex items-center justify-center text-[10px] font-black">ID</span>
                <h2 className="text-xs font-black uppercase tracking-wider">Identité de l'entreprise</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white/70 backdrop-blur-md border border-white/80 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60">Nom de l'entreprise (Raison sociale)</span>
                  <span className="text-sm font-black text-[#1A3D18] mt-1.5 leading-tight">{enterprise.raisonSociale || enterprise.name}</span>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-white/80 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60">Date d'adhésion</span>
                  <span className="text-sm font-black text-[#1A3D18] mt-1.5 leading-tight">{enterprise.dateAdhesion || 'Non spécifiée'}</span>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-white/80 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60">Forme Juridique</span>
                  <span className="text-xs font-bold text-[#1A3D18] mt-1.5 leading-tight">{enterprise.formeJuridique || 'Société à Responsabilité Limitée'}</span>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-white/80 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60">Date de création</span>
                  <span className="text-xs font-mono font-bold text-[#1A3D18] mt-1.5 leading-tight">{enterprise.dateCreation || 'N/A'}</span>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-white/80 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60">N° Registre Commerce</span>
                  <span className="text-xs font-mono font-bold text-[#1A3D18] mt-1.5 leading-tight">{enterprise.numRC || 'Non Spécifié'}</span>
                </div>

                <div className="bg-white/70 backdrop-blur-md border border-white/80 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60">Ninea / ICE</span>
                  <span className="text-xs font-mono font-bold text-[#1A3D18] mt-1.5 leading-tight">{enterprise.ninea || 'Non disponible'}</span>
                </div>
              </div>
            </div>

            {/* Split row: Coordonnées & Statut/Effectif */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Coordonnées */}
              <div className="space-y-3">
                <div className="bg-[#2E4D31]/90 backdrop-blur-sm px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-white shadow-md shadow-[#2E4D31]/15">
                  <MapPin className="w-4 h-4 text-[#ebd078]" />
                  <h2 className="text-xs font-black uppercase tracking-wider">Coordonnées</h2>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#132e15]/15 space-y-4 shadow-sm">
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-[#132e15]/10 flex items-center justify-center text-[#1A3D18] shrink-0 border border-[#132e15]/15">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Adresse</span>
                      <span className="text-xs font-bold text-[#1A3D18]">{enterprise.ville}, {enterprise.pays}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-[#132e15]/10 flex items-center justify-center text-[#1A3D18] shrink-0 border border-[#132e15]/15">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Téléphone</span>
                      <span className="text-xs font-mono font-bold text-[#1A3D18]">{enterprise.telephone || 'Non disponible'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-[#132e15]/10 flex items-center justify-center text-[#1A3D18] shrink-0 border border-[#132e15]/15">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">E-mail de contact</span>
                      <span className="text-xs font-mono font-bold text-[#1A3D18] break-all">{enterprise.email || 'Non disponible'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statut & Effectif */}
              <div className="space-y-3">
                <div className="bg-[#2E4D31]/90 backdrop-blur-sm px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-white shadow-md shadow-[#2E4D31]/15">
                  <Shield className="w-4 h-4 text-[#ebd078]" />
                  <h2 className="text-xs font-black uppercase tracking-wider">Statut & Effectif</h2>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#132e15]/15 flex flex-col gap-4 shadow-sm">
                  <div className="flex justify-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      enterprise.statutMembre === 'Actif'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${enterprise.statutMembre === 'Actif' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      {enterprise.statutMembre || 'Actif'}
                    </span>
                  </div>

                  <div className="bg-[#132e15] border border-[#132e15] rounded-xl p-4 text-center space-y-1">
                    <span className="text-2xl md:text-3xl font-serif font-black text-white tracking-tight block">
                      {enterprise.effectif || 'N/A'}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/80 block">
                      Personnes enregistrées
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Activité & Expertise */}
            <div className="space-y-3">
              <div className="bg-[#2E4D31]/90 backdrop-blur-sm px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-white shadow-md shadow-[#2E4D31]/15">
                <Award className="w-4 h-4 text-[#ebd078]" />
                <h2 className="text-xs font-black uppercase tracking-wider">Activité & Expertise</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sector Card */}
                <div className="bg-white border border-[#132e15]/15 p-5 rounded-2xl shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block mb-1">Secteur d'activité</span>
                  <span className="text-sm font-black text-[#1A3D18] leading-tight block">{enterprise.secteur}</span>
                </div>

                {/* Tech Desc Card */}
                <div className="bg-white border border-[#132e15]/15 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block mb-1">Description Technique</span>
                  <span className="text-xs font-medium text-[#1A3D18] italic leading-relaxed block">
                    "{enterprise.description || "Nous faisons du conseil et accompagnement technique dans le secteur correspondant."}"
                  </span>
                </div>
              </div>
            </div>

            {/* Licences & Certificats techniques */}
            <div className="space-y-3">
              <div className="bg-[#2E4D31]/90 backdrop-blur-sm px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-white shadow-md shadow-[#2E4D31]/15">
                <FileText className="w-4 h-4 text-[#ebd078]" />
                <h2 className="text-xs font-black uppercase tracking-wider text-left">Certificats & Documents Techniques</h2>
              </div>

              <div className="bg-white rounded-2xl border border-[#132e15]/15 overflow-hidden divide-y divide-[#132e15]/10 shadow-sm text-left">
                {enterprise.certifications && enterprise.certifications.length > 0 ? (
                  enterprise.certifications.map((cert: any, index: number) => (
                    <div key={index} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-[#132e15]/10 flex items-center justify-center text-[#1A3D18] shrink-0 border border-[#132e15]/15 font-black text-xs">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[#1A3D18] break-words">{cert.name}</p>
                          <p className="text-[9px] text-[#2E4D31]/60 font-bold uppercase tracking-wider mt-0.5 break-words">
                            Réf: {cert.code || 'N/A'} | Délivré par : {cert.issuer || 'N/A'} le {cert.date || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-[#132e15] text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shrink-0 self-start sm:self-center">
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

          {/* 3. Footer Banner with Fine Print */}
          <div className="p-6 bg-[#132e15] border-t border-white/5 shrink-0 text-center space-y-1.5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#ebd078]/30 to-transparent" />
            
            <p className="text-[9px] font-black tracking-widest text-[#ebd078] uppercase flex justify-center items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ebd078]" />
              Document officiel généré le {new Date().toLocaleDateString()}
              <span className="w-1.5 h-1.5 rounded-full bg-[#ebd078]" />
              CCAISM Technical Database
            </p>
            <p className="text-[8px] font-bold text-white/50 tracking-wide uppercase">
              Ce document est strictement confidentiel et destiné aux vérifications administratives des membres de la CSCM.
            </p>
          </div>
          
        </motion.div>
      </div>
    )}
  </AnimatePresence>
  </ModalPortal>
  );
};
