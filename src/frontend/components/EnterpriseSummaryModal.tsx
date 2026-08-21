import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Shield, MapPin, Phone, Mail, Award, CheckCircle2, Star, FileText, UserCheck, DollarSign, Layers, Globe, Building2, Briefcase } from 'lucide-react';
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

  const getFiscalId = (ent: any): string => {
    if (!ent) return '';
    const candidates = [
      ent.ninea,
      ent.ice,
      ent.ice_ninea,
      ent.identifiantFiscal,
      ent.numero_ice,
      ent.numero_ninea,
      ent.code_ice,
      ent.code_ninea
    ];
    for (const c of candidates) {
      if (c && typeof c === 'string' && c.trim() !== '' && c.trim().toUpperCase() !== 'N/A' && c.trim() !== '—' && c.trim() !== '-') {
        return c.trim();
      }
    }
    return '';
  };

  const getResponsableInfo = (ent: any) => {
    if (!ent) return { name: '', fonction: '', phone: '', email: '' };
    
    const prenom = ent.prenomContact || ent.prenom_adherent || ent.prenom_responsable || ent.prenom_dirigeant || ent.prenomRep || '';
    const nom = ent.nomContact || ent.nom_adherent || ent.nom_responsable || ent.nom_dirigeant || ent.nomRep || ent.dirigeant || ent.responsable || '';
    
    let fullName = '';
    if (prenom && nom) fullName = `${prenom} ${nom}`.trim();
    else if (nom) fullName = nom.trim();
    else if (prenom) fullName = prenom.trim();
    
    let fonction = ent.fonction || ent.fonction_adherent || ent.fonction_responsable || ent.fonctionResponsable || ent.poste || '';
    let phone = ent.mobileContact || ent.telephoneSecondaire || ent.telephone_secondaire || ent.telephone || '';
    let email = ent.emailContact || ent.email_principal || ent.email || '';

    if ((!fullName || fullName === 'Non spécifié') && ent.contacts && Array.isArray(ent.contacts) && ent.contacts.length > 0) {
      const primary = ent.contacts.find((c: any) => c.isPrimary === 'Oui') || ent.contacts[0];
      if (primary) {
        if (!fullName) fullName = primary.name || '';
        if (!fonction) fonction = primary.function || '';
        if (!phone) phone = primary.phone || '';
        if (!email) email = primary.email || '';
      }
    }

    return { name: fullName, fonction, phone, email };
  };

  const handleDownloadPDF = () => {
    if (!enterprise) return;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const fiscalId = getFiscalId(enterprise) || 'Non disponible';
    const resp = getResponsableInfo(enterprise);

    // Page 1 Border decoration
    doc.setDrawColor(19, 46, 21); // #132e15
    doc.setLineWidth(1);
    doc.rect(8, 8, 194, 281);
    doc.setDrawColor(235, 208, 120); // gold border
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277);

    // Header bar
    doc.setFillColor(19, 46, 21);
    doc.rect(12, 12, 186, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text("FICHE TECHNIQUE OFFICIELLE", 20, 26);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(235, 208, 120);
    doc.text("Chambre Sénégalaise de Commerce au Maroc (CSCM) — Base de données technique", 20, 34);

    let y = 50;

    const drawSectionHeader = (title: string, currentY: number) => {
      doc.setFillColor(240, 245, 240);
      doc.rect(14, currentY, 182, 8, 'F');
      doc.setTextColor(19, 46, 21);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(title, 18, currentY + 5.5);
      return currentY + 13;
    };

    const drawRow = (label: string, value: string, currentY: number, labelWidth = 65) => {
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(70, 70, 70);
      doc.setFontSize(9);
      doc.text(label, 18, currentY);

      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(19, 46, 21);
      const strVal = String(value || 'Non spécifié');
      const split = doc.splitTextToSize(strVal, 110);
      doc.text(split, 18 + labelWidth, currentY);
      return currentY + (split.length * 5.5);
    };

    // 1. Identité de l'entreprise
    y = drawSectionHeader("1. IDENTITÉ DE L'ENTREPRISE & ENREGISTREMENT", y);
    y = drawRow("Raison sociale :", enterprise.raisonSociale || enterprise.name, y);
    if (enterprise.nomCommercial && enterprise.nomCommercial !== enterprise.raisonSociale) {
      y = drawRow("Nom commercial :", enterprise.nomCommercial, y);
    }
    y = drawRow("N° Membre CSCM :", enterprise.memberNo || 'M001', y);
    y = drawRow("Statut Adhésion :", enterprise.statutMembre || enterprise.statut_adhesion || 'Actif', y);
    y = drawRow("Type de membre :", enterprise.typeMembre || enterprise.type_membre || 'Adhérent', y);
    y = drawRow("Forme Juridique :", enterprise.formeJuridique || enterprise.forme_juridique || 'SARL', y);
    y = drawRow("Date d'adhésion :", enterprise.dateAdhesion || 'N/A', y);
    y = drawRow("Date de création :", enterprise.dateCreation || 'N/A', y);
    y = drawRow("N° Registre Commerce :", enterprise.numRC || 'Non spécifié', y);
    y = drawRow("ICE / NINEA :", fiscalId, y);
    y = drawRow("Effectif :", `${enterprise.effectif || 'N/A'} personnes`, y);

    // 2. Dirigeant & Responsable
    y += 2;
    y = drawSectionHeader("2. DIRIGEANT & RESPONSABLE LÉGAL", y);
    y = drawRow("Nom complet :", resp.name || 'Non spécifié', y);
    y = drawRow("Fonction :", resp.fonction || 'Dirigeant / Représentant', y);
    y = drawRow("Téléphone direct :", resp.phone || enterprise.telephone || 'Non spécifié', y);
    y = drawRow("Email direct :", resp.email || enterprise.email || 'Non spécifié', y);

    // 3. Coordonnées & Siège
    y += 2;
    y = drawSectionHeader("3. COORDONNÉES & SIÈGE SOCIAL", y);
    y = drawRow("Localisation :", `${enterprise.ville || 'Dakar'}, ${enterprise.pays || 'Sénégal'}`, y);
    y = drawRow("Adresse complète :", enterprise.adresse || enterprise.adresse_complete || 'N/A', y);
    if (enterprise.codePostal || enterprise.code_postal) {
      y = drawRow("Code Postal :", enterprise.codePostal || enterprise.code_postal, y);
    }
    y = drawRow("Téléphone principal :", enterprise.telephone || 'Non disponible', y);
    if (enterprise.telephoneSecondaire || enterprise.telephone_secondaire) {
      y = drawRow("Téléphone secondaire :", enterprise.telephoneSecondaire || enterprise.telephone_secondaire, y);
    }
    y = drawRow("Email de contact :", enterprise.email || 'Non disponible', y);
    if (enterprise.siteWeb || enterprise.site_web) {
      y = drawRow("Site web :", enterprise.siteWeb || enterprise.site_web, y);
    }

    // 4. Métiers & Activité
    y += 2;
    y = drawSectionHeader("4. MÉTiers, EXPERTISES & CAPACITÉS", y);
    y = drawRow("Secteur d'activité :", enterprise.secteur || 'Non disponible', y);
    y = drawRow("Description d'activité :", enterprise.description || enterprise.description_activite || 'Conseil et accompagnement', y, 45);
    
    const prod = enterprise.produitsServices || enterprise.produits_services;
    if (prod) y = drawRow("Produits / Services :", prod, y, 45);

    const tech = enterprise.technologies || enterprise.technologies_utilisees;
    if (tech) y = drawRow("Technologies :", tech, y, 45);

    const marches = enterprise.marchesCibles || enterprise.marches_cibles;
    if (marches) y = drawRow("Marchés cibles :", marches, y, 45);

    const clients = enterprise.clientsReferences || enterprise.clients_references;
    if (clients) y = drawRow("Clients références :", clients, y, 45);

    const niv = enterprise.niveauExpertise || enterprise.niveau_expertise;
    if (niv) y = drawRow("Niveau d'expertise :", niv, y, 45);

    const cap = enterprise.capaciteProduction || enterprise.capacite_production;
    if (cap) y = drawRow("Capacité production :", cap, y, 45);

    // If we have Financials or Certifications, add Page 2
    const hasFinancials = enterprise.chiffre_affaires_2023 || enterprise.chiffre_affaires_2024 || (enterprise.financialData && enterprise.financialData.length > 0);
    const hasCerts = enterprise.certifications && enterprise.certifications.length > 0;
    const hasCotisations = enterprise.cotisation_2023 || enterprise.cotisation_2024 || enterprise.cotisation_2025;

    if (hasFinancials || hasCerts || hasCotisations) {
      doc.addPage();
      
      // Page 2 borders
      doc.setDrawColor(19, 46, 21);
      doc.setLineWidth(1);
      doc.rect(8, 8, 194, 281);
      doc.setDrawColor(235, 208, 120);
      doc.setLineWidth(0.5);
      doc.rect(10, 10, 190, 277);

      // Mini header Page 2
      doc.setFillColor(19, 46, 21);
      doc.rect(12, 12, 186, 16, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`FICHE TECHNIQUE — ${enterprise.raisonSociale || enterprise.name} (Suite)`, 20, 22);

      let y2 = 36;

      // 5. Données Financières
      if (hasFinancials) {
        y2 = drawSectionHeader("5. INDICATEURS FINANCIERS & EXERCICES", y2);
        if (enterprise.chiffre_affaires_2024) {
          y2 = drawRow("CA 2024 :", `${Number(enterprise.chiffre_affaires_2024).toLocaleString('fr-FR')} FCFA`, y2);
          if (enterprise.ca_senegal_2024) y2 = drawRow("CA Sénégal 2024 :", `${Number(enterprise.ca_senegal_2024).toLocaleString('fr-FR')} FCFA`, y2);
          if (enterprise.resultat_net_2024) y2 = drawRow("Résultat Net 2024 :", `${Number(enterprise.resultat_net_2024).toLocaleString('fr-FR')} FCFA`, y2);
          if (enterprise.total_actif_2024) y2 = drawRow("Total Actif 2024 :", `${Number(enterprise.total_actif_2024).toLocaleString('fr-FR')} FCFA`, y2);
        }
        if (enterprise.chiffre_affaires_2023) {
          y2 = drawRow("CA 2023 :", `${Number(enterprise.chiffre_affaires_2023).toLocaleString('fr-FR')} FCFA`, y2);
          if (enterprise.resultat_net_2023) y2 = drawRow("Résultat Net 2023 :", `${Number(enterprise.resultat_net_2023).toLocaleString('fr-FR')} FCFA`, y2);
        }
      }

      // 6. Cotisations
      if (hasCotisations) {
        y2 += 2;
        y2 = drawSectionHeader("6. COTISATIONS ANNUELLES", y2);
        if (enterprise.cotisation_2025) y2 = drawRow("Cotisation 2025 :", `${Number(enterprise.cotisation_2025).toLocaleString('fr-FR')} FCFA`, y2);
        if (enterprise.cotisation_2024) y2 = drawRow("Cotisation 2024 :", `${Number(enterprise.cotisation_2024).toLocaleString('fr-FR')} FCFA`, y2);
        if (enterprise.cotisation_2023) y2 = drawRow("Cotisation 2023 :", `${Number(enterprise.cotisation_2023).toLocaleString('fr-FR')} FCFA`, y2);
      }

      // 7. Certifications
      if (hasCerts) {
        y2 += 2;
        y2 = drawSectionHeader("7. CERTIFICATIONS & AGRÉMENTS TECHNIQUES", y2);
        enterprise.certifications.forEach((c: any, idx: number) => {
          y2 = drawRow(`${idx + 1}. ${c.name} :`, `Réf: ${c.code || 'N/A'} | Émis par ${c.issuer || 'N/A'} le ${c.date || 'N/A'}`, y2, 45);
        });
      }

      // Footer
      doc.setTextColor(120, 120, 120);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text("Document officiel généré depuis la base de données administrative de la Chambre Sénégalaise de Commerce au Maroc.", 15, 275);
      doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 15, 280);
    } else {
      // Footer on page 1
      doc.setTextColor(120, 120, 120);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text("Document officiel généré depuis la base de données administrative de la Chambre Sénégalaise de Commerce au Maroc.", 15, 275);
      doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 15, 280);
    }

    doc.save(`Fiche_Technique_${(enterprise.raisonSociale || enterprise.name).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
  };

  if (!enterprise) return null;

  const fiscalVal = getFiscalId(enterprise);
  const respVal = getResponsableInfo(enterprise);
  const customAttrs = enterprise.custom_attributes || {};
  const standardKeys = new Set([
    'id', 'name', 'memberNo', 'statutMembre', 'dateAdhesion', 'raisonSociale', 'pays', 'ville',
    'secteur', 'effectif', 'formeJuridique', 'numRC', 'ninea', 'ice', 'dateCreation', 'adresse',
    'telephone', 'email', 'siteWeb', 'description', 'logo', 'cotisations', 'financialData',
    'besoins', 'contacts', 'certifications', 'custom_attributes', 'raw_excel_data'
  ]);

  const extraEntries = Object.entries(customAttrs).filter(([k, v]) => {
    const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    return v && String(v).trim() !== '';
  });

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
              className="modal-shell max-w-5xl bg-white font-sans text-[#1A3D18]"
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-[#2E4D31] via-[#355a38] to-[#1A3D18] text-white flex justify-between items-start gap-4 relative overflow-hidden shrink-0 border-b border-white/10">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none blur-2xl" />
                
                <div className="flex gap-4 items-center relative z-10 min-w-0 flex-1">
                  <div className="w-16 h-16 rounded-2xl bg-white border-2 border-cscm-gold/50 flex items-center justify-center font-black text-xs text-[#2E4D31] overflow-hidden shadow-lg shrink-0">
                    {enterprise.logo ? (
                      <img src={enterprise.logo} alt={enterprise.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-center font-mono text-[10px] uppercase font-black tracking-tighter">CSCM</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cscm-gold/90">Fiche technique officielle</p>
                    <h1 className="text-xl md:text-2xl font-serif font-black text-white tracking-tight leading-tight mt-0.5">
                      {enterprise.raisonSociale || enterprise.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[9px] bg-white/15 text-white border border-white/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Réf. {enterprise.memberNo || 'M001'}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wide ${
                        enterprise.statutMembre === 'Actif' || enterprise.statut_adhesion === 'Actif' 
                          ? 'bg-emerald-400/25 text-emerald-100 border border-emerald-300/30' 
                          : 'bg-rose-500/30 text-rose-100 border border-rose-300/30'
                      }`}>
                        {enterprise.statutMembre || enterprise.statut_adhesion || 'Actif'}
                      </span>
                      {fiscalVal && (
                        <span className="text-[9px] font-mono font-bold bg-amber-400/20 text-amber-200 border border-amber-300/30 px-2.5 py-0.5 rounded-full">
                          ICE/NINEA : {fiscalVal}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 relative z-10 shrink-0">
                  <button 
                    onClick={handleDownloadPDF} 
                    className="h-10 px-4 rounded-xl bg-cscm-gold hover:bg-[#d9b85c] transition-all flex items-center gap-2 text-[#132e15] font-black text-xs cursor-pointer shrink-0 shadow-md active:scale-95"
                    title="Télécharger la fiche technique complète en PDF"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Télécharger PDF</span>
                  </button>
                  <button 
                    onClick={onClose} 
                    className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 transition-all flex items-center justify-center text-white cursor-pointer shrink-0 border border-white/20"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="p-6 md:p-8 overflow-y-auto space-y-6 max-h-[75vh] bg-[#FAF9F5]">
                
                {/* 1. IDENTITÉ & ENREGISTREMENT */}
                <div className="space-y-3">
                  <div className="bg-[#2E4D31] px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-white shadow-sm">
                    <Building2 className="w-4 h-4 text-cscm-gold" />
                    <h2 className="text-xs font-black uppercase tracking-wider">1. Identité légale & Enregistrement</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-[#132e15]/10 shadow-xs">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Raison sociale</span>
                      <span className="text-sm font-black text-[#1A3D18] mt-1 block leading-tight">{enterprise.raisonSociale || enterprise.name}</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#132e15]/10 shadow-xs">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Nom commercial</span>
                      <span className="text-sm font-bold text-[#1A3D18] mt-1 block leading-tight">{enterprise.nomCommercial || enterprise.nom_commercial || enterprise.name}</span>
                    </div>

                    <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 shadow-xs">
                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-900/70 block">ICE / NINEA</span>
                      <span className="text-xs font-mono font-black text-amber-900 mt-1 block leading-tight">{fiscalVal || 'Non disponible'}</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#132e15]/10 shadow-xs">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">N° Registre Commerce</span>
                      <span className="text-xs font-mono font-bold text-[#1A3D18] mt-1 block leading-tight">{enterprise.numRC || enterprise.numero_rc || 'Non spécifié'}</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#132e15]/10 shadow-xs">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Forme Juridique</span>
                      <span className="text-xs font-bold text-[#1A3D18] mt-1 block leading-tight">{enterprise.formeJuridique || enterprise.forme_juridique || 'SARL'}</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#132e15]/10 shadow-xs">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Type de membre</span>
                      <span className="text-xs font-bold text-[#1A3D18] mt-1 block leading-tight">{enterprise.typeMembre || enterprise.type_membre || 'Adhérent'}</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#132e15]/10 shadow-xs">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Date d'adhésion</span>
                      <span className="text-xs font-mono font-bold text-[#1A3D18] mt-1 block leading-tight">{enterprise.dateAdhesion || enterprise.date_adhesion || 'Non spécifiée'}</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#132e15]/10 shadow-xs">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Date de création</span>
                      <span className="text-xs font-mono font-bold text-[#1A3D18] mt-1 block leading-tight">{enterprise.dateCreation || enterprise.date_creation || 'N/A'}</span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-[#132e15]/10 shadow-xs">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Effectif</span>
                      <span className="text-xs font-black text-[#1A3D18] mt-1 block leading-tight">{enterprise.effectif || 'N/A'} personnes</span>
                    </div>
                  </div>
                </div>

                {/* 2. DIRIGEANT & RESPONSABLE */}
                <div className="space-y-3">
                  <div className="bg-[#2E4D31] px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-white shadow-sm">
                    <UserCheck className="w-4 h-4 text-cscm-gold" />
                    <h2 className="text-xs font-black uppercase tracking-wider">2. Dirigeant & Responsable Légal</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white p-5 rounded-2xl border border-[#132e15]/10 shadow-xs">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Nom & Prénom</span>
                      <span className="text-sm font-black text-[#1A3D18] mt-1 block">{respVal.name || 'Non spécifié'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Fonction / Titre</span>
                      <span className="text-xs font-bold text-[#1A3D18] mt-1 block">{respVal.fonction || 'Dirigeant / Représentant'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Téléphone direct</span>
                      <span className="text-xs font-mono font-bold text-[#1A3D18] mt-1 block">{respVal.phone || enterprise.telephone || 'Non renseigné'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Email direct</span>
                      <span className="text-xs font-mono font-bold text-[#1A3D18] mt-1 block break-all">{respVal.email || enterprise.email || 'Non renseigné'}</span>
                    </div>
                  </div>
                </div>

                {/* 3. COORDONNÉES & SIÈGE */}
                <div className="space-y-3">
                  <div className="bg-[#2E4D31] px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-white shadow-sm">
                    <MapPin className="w-4 h-4 text-cscm-gold" />
                    <h2 className="text-xs font-black uppercase tracking-wider">3. Coordonnées & Siège Social</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-5 rounded-2xl border border-[#132e15]/10 shadow-xs">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Localisation & Pays</span>
                      <span className="text-xs font-bold text-[#1A3D18] mt-1 block">{enterprise.ville || 'Dakar'}, {enterprise.pays || 'Sénégal'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Adresse complète</span>
                      <span className="text-xs font-medium text-[#1A3D18] mt-1 block">{enterprise.adresse || enterprise.adresse_complete || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Code Postal</span>
                      <span className="text-xs font-mono font-bold text-[#1A3D18] mt-1 block">{enterprise.codePostal || enterprise.code_postal || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Téléphone Principal</span>
                      <span className="text-xs font-mono font-bold text-[#1A3D18] mt-1 block">{enterprise.telephone || enterprise.telephone_principale || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Téléphone Secondaire</span>
                      <span className="text-xs font-mono font-bold text-[#1A3D18] mt-1 block">{enterprise.telephoneSecondaire || enterprise.telephone_secondaire || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Site Web Officiel</span>
                      <span className="text-xs font-mono font-bold text-emerald-800 mt-1 block break-all">{enterprise.siteWeb || enterprise.site_web || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* 4. MÉTiers & CAPACITÉS */}
                <div className="space-y-3">
                  <div className="bg-[#2E4D31] px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-white shadow-sm">
                    <Briefcase className="w-4 h-4 text-cscm-gold" />
                    <h2 className="text-xs font-black uppercase tracking-wider">4. Métiers, Expertises & Capacités de Production</h2>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-[#132e15]/10 shadow-xs space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Secteur d'activité</span>
                        <span className="text-sm font-black text-[#1A3D18] mt-0.5 block">{enterprise.secteur || 'Non renseigné'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Niveau d'expertise</span>
                        <span className="text-xs font-bold text-[#1A3D18] mt-0.5 block">{enterprise.niveauExpertise || enterprise.niveau_expertise || 'Standard'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Description technique de l'activité</span>
                      <p className="text-xs text-gray-700 font-medium leading-relaxed mt-1 italic">
                        "{enterprise.description || enterprise.description_activite || 'Conseil et accompagnement technique dans le secteur.'}"
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Produits / Services</span>
                        <span className="text-xs font-medium text-[#1A3D18] mt-0.5 block">{enterprise.produitsServices || enterprise.produits_services || 'Non spécifié'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Technologies utilisées</span>
                        <span className="text-xs font-medium text-[#1A3D18] mt-0.5 block">{enterprise.technologies || enterprise.technologies_utilisees || 'Non spécifié'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Marchés cibles</span>
                        <span className="text-xs font-medium text-[#1A3D18] mt-0.5 block">{enterprise.marchesCibles || enterprise.marches_cibles || 'Non spécifié'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-wider text-[#2E4D31]/60 block">Clients de référence</span>
                        <span className="text-xs font-medium text-[#1A3D18] mt-0.5 block">{enterprise.clientsReferences || enterprise.clients_references || 'Non spécifié'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. DONNÉES FINANCIÈRES */}
                {(enterprise.chiffre_affaires_2023 || enterprise.chiffre_affaires_2024 || (enterprise.financialData && enterprise.financialData.length > 0)) && (
                  <div className="space-y-3">
                    <div className="bg-[#2E4D31] px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-white shadow-sm">
                      <DollarSign className="w-4 h-4 text-cscm-gold" />
                      <h2 className="text-xs font-black uppercase tracking-wider">5. Données Financières & Exercices Fiscaux</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {enterprise.chiffre_affaires_2024 && (
                        <div className="bg-white p-5 rounded-2xl border border-[#132e15]/10 shadow-xs space-y-2">
                          <h4 className="font-serif font-black text-sm text-[#132e15] border-b pb-2">Exercice fiscal 2024</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[9px] font-bold text-gray-400 uppercase block">CA Global</span>
                              <span className="font-black text-blue-900">{Number(enterprise.chiffre_affaires_2024).toLocaleString('fr-FR')} FCFA</span>
                            </div>
                            {enterprise.ca_senegal_2024 && (
                              <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase block">CA Sénégal</span>
                                <span className="font-black text-emerald-900">{Number(enterprise.ca_senegal_2024).toLocaleString('fr-FR')} FCFA</span>
                              </div>
                            )}
                            {enterprise.resultat_net_2024 && (
                              <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase block">Résultat Net</span>
                                <span className="font-black text-teal-900">{Number(enterprise.resultat_net_2024).toLocaleString('fr-FR')} FCFA</span>
                              </div>
                            )}
                            {enterprise.total_actif_2024 && (
                              <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase block">Total Actif</span>
                                <span className="font-bold text-slate-800">{Number(enterprise.total_actif_2024).toLocaleString('fr-FR')} FCFA</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {enterprise.chiffre_affaires_2023 && (
                        <div className="bg-white p-5 rounded-2xl border border-[#132e15]/10 shadow-xs space-y-2">
                          <h4 className="font-serif font-black text-sm text-[#132e15] border-b pb-2">Exercice fiscal 2023</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[9px] font-bold text-gray-400 uppercase block">CA Global</span>
                              <span className="font-black text-blue-900">{Number(enterprise.chiffre_affaires_2023).toLocaleString('fr-FR')} FCFA</span>
                            </div>
                            {enterprise.resultat_net_2023 && (
                              <div>
                                <span className="text-[9px] font-bold text-gray-400 uppercase block">Résultat Net</span>
                                <span className="font-black text-teal-900">{Number(enterprise.resultat_net_2023).toLocaleString('fr-FR')} FCFA</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. COTISATIONS ANNUELLES */}
                {(enterprise.cotisation_2023 || enterprise.cotisation_2024 || enterprise.cotisation_2025 || (enterprise.cotisations && enterprise.cotisations.length > 0)) && (
                  <div className="space-y-3">
                    <div className="bg-[#2E4D31] px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-white shadow-sm">
                      <Star className="w-4 h-4 text-cscm-gold" />
                      <h2 className="text-xs font-black uppercase tracking-wider">6. Historique des Cotisations Annuelles</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-5 rounded-2xl border border-[#132e15]/10 shadow-xs">
                      {enterprise.cotisation_2023 && (
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <span className="text-[9px] font-black uppercase text-gray-400 block">Cotisation 2023</span>
                          <span className="text-xs font-mono font-bold text-[#132e15] mt-1 block">{Number(enterprise.cotisation_2023).toLocaleString('fr-FR')} FCFA</span>
                        </div>
                      )}
                      {enterprise.cotisation_2024 && (
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <span className="text-[9px] font-black uppercase text-gray-400 block">Cotisation 2024</span>
                          <span className="text-xs font-mono font-bold text-[#132e15] mt-1 block">{Number(enterprise.cotisation_2024).toLocaleString('fr-FR')} FCFA</span>
                        </div>
                      )}
                      {enterprise.cotisation_2025 && (
                        <div className="p-3 bg-gray-50 rounded-xl">
                          <span className="text-[9px] font-black uppercase text-gray-400 block">Cotisation 2025</span>
                          <span className="text-xs font-mono font-bold text-[#132e15] mt-1 block">{Number(enterprise.cotisation_2025).toLocaleString('fr-FR')} FCFA</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 7. CERTIFICATIONS */}
                <div className="space-y-3">
                  <div className="bg-[#2E4D31] px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-white shadow-sm">
                    <FileText className="w-4 h-4 text-cscm-gold" />
                    <h2 className="text-xs font-black uppercase tracking-wider">7. Certificats & Agréments Techniques</h2>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#132e15]/10 overflow-hidden divide-y divide-gray-100 shadow-xs">
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
                        Aucun certificat ou agrément technique particulier renseigné.
                      </div>
                    )}
                  </div>
                </div>

                {/* 8. COLONNES & ATTRIBUTS EXCEL ADDITIONNELS */}
                {extraEntries.length > 0 && (
                  <div className="space-y-3">
                    <div className="bg-[#2E4D31] px-4 py-2.5 rounded-2xl flex items-center gap-2.5 text-white shadow-sm">
                      <Layers className="w-4 h-4 text-cscm-gold" />
                      <h2 className="text-xs font-black uppercase tracking-wider">8. Données Additionnelles Importées du Fichier Excel</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white p-5 rounded-2xl border border-[#132e15]/10 shadow-xs">
                      {extraEntries.map(([k, v], idx) => (
                        <div key={idx} className="p-3 bg-gray-50/80 rounded-xl border border-gray-100">
                          <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 block truncate" title={k}>
                            {k.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs font-bold text-[#132e15] mt-1 block break-words">
                            {String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Footer */}
              <div className="p-4 bg-[#132e15] border-t border-white/5 shrink-0 text-center space-y-1 relative">
                <p className="text-[9px] font-black tracking-widest text-[#ebd078] uppercase flex justify-center items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ebd078]" />
                  Fiche Technique Officielle — Chambre Sénégalaise de Commerce au Maroc
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ebd078]" />
                </p>
                <p className="text-[8px] font-bold text-white/50 tracking-wide uppercase">
                  Toutes les informations enregistrées et importées sont certifiées conformes au registre de la CSCM.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
};
