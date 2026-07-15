import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Shield, MapPin, Phone, Mail, Award, CheckCircle2, Star, FileText, AlertCircle } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { jsPDF } from 'jspdf';

interface EnterpriseSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  enterprise: any;
}

export const EnterpriseSummaryModal: React.FC<EnterpriseSummaryModalProps> = ({ isOpen, onClose, enterprise }) => {
  useBodyScrollLock(isOpen);

  if (!isOpen || !enterprise) return null;

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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto selection:bg-[#132e15] selection:text-[#ebd078]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#FAF9F5] w-full max-w-4xl rounded-[2rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[95vh] border-2 border-[#132e15] font-sans text-[#132e15]"
        >
          {/* 1. Header with Dark Green Top Bar */}
          <div className="p-6 bg-[#132e15] text-white flex justify-between items-center relative overflow-hidden shrink-0">
            {/* Ambient luxury light overlay */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            
            <div className="flex gap-4 items-center relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-[#0c1e0e] border-2 border-[#ebd078]/80 flex items-center justify-center font-black text-xs text-[#ebd078] overflow-hidden shadow-inner">
                {enterprise.logo ? (
                  <img src={enterprise.logo} alt={enterprise.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-center font-mono text-[10px] uppercase font-black tracking-tighter">CSCM</span>
                )}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-serif font-black text-white tracking-wide uppercase leading-none">
                  Fiche Technique
                </h1>
                <p className="text-sm font-bold text-[#ebd078] mt-1">{enterprise.name}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[9px] bg-white/10 text-[#ebd078] border border-white/15 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    Référence : {enterprise.memberNo || 'M001'}
                  </span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded tracking-wide ${
                    enterprise.statutMembre === 'Actif' ? 'bg-[#51a351] text-white' : 'bg-red-600 text-white'
                  }`}>
                    {enterprise.statutMembre || 'Actif'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-10">
              <button 
                onClick={handleDownloadPDF} 
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#ebd078]/20 transition-all flex items-center justify-center text-[#ebd078] cursor-pointer"
                title="Télécharger la fiche"
              >
                <Download className="w-5 h-5" />
              </button>
              <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 2. Scrollable Body Content */}
          <div className="p-6 md:p-8 overflow-y-auto space-y-6">
            
            {/* Section: IDENTITÉ DE L'ENTREPRISE */}
            <div className="space-y-3">
              <div className="bg-[#132e15] px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-white">
                <span className="w-5 h-5 rounded-lg bg-[#ebd078]/20 text-[#ebd078] flex items-center justify-center text-[10px] font-black tracking-tighter">ID</span>
                <h2 className="text-xs font-black uppercase tracking-wider">Identité de l'entreprise</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Raison Sociale card (soft green) */}
                <div className="bg-white border border-[#132e15]/20 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#132e15]/70">Nom de l'entreprise (Raison sociale)</span>
                  <span className="text-sm font-black text-[#132e15] mt-1.5 leading-tight">{enterprise.raisonSociale || enterprise.name}</span>
                </div>

                {/* Date d'adhésion card */}
                <div className="bg-white border border-[#132e15]/20 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#132e15]/70">Date d'adhésion</span>
                  <span className="text-sm font-black text-[#132e15] mt-1.5 leading-tight">{enterprise.dateAdhesion || 'Non spécifiée'}</span>
                </div>

                {/* Forme Juridique card (soft purple) */}
                <div className="bg-white border border-[#132e15]/20 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#132e15]/70">Forme Juridique</span>
                  <span className="text-xs font-bold text-[#132e15] mt-1.5 leading-tight">{enterprise.formeJuridique || 'Société à Responsabilité Limitée'}</span>
                </div>

                {/* Date de création card (soft yellow) */}
                <div className="bg-white border border-[#132e15]/20 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#132e15]/70">Date de création</span>
                  <span className="text-xs font-mono font-bold text-[#132e15] mt-1.5 leading-tight">{enterprise.dateCreation || 'N/A'}</span>
                </div>

                {/* RC Card (soft red/pink) */}
                <div className="bg-white border border-[#132e15]/20 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#132e15]/70">N° Registre Commerce</span>
                  <span className="text-xs font-mono font-bold text-[#132e15] mt-1.5 leading-tight">{enterprise.numRC || 'Non Spécifié'}</span>
                </div>

                {/* Ninea/ICE card (soft blue-gray) */}
                <div className="bg-white border border-[#132e15]/20 p-4 rounded-2xl flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#132e15]/70">Ninea / ICE</span>
                  <span className="text-xs font-mono font-bold text-[#132e15] mt-1.5 leading-tight">{enterprise.ninea || 'Non disponible'}</span>
                </div>
              </div>
            </div>

            {/* Split row: Coordonnées & Statut/Effectif */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Coordonnées */}
              <div className="space-y-3">
                <div className="bg-[#132e15] px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-white">
                  <MapPin className="w-4 h-4 text-[#ebd078]" />
                  <h2 className="text-xs font-black uppercase tracking-wider">Coordonnées</h2>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#132e15]/15 space-y-4 shadow-sm">
                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-[#132e15]/10 flex items-center justify-center text-[#132e15] shrink-0 border border-[#132e15]/15">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#132e15]/70 block">Adresse</span>
                      <span className="text-xs font-bold text-[#132e15]">{enterprise.ville}, {enterprise.pays}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-[#132e15]/10 flex items-center justify-center text-[#132e15] shrink-0 border border-[#132e15]/15">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#132e15]/70 block">Téléphone</span>
                      <span className="text-xs font-mono font-bold text-[#132e15]">{enterprise.telephone || 'Non disponible'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-full bg-[#132e15]/10 flex items-center justify-center text-[#132e15] shrink-0 border border-[#132e15]/15">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#132e15]/70 block">E-mail de contact</span>
                      <span className="text-xs font-mono font-bold text-[#132e15] break-all">{enterprise.email || 'Non disponible'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statut & Effectif */}
              <div className="space-y-3">
                <div className="bg-[#132e15] px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-white">
                  <Shield className="w-4 h-4 text-[#ebd078]" />
                  <h2 className="text-xs font-black uppercase tracking-wider">Statut & Effectif</h2>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#132e15]/15 flex flex-col justify-between h-[210px] shadow-sm">
                  <div className="flex justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#132e15]/10 text-[#132e15] border border-[#132e15]/20">
                      <span className="w-2 h-2 rounded-full bg-[#132e15] animate-pulse" />
                      Actif
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
              <div className="bg-[#132e15] px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-white">
                <Award className="w-4 h-4 text-[#ebd078]" />
                <h2 className="text-xs font-black uppercase tracking-wider">Activité & Expertise</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sector Card */}
                <div className="bg-white border border-[#132e15]/15 p-5 rounded-2xl shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#132e15]/70 block mb-1">Secteur d'activité</span>
                  <span className="text-sm font-black text-[#132e15] leading-tight block">{enterprise.secteur}</span>
                </div>

                {/* Tech Desc Card */}
                <div className="bg-white border border-[#132e15]/15 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#132e15]/70 block mb-1">Description Technique</span>
                  <span className="text-xs font-medium text-[#132e15] italic leading-relaxed block">
                    "{enterprise.description || "Nous faisons du conseil et accompagnement technique dans le secteur correspondant."}"
                  </span>
                </div>
              </div>
            </div>

            {/* Licences & Certificats techniques */}
            <div className="space-y-3">
              <div className="bg-[#132e15] px-4 py-2.5 rounded-xl flex items-center gap-2.5 text-white">
                <FileText className="w-4 h-4 text-[#ebd078]" />
                <h2 className="text-xs font-black uppercase tracking-wider text-left">Certificats & Documents Techniques</h2>
              </div>

              <div className="bg-white rounded-2xl border border-[#132e15]/15 overflow-hidden divide-y divide-[#132e15]/10 shadow-sm text-left">
                {enterprise.certifications && enterprise.certifications.length > 0 ? (
                  enterprise.certifications.map((cert: any, index: number) => (
                    <div key={index} className="p-4 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#132e15]/10 flex items-center justify-center text-[#132e15] shrink-0 border border-[#132e15]/15 font-black text-xs">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-[#132e15]">{cert.name}</p>
                          <p className="text-[9px] text-[#132e15]/70 font-bold uppercase tracking-wider">
                            Réf: {cert.code || 'N/A'} | Délivré par : {cert.issuer || 'N/A'} le {cert.date || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] bg-[#132e15] text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
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
    </AnimatePresence>
  );
};
