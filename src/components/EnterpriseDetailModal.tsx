import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, Pencil, Plus, Eye, Download } from 'lucide-react';
import { EditFormModal } from './EditFormModal';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface EnterpriseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  enterprise: any;
  onUpdate?: (updatedEnterprise: any) => void;
}

export const EnterpriseDetailModal: React.FC<EnterpriseDetailModalProps> = ({ isOpen, onClose, enterprise, onUpdate }) => {
  useBodyScrollLock(isOpen);

  const [activeTab, setActiveTab] = useState('Informations générales');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editType, setEditType] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'add' | 'edit'>('edit');
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<'FCFA' | 'EUR' | 'MAD' | 'AED' | 'GBP' | 'QAR'>('FCFA');

  if (!isOpen) return null;

  const getPaymentsList = (ent: any) => {
    const payments: any[] = [];
    
    if (ent.cotisation_2023 && Number(ent.cotisation_2023) > 0) {
      payments.push({
        id: '2023',
        label: 'Cotisation Annuelle 2023',
        amount: Number(ent.cotisation_2023),
        date: '2023-12-15',
        reference: 'COT-2023-REP',
        method: 'Virement bancaire'
      });
    }
    if (ent.cotisation_2024 && Number(ent.cotisation_2024) > 0) {
      payments.push({
        id: '2024',
        label: 'Cotisation Annuelle 2024',
        amount: Number(ent.cotisation_2024),
        date: '2024-12-15',
        reference: 'COT-2024-REP',
        method: 'Virement bancaire'
      });
    }
    if (ent.cotisation_2025 && Number(ent.cotisation_2025) > 0) {
      payments.push({
        id: '2025',
        label: 'Cotisation Annuelle 2025',
        amount: Number(ent.cotisation_2025),
        date: '2025-06-10',
        reference: 'COT-2025-REP',
        method: 'Virement bancaire'
      });
    }
    
    if (ent.cotisations && Array.isArray(ent.cotisations)) {
      ent.cotisations.forEach((cot: any, index: number) => {
        payments.push({
          id: `custom-${index}`,
          label: cot.label || `Cotisation Annuelle`,
          amount: Number(cot.amount) || 10000,
          date: cot.date || new Date().toISOString().split('T')[0],
          reference: cot.reference || `REF-${Math.floor(Math.random() * 900000 + 100000)}`,
          method: 'Virement bancaire'
        });
      });
    }
    
    return payments;
  };

  const downloadReceiptFile = (ent: any, payment: any, currency: 'FCFA' | 'EUR' | 'MAD' | 'AED' | 'GBP' | 'QAR') => {
    const rawAmount = Number(payment.amount);
    let amountStr = '';
    
    switch (currency) {
      case 'EUR':
        amountStr = `${(rawAmount / 655.957).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`;
        break;
      case 'MAD':
        amountStr = `${(rawAmount * 0.0165).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
        break;
      case 'AED':
        amountStr = `${(rawAmount * 0.00603).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED`;
        break;
      case 'GBP':
        amountStr = `${(rawAmount * 0.00129).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} GBP`;
        break;
      case 'QAR':
        amountStr = `${(rawAmount * 0.00597).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} QAR`;
        break;
      default:
        amountStr = `${rawAmount.toLocaleString('fr-FR')} FCFA`;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Reçu de paiement - ${ent.name}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 40px;
      background-color: #FAF9F5;
      color: #132E15;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .receipt-card {
      background: #FFFFFF;
      border: 2px solid #EBD078;
      border-radius: 24px;
      padding: 40px;
      width: 100%;
      max-width: 600px;
      box-shadow: 0 10px 30px rgba(18, 33, 14, 0.05);
      box-sizing: border-box;
    }
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #F3F4F6;
      padding-bottom: 24px;
      margin-bottom: 24px;
    }
    .header-left h1 {
      font-size: 20px;
      font-weight: 800;
      color: #132E15;
      margin: 0 0 4px 0;
      letter-spacing: -0.5px;
    }
    .header-left p {
      font-size: 11px;
      font-weight: 500;
      color: #707070;
      margin: 0;
    }
    .header-right {
      text-align: right;
    }
    .header-right .label {
      font-size: 9px;
      font-weight: 850;
      letter-spacing: 1px;
      color: #707070;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .header-right .value {
      font-size: 15px;
      font-weight: 800;
      color: #132E15;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 30px;
    }
    .info-box {
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 16px;
      padding: 16px;
      text-align: left;
    }
    .info-box .box-label {
      font-size: 9px;
      font-weight: 800;
      color: #9CA3AF;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .info-box .box-value {
      font-size: 13px;
      font-weight: 700;
      color: #132E15;
      margin: 0;
      word-break: break-all;
    }
    .amount-pill {
      background-color: #EDFCF4;
      border-radius: 100px;
      padding: 20px;
      text-align: center;
      margin-bottom: 30px;
    }
    .amount-pill span {
      font-size: 24px;
      font-weight: 900;
      color: #132E15;
    }
    .footer-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 40px;
    }
    .footer-left {
      font-size: 10px;
      color: #808080;
      max-width: 250px;
      text-align: left;
      line-height: 1.4;
    }
    .footer-right {
      text-align: center;
      min-width: 150px;
    }
    .footer-right .sig-line {
      border-top: 1px solid #132E15;
      margin-bottom: 6px;
    }
    .footer-right span {
      font-size: 10px;
      font-weight: bold;
      color: #707070;
    }
    .no-print {
      margin-top: 30px;
      text-align: center;
    }
    .btn-print {
      background: #132E15;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(18, 33, 14, 0.15);
      transition: all 0.2s ease;
    }
    .btn-print:hover {
      background: #1f4222;
    }
    @media print {
      body {
        padding: 0;
        background-color: white;
      }
      .receipt-card {
        border: none;
        box-shadow: none;
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div style="display: flex; flex-direction: column; align-items: center;">
    <div class="receipt-card">
      <div class="header-section">
        <div class="header-left">
          <h1>Reçu de paiement</h1>
          <p>Chambre de Commerce, d'Industrie et de Services</p>
        </div>
        <div class="header-right">
          <div class="label">Numéro de reçu</div>
          <div class="value">REC-${ent.memberNo || 'MEM'}-${payment.reference || payment.id}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-box">
          <div class="box-label">Entreprise</div>
          <div class="box-value">${ent.name}</div>
        </div>
        <div class="info-box">
          <div class="box-label">Numéro membre</div>
          <div class="box-value">${ent.memberNo || '-'}</div>
        </div>
        <div class="info-box">
          <div class="box-label">Date paiement</div>
          <div class="box-value">${payment.date}</div>
        </div>
        <div class="info-box">
          <div class="box-label">Libellé</div>
          <div class="box-value">${payment.label || 'Cotisation'}</div>
        </div>
      </div>

      <div class="amount-pill">
        <span>${amountStr}</span>
      </div>

      <div class="footer-section">
        <div class="footer-left">
          Reçu généré automatiquement depuis la plateforme CCAISM.
        </div>
        <div class="footer-right">
          <div class="sig-line"></div>
          <span>Signature / Cachet</span>
        </div>
      </div>
    </div>

    <div class="no-print">
      <button class="btn-print" onclick="window.print()">Imprimer / Enregistrer en PDF</button>
    </div>
  </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Recu_${ent.name.replace(/[^a-zA-Z0-9]/g, '_')}_${payment.reference || payment.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    'Informations générales',
    'Métiers & expertises',
    'Certifications',
    'Données financières',
    'Besoins',
    'Contacts',
    'Cotisations'
  ];

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const calculateTotalTreasury = () => {
    const baseSum = (enterprise.cotisations || []).reduce((sum: number, cot: any) => sum + (Number(cot.amount) || 0), 0);
    const yearsSum = (Number(enterprise.cotisation_2023) || 0) + (Number(enterprise.cotisation_2024) || 0) + (Number(enterprise.cotisation_2025) || 0);
    return baseSum + yearsSum;
  };

  const formatAmount = (amountFCFA: number, currency: string) => {
    switch (currency) {
      case 'EUR':
        return `${(amountFCFA / 655.957).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
      case 'MAD':
        return `${(amountFCFA * 0.0165).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`;
      case 'AED':
        return `${(amountFCFA * 0.00603).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AED`;
      case 'GBP':
        return `${(amountFCFA * 0.00129).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} £`;
      case 'QAR':
        return `${(amountFCFA * 0.00597).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} QAR`;
      default:
        return `${amountFCFA.toLocaleString('fr-FR')} FCFA`;
    }
  };

  const handleEdit = (type: string, mode: 'add' | 'edit' = 'edit', index: number | null = null) => {
    if (mode === 'edit' && index === null && ['Certifications', 'Données financières', 'Besoins', 'Contacts', 'Cotisations'].includes(type)) {
      showFeedback('error', 'Veuillez d\'abord sélectionner une ligne à modifier.');
      return;
    }
    setEditType(type);
    setEditMode(mode);
    setSelectedItemIndex(index);
    setIsEditModalOpen(true);
  };

  const handleSave = (data: any) => {
    if (onUpdate) {
      let updatedEnterprise;
      if (editType === 'Cotisations') {
        const newCotisations = [...(enterprise.cotisations || [])];
        if (editMode === 'add') {
          newCotisations.push(data);
        } else if (selectedItemIndex !== null) {
          newCotisations[selectedItemIndex] = data;
        }
        updatedEnterprise = { ...enterprise, cotisations: newCotisations };
      } else if (editType === 'Besoins') {
        const newBesoins = [...(enterprise.besoins || [])];
        if (editMode === 'add') {
          newBesoins.push(data);
        } else if (selectedItemIndex !== null) {
          newBesoins[selectedItemIndex] = data;
        }
        updatedEnterprise = { ...enterprise, besoins: newBesoins };
      } else if (editType === 'Certifications') {
        const newCerts = [...(enterprise.certifications || [])];
        if (editMode === 'add') {
          newCerts.push(data);
        } else if (selectedItemIndex !== null) {
          newCerts[selectedItemIndex] = data;
        }
        updatedEnterprise = { ...enterprise, certifications: newCerts };
      } else if (editType === 'Données financières') {
        const newFinancials = [...(enterprise.financialData || [])];
        if (editMode === 'add') {
          newFinancials.push(data);
        } else if (selectedItemIndex !== null) {
          newFinancials[selectedItemIndex] = data;
        }
        updatedEnterprise = { ...enterprise, financialData: newFinancials };
      } else if (editType === 'Contacts') {
        const newContacts = [...(enterprise.contacts || [])];
        if (editMode === 'add') {
          newContacts.push(data);
        } else if (selectedItemIndex !== null) {
          newContacts[selectedItemIndex] = data;
        }
        updatedEnterprise = { ...enterprise, contacts: newContacts };
      } else {
        updatedEnterprise = { ...enterprise, ...data };
      }
      onUpdate(updatedEnterprise);
    }
    showFeedback('success', `Les modifications pour "${editType}" ont été enregistrées avec succès.`);
    setIsEditModalOpen(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Informations générales':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-8 max-w-2xl mx-auto">
              <h3 className="text-3xl font-serif font-black text-[#132e15]">Informations générales</h3>
              <button 
                onClick={() => handleEdit('Informations générales')}
                className="bg-[#132e15] text-[#ebd078] px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold border border-[#ebd078]/40 hover:bg-[#132e15]/95 transition-colors cursor-pointer"
              >
                <Pencil className="w-4 h-4" /> Modifier
              </button>
            </div>
            <div className="bg-white p-8 rounded-2xl border-2 border-[#132e15]/20 max-w-2xl mx-auto space-y-4 shadow-sm text-[#132e15]">
              {[
                { label: "Date d'adhésion", value: enterprise.dateAdhesion || '' },
                { label: "Statut membre", value: enterprise.statutMembre || '' },
                { label: "Raison sociale", value: enterprise.raisonSociale || '' },
                { label: "Forme Juridique", value: enterprise.formeJuridique || '' },
                { label: "Numéro RC", value: enterprise.numRC || '' },
                { label: "NINEA / ICE", value: enterprise.ninea || '' },
                { label: "Date création", value: enterprise.dateCreation || '' },
                { label: "Adresse", value: enterprise.adresse || '' },
                { label: "Téléphone", value: enterprise.telephone || '' },
                { label: "Email", value: enterprise.email || '' },
                { label: "Site web", value: enterprise.siteWeb || '' },
                { label: "Description", value: enterprise.description || '' },
                { label: "Secteur d'activité", value: enterprise.secteur || '' },
              ].map((item) => (
                <div key={item.label} className="flex gap-4 border-b border-[#132e15]/5 pb-2 last:border-b-0 last:pb-0">
                  <span className="font-extrabold text-[#132e15] min-w-[150px]">{item.label} :</span>
                  <span className="font-semibold text-[#132e15]/90">{item.value || 'Non spécifié'}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Métiers & expertises':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-8 max-w-2xl mx-auto">
              <h3 className="text-3xl font-serif font-black text-[#132e15]">Métiers & expertises</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleEdit('Métiers & expertises', 'edit')}
                  className="bg-[#132e15] text-[#ebd078] px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold border border-[#ebd078]/40 hover:bg-[#132e15]/95 transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" /> Modifier
                </button>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl border-2 border-[#132e15]/20 max-w-2xl mx-auto space-y-4 shadow-sm text-[#132e15]">
              {[
                { label: "Secteur d'activité", value: enterprise.secteur || '' },
                { label: "Expertise principale", value: enterprise.expertisePrincipale || '' },
                { label: "Produits / Services", value: enterprise.produitsServices || enterprise.produits_services || '' },
                { label: "Technologies utilisées", value: enterprise.technologies || enterprise.technologies_utilisees || '' },
                { label: "Marchés cibles", value: enterprise.marchesCibles || enterprise.marches_cibles || '' },
                { label: "Clients références", value: enterprise.clientsReferences || enterprise.clients_references || '' },
                { label: "Niveau d'expertise", value: enterprise.niveauExpertise || enterprise.niveau_expertise || '' },
                { label: "Capacité de production", value: enterprise.capaciteProduction || enterprise.capacite_production || '' },
              ].map((item) => (
                <div key={item.label} className="flex gap-4 border-b border-[#132e15]/5 pb-2 last:border-b-0 last:pb-0">
                  <span className="font-extrabold text-[#132e15] min-w-[180px]">{item.label} :</span>
                  <span className="font-semibold text-[#132e15]/90">{item.value || 'Non spécifié'}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Certifications':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-8 max-w-3xl mx-auto">
              <h3 className="text-3xl font-serif font-black text-[#132e15]">Certifications</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleEdit('Certifications', 'add')}
                  className="bg-[#132e15] text-[#ebd078] px-4 py-1.5 rounded-full flex items-center gap-3 text-sm font-bold border border-[#ebd078]/40 hover:bg-[#132e15]/95 transition-colors cursor-pointer"
                >
                  <div className="bg-[#ebd078] rounded p-0.5"><Plus className="w-3 h-3 text-[#132e15]" /></div> Ajouter une certification
                </button>
                <button 
                  onClick={() => handleEdit('Certifications', 'edit', selectedItemIndex)}
                  className="bg-[#132e15] text-[#ebd078] px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold border border-[#ebd078]/40 hover:bg-[#132e15]/95 transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" /> Modifier
                </button>
              </div>
            </div>
            <div className="overflow-hidden max-w-3xl mx-auto rounded-2xl border border-[#132e15]/20 shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#132e15] text-white text-xs font-black uppercase tracking-wider">
                    <th className="border border-[#132e15]/20 p-3 text-left">Certification (s)</th>
                    <th className="border border-[#132e15]/20 p-3 text-left">Code (s)</th>
                    <th className="border border-[#132e15]/20 p-3 text-left">Date</th>
                    <th className="border border-[#132e15]/20 p-3 text-left">Organisme</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-[#132e15] font-semibold text-xs divide-y divide-[#132e15]/10">
                  {enterprise.certifications && enterprise.certifications.length > 0 ? (
                    enterprise.certifications.map((cert: any, i: number) => (
                      <tr 
                        key={i} 
                        onClick={() => setSelectedItemIndex(i)}
                        className={`cursor-pointer transition-colors ${selectedItemIndex === i ? 'bg-[#132e15]/10 font-bold' : 'hover:bg-[#132e15]/5'}`}
                      >
                        <td className="border border-[#132e15]/15 p-3 h-10">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate max-w-[200px]">{cert.name}</span>
                            {cert.fileData && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const link = document.createElement('a');
                                  link.href = cert.fileData;
                                  link.download = cert.fileName || 'justificatif_certification';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                title="Télécharger la pièce justificative"
                                className="bg-[#132e15] hover:bg-emerald-800 text-white transition-all text-[8px] tracking-wider font-extrabold uppercase px-2 py-1 rounded-sm shrink-0 flex items-center gap-1 cursor-pointer"
                              >
                                Doc
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 3v12"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="border border-[#132e15]/15 p-3 h-10">{cert.code}</td>
                        <td className="border border-[#132e15]/15 p-3 h-10">{cert.date}</td>
                        <td className="border border-[#132e15]/15 p-3 h-10">{cert.issuer}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-[#132e15]/60 italic font-bold">
                        Aucune certification enregistrée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'Données financières': {
        // Unify pre-seeded Excel data with dynamic financial records
        const unifiedFinancials: any[] = [];
        
        if (enterprise.chiffre_affaires_2023 || enterprise.resultat_net_2023) {
          unifiedFinancials.push({
            year: '2023',
            devise: 'XOF - Franc CFA Ouest Africain',
            ca: enterprise.chiffre_affaires_2023,
            ca_senegal: enterprise.ca_senegal_2023,
            resultatNet: enterprise.resultat_net_2023,
            totalActif: enterprise.total_actif_2023,
            capitauxPropres: enterprise.capitaux_propres_2023,
            endettement: enterprise.endettement_2023,
            source: 'Import Excel',
            visibilite: 'Publique'
          });
        }
        
        if (enterprise.chiffre_affaires_2024 || enterprise.resultat_net_2024) {
          unifiedFinancials.push({
            year: '2024',
            devise: 'XOF - Franc CFA Ouest Africain',
            ca: enterprise.chiffre_affaires_2024,
            ca_senegal: enterprise.ca_senegal_2024,
            resultatNet: enterprise.resultat_net_2024,
            totalActif: enterprise.total_actif_2024,
            capitauxPropres: enterprise.capitaux_propres_2024,
            endettement: enterprise.endettement_2024,
            source: 'Import Excel',
            visibilite: 'Publique'
          });
        }

        if (enterprise.financialData && enterprise.financialData.length > 0) {
          enterprise.financialData.forEach((fd: any) => {
            const yrStr = String(fd.year);
            const idx = unifiedFinancials.findIndex(f => String(f.year) === yrStr);
            if (idx !== -1) {
              unifiedFinancials[idx] = { ...unifiedFinancials[idx], ...fd };
            } else {
              unifiedFinancials.push(fd);
            }
          });
        }

        // Sort unified records by year (descending)
        unifiedFinancials.sort((a, b) => Number(b.year) - Number(a.year));

        const renderExerciseCard = (item: any) => {
          const year = item.year;
          const fullDevise = item.devise || 'XOF - Franc CFA Ouest Africain';
          const currencySymbol = fullDevise.split(' ')[0] || 'FCFA';

          const ca = Number(item.ca) || 0;
          const caExport = Number(item.export) || 0;
          const caMaroc = Number(item.ca_maroc) || 0;
          const caSenegal = Number(item.ca_senegal) || 0;
          const resNet = Number(item.resultatNet) || Number(item.result) || 0;
          const totalActif = Number(item.totalActif) || 0;
          const capitauxPropres = Number(item.capitauxPropres) || 0;
          const endettement = Number(item.endettement) || 0;
          const source = item.source || 'Saisie Manuelle';
          const visibilite = item.visibilite || 'Publique';

          // Helper to format currency values cleanly
          const formatCustomMoney = (val: any) => {
            const num = Number(val) || 0;
            return `${num.toLocaleString('fr-FR')} ${currencySymbol}`;
          };

          // Key indicators calculations
          const rentNetVal = ca > 0 ? ((resNet / ca) * 100).toFixed(2) : '0.00';
          const roaVal = totalActif > 0 ? ((resNet / totalActif) * 100).toFixed(2) : '0.00';
          const roeVal = capitauxPropres > 0 ? ((resNet / capitauxPropres) * 100).toFixed(2) : '0.00';
          const levierVal = capitauxPropres > 0 ? (totalActif / capitauxPropres).toFixed(2) : '0.00';

          return (
            <div key={year} className="bg-white border text-left border-gray-150 rounded-3xl p-6 shadow-xs space-y-6">
              {/* Card Header */}
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div className="space-y-1">
                  <h4 className="text-xl font-serif font-black text-[#132e15]">Exercice fiscal {year}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    Visibilité : <span className={visibilite === 'Publique' ? 'text-emerald-700' : 'text-amber-700'}>{visibilite}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-[#132e15] text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {currencySymbol}
                  </span>
                  <span className="text-xs text-gray-400 font-bold italic">
                    Source: {source}
                  </span>
                </div>
              </div>

              {/* Grid data boxes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* CA */}
                <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4">
                  <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider block mb-1">CHIFFRE D'AFFAIRES</span>
                  <span className="text-base font-black text-blue-900">{formatCustomMoney(ca)}</span>
                </div>

                {/* CA SENEGAL */}
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4">
                  <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider block mb-1">CA SÉNÉGAL</span>
                  <span className="text-base font-black text-emerald-900">{formatCustomMoney(caSenegal)}</span>
                </div>

                {/* RESULTAT NET */}
                <div className="bg-teal-50/70 border border-teal-100 rounded-2xl p-4">
                  <span className="text-[10px] font-black uppercase text-teal-600 tracking-wider block mb-1">RÉSULTAT NET</span>
                  <span className="text-base font-black text-teal-900">{formatCustomMoney(resNet)}</span>
                </div>

                {/* CA ESPORT/MAROC */}
                {caExport > 0 && (
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4">
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider block mb-1">CA EXPORT</span>
                    <span className="text-base font-black text-indigo-900">{formatCustomMoney(caExport)}</span>
                  </div>
                )}

                {caMaroc > 0 && (
                  <div className="bg-violet-50/70 border border-violet-100 rounded-2xl p-4">
                    <span className="text-[10px] font-black uppercase text-violet-600 tracking-wider block mb-1">CA MAROC</span>
                    <span className="text-base font-black text-violet-900">{formatCustomMoney(caMaroc)}</span>
                  </div>
                )}

                {/* TOTAL ACTIF */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">TOTAL ACTIF</span>
                  <span className="text-base font-black text-slate-900">{formatCustomMoney(totalActif)}</span>
                </div>

                {/* CAPITAUX PROPRES */}
                <div className="bg-cyan-50/70 border border-cyan-100 rounded-2xl p-4">
                  <span className="text-[10px] font-black uppercase text-cyan-600 tracking-wider block mb-1">CAPITAUX PROPRES</span>
                  <span className="text-base font-black text-white-900 text-cyan-950">{formatCustomMoney(capitauxPropres)}</span>
                </div>

                {/* ENDETTEMENT */}
                <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4">
                  <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider block mb-1">ENDETTEMENT</span>
                  <span className="text-base font-black text-rose-900">{formatCustomMoney(endettement)}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100/80 my-5" />

              {/* Key Indicators */}
              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block">Indicateurs clés</span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-gray-50 rounded-xl p-2">
                    <span className="text-[11px] text-gray-450 font-bold block mb-1">Rentabilité nette</span>
                    <span className="text-sm font-serif font-black text-slate-800 block">{rentNetVal}%</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2">
                    <span className="text-[11px] text-gray-450 font-bold block mb-1">ROA</span>
                    <span className="text-sm font-serif font-black text-slate-800 block">{roaVal}%</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2">
                    <span className="text-[11px] text-gray-450 font-bold block mb-1">ROE</span>
                    <span className="text-sm font-serif font-black text-slate-800 block">{roeVal}%</span>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2">
                    <span className="text-[11px] text-gray-450 font-bold block mb-1">Levier</span>
                    <span className="text-sm font-serif font-black text-slate-800 block">{levierVal}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        };

        return (
          <div className="space-y-8 max-w-4xl mx-auto pb-12 text-[#132e15]">
            {/* Header section with buttons */}
            <div className="flex justify-between items-center bg-[#FAF9F5] p-4 rounded-3xl border border-[#132e15]/10">
              <h3 className="text-2xl md:text-3xl font-serif font-black text-[#132e15]">Données Financières</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleEdit('Données financières', 'add')}
                  className="bg-[#132e15] hover:bg-[#1f4222] text-[#ebd078] px-5 py-2.5 rounded-full flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border border-[#ebd078]/20"
                >
                  <Plus className="w-4 h-4 text-[#ebd078]" /> Ajouter donnée
                </button>
                {unifiedFinancials.length > 0 && (
                  <button 
                    onClick={() => {
                      if (enterprise.financialData && enterprise.financialData.length > 0) {
                        handleEdit('Données financières', 'edit', enterprise.financialData.length - 1);
                      } else {
                        showFeedback('error', 'Seules les saisies manuelles dynamiques peuvent être modifiées.');
                      }
                    }}
                    className="bg-[#132e15] hover:bg-[#1f4222] text-[#ebd078] px-5 py-2.5 rounded-full flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border border-[#ebd078]/20"
                  >
                    <Pencil className="w-4 h-4 text-[#ebd078]" /> Modifier dernière
                  </button>
                )}
              </div>
            </div>

            {unifiedFinancials.length > 0 ? (
              <div className="space-y-8">
                {unifiedFinancials.map((item: any) => renderExerciseCard(item))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-amber-100/40 text-gray-400 text-sm font-semibold max-w-3xl mx-auto">
                Aucune donnée financière enregistrée pour l'instant.
              </div>
            )}
          </div>
        );
      }
      case 'Besoins':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-8 max-w-3xl mx-auto">
              <h3 className="text-3xl font-serif font-black text-[#132e15]">Besoins</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleEdit('Besoins', 'add')}
                  className="bg-[#132e15] text-[#ebd078] px-4 py-1.5 rounded-full flex items-center gap-3 text-sm font-bold border border-[#ebd078]/40 hover:bg-[#132e15]/95 transition-colors cursor-pointer"
                >
                  <div className="bg-[#ebd078] rounded p-0.5"><Plus className="w-3 h-3 text-[#132e15]" /></div> Ajouter Besoin
                </button>
                <button 
                  onClick={() => handleEdit('Besoins', 'edit', selectedItemIndex)}
                  className="bg-[#132e15] text-[#ebd078] px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold border border-[#ebd078]/40 hover:bg-[#132e15]/95 transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" /> Modifier
                </button>
              </div>
            </div>
            <div className="overflow-hidden max-w-3xl mx-auto rounded-2xl border border-[#132e15]/20 shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#132e15] text-white text-xs font-black uppercase tracking-wider">
                    <th className="border border-[#132e15]/20 p-3 text-left">Titre</th>
                    <th className="border border-[#132e15]/20 p-3 text-left">Type</th>
                    <th className="border border-[#132e15]/20 p-3 text-left">Budget</th>
                    <th className="border border-[#132e15]/20 p-3 text-left">Priorité</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-[#132e15] font-semibold text-xs divide-y divide-[#132e15]/10">
                  {enterprise.besoins && enterprise.besoins.length > 0 ? (
                    enterprise.besoins.map((besoin: any, i: number) => (
                      <tr 
                        key={i}
                        onClick={() => setSelectedItemIndex(i)}
                        className={`cursor-pointer transition-colors ${selectedItemIndex === i ? 'bg-[#132e15]/10 font-bold' : 'hover:bg-[#132e15]/5'}`}
                      >
                        <td className="border border-[#132e15]/15 p-3 h-10">{besoin.title}</td>
                        <td className="border border-[#132e15]/15 p-3 h-10">{besoin.type}</td>
                        <td className="border border-[#132e15]/15 p-3 h-10">{besoin.budget}</td>
                        <td className="border border-[#132e15]/15 p-3 h-10">{besoin.priority}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-[#132e15]/60 italic font-bold">
                        Aucun besoin enregistré
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'Contacts':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
              <h3 className="text-3xl font-serif font-black text-[#132e15]">Contacts</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleEdit('Contacts', 'add')}
                  className="bg-[#132e15] text-[#ebd078] px-4 py-1.5 rounded-full flex items-center gap-3 text-sm font-bold border border-[#ebd078]/40 hover:bg-[#132e15]/95 transition-colors cursor-pointer"
                >
                  <div className="bg-[#ebd078] rounded p-0.5"><Plus className="w-3 h-3 text-[#132e15]" /></div> Ajouter Contact
                </button>
                <button 
                  onClick={() => handleEdit('Contacts', 'edit', selectedItemIndex)}
                  className="bg-[#132e15] text-[#ebd078] px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold border border-[#ebd078]/40 hover:bg-[#132e15]/95 transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4" /> Modifier
                </button>
              </div>
            </div>
            <div className="overflow-hidden max-w-4xl mx-auto rounded-2xl border border-[#132e15]/20 shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#132e15] text-white text-xs font-black uppercase tracking-wider">
                    <th className="border border-[#132e15]/20 p-3 text-left">Nom</th>
                    <th className="border border-[#132e15]/20 p-3 text-left">Fonction</th>
                    <th className="border border-[#132e15]/20 p-3 text-left">Téléphone</th>
                    <th className="border border-[#132e15]/20 p-3 text-left">Email</th>
                    <th className="border border-[#132e15]/20 p-3 text-center">Principal</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-[#132e15] font-semibold text-xs divide-y divide-[#132e15]/10">
                  {enterprise.contacts && enterprise.contacts.length > 0 ? (
                    enterprise.contacts.map((contact: any, i: number) => (
                      <tr 
                        key={i}
                        onClick={() => setSelectedItemIndex(i)}
                        className={`cursor-pointer transition-colors ${selectedItemIndex === i ? 'bg-[#132e15]/10 font-bold' : 'hover:bg-[#132e15]/5'}`}
                      >
                        <td className="border border-[#132e15]/15 p-3 h-10">{contact.name}</td>
                        <td className="border border-[#132e15]/15 p-3 h-10">{contact.function}</td>
                        <td className="border border-[#132e15]/15 p-3 h-10">{contact.phone}</td>
                        <td className="border border-[#132e15]/15 p-3 h-10">{contact.email}</td>
                        <td className="border border-[#132e15]/15 p-3 h-10 text-center font-bold text-[#132e15]">{contact.isPrimary}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-[#132e15]/60 italic font-bold">
                        Aucun contact enregistré
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'Cotisations': {
        const payments = getPaymentsList(enterprise);
        
        return (
          <div className="space-y-6 max-w-4xl mx-auto pb-12 text-[#132e15]">
            {/* Header with action buttons */}
            <div className="flex justify-between items-center bg-[#FAF9F5] p-4 rounded-3xl border border-[#132e15]/10">
              <h3 className="text-2xl md:text-3xl font-serif font-black text-[#132e15]">Historique des cotisations</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleEdit('Cotisations', 'add')}
                  className="bg-[#132e15] hover:bg-[#1f4222] text-[#ebd078] px-5 py-2.5 rounded-full flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border border-[#ebd078]/20"
                >
                  <Plus className="w-4 h-4 text-[#ebd078]" /> Ajouter Cotisation
                </button>
                <button 
                  onClick={() => {
                    if (selectedItemIndex === null) {
                      showFeedback('error', 'Veuillez sélectionner une cotisation personnalisée pour la modifier.');
                    } else {
                      handleEdit('Cotisations', 'edit', selectedItemIndex);
                    }
                  }}
                  className={`px-5 py-2.5 rounded-full flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer border ${
                    selectedItemIndex !== null 
                      ? 'bg-[#132e15] hover:bg-[#1f4222] text-[#ebd078] border-[#ebd078]/20' 
                      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  }`}
                >
                  <Pencil className="w-4 h-4" /> Modifier
                </button>
              </div>
            </div>

            {/* Currency conversion options & Total card matching Capture 1 */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white/60 p-6 rounded-3xl border border-amber-100/40 shadow-xs">
              <div className="flex flex-col gap-2 text-left">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">AFFICHER LES MONTANTS EN</span>
                <select 
                  value={displayCurrency} 
                  onChange={(e) => setDisplayCurrency(e.target.value as any)}
                  className="bg-white border-2 border-amber-100/30 text-[#132e15] font-serif font-black text-xs py-2.5 px-4 rounded-xl shadow-xs outline-none cursor-pointer focus:border-[#132e15] transition-all min-w-[200px]"
                >
                  <option value="FCFA">FCFA (XOF)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="MAD">MAD (Dirham Marocain)</option>
                  <option value="AED">AED (Dirham Émirati)</option>
                  <option value="GBP">GBP (Livre Sterling)</option>
                  <option value="QAR">QAR (Dirham du Qatar)</option>
                </select>
              </div>
              
              <div className="bg-[#132e15] border border-[#ebd078]/30 text-[#ebd078] px-6 py-4 rounded-3xl flex flex-col items-end min-w-[280px] shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#ebd078]/80 text-right">TOTAL DES COTISATIONS</span>
                <div className="flex justify-between w-full mt-2.5 items-end gap-6">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#ebd078]/50">En {displayCurrency}</span>
                  <span className="text-xl md:text-2xl font-serif font-black text-white">
                    {formatAmount(calculateTotalTreasury(), displayCurrency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Custom styled table matching image 1 */}
            <div className="overflow-hidden rounded-3xl border border-[#132e15]/15 shadow-sm bg-white">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#132e15] text-white text-[11px] font-black uppercase tracking-wider border-b border-[#132e15]/10">
                    <th className="p-4 text-left font-serif">DATE</th>
                    <th className="p-4 text-left font-serif">LIBELLÉ / MOTIF</th>
                    <th className="p-4 text-right font-serif">MONTANT ({displayCurrency})</th>
                    <th className="p-4 text-center font-serif">REÇU</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white text-xs text-gray-700 font-semibold">
                  {payments.length > 0 ? (
                    payments.map((pay: any, index: number) => {
                      const isCustom = pay.id.startsWith('custom-');
                      const customIndex = isCustom ? Number(pay.id.split('-')[1]) : null;
                      const isSelected = isCustom && selectedItemIndex === customIndex;
                      
                      return (
                        <tr 
                          key={pay.id}
                          onClick={() => {
                            if (isCustom) {
                              setSelectedItemIndex(customIndex);
                            } else {
                              setSelectedItemIndex(null); // non-custom items cannot be edited
                            }
                          }}
                          className={`transition-colors text-left ${
                            !isCustom 
                              ? 'bg-gray-50/50 hover:bg-gray-50' 
                              : isSelected 
                                ? 'bg-amber-50/70 border-l-4 border-amber-500 font-bold' 
                                : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="p-4 text-left font-mono font-bold text-gray-500">
                            {pay.date}
                          </td>
                          <td className="p-4 text-left font-medium text-gray-900 border-l border-gray-50">
                            <div className="flex items-center gap-2">
                              <span>{pay.label}</span>
                              {!isCustom && (
                                <span className="text-[9px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase px-1.5 py-0.5 rounded-md">
                                  Importé
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-right font-medium text-[#132e15] border-l border-gray-50">
                            {formatAmount(pay.amount, displayCurrency)}
                          </td>
                          <td className="p-4 text-center border-l border-gray-50">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadReceiptFile(enterprise, pay, displayCurrency);
                              }}
                              type="button"
                              className="bg-[#132e15] hover:bg-[#1a3819] text-[#ebd078] hover:text-white border border-[#ebd078]/20 font-black text-[10px] uppercase tracking-wider px-3.5 py-2.5 rounded-full flex items-center gap-1.5 mx-auto transition-all shadow-3xs cursor-pointer active:scale-95"
                            >
                              <Download className="w-3.5 h-3.5 text-[#ebd078]" />
                              <span>Télécharger</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-gray-400 italic font-bold">
                        Aucune cotisation n'a été trouvée pour ce membre.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white w-full max-w-6xl rounded-xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[95vh]"
        >
          {/* Header Section */}
          <div className="p-8 border-b border-[#132e15]/10 bg-white relative">
            <button onClick={onClose} className="absolute top-8 left-8 p-2 hover:bg-gray-50 rounded-full transition-colors cursor-pointer">
              <ChevronLeft className="w-8 h-8 text-[#132e15]" />
            </button>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mt-4">
              <div 
                className="w-32 h-32 rounded-full border border-gray-300 flex items-center justify-center text-center p-2 text-[10px] font-bold overflow-hidden bg-gray-50 cursor-pointer relative group"
                onClick={() => document.getElementById(`upload-ent-logo-${enterprise.id}`)?.click()} 
                title="Cliquer pour changer le logo de l'entreprise"
              >
                {enterprise.logo ? (
                  <img src={enterprise.logo} alt={enterprise.name} className="w-full h-full object-cover" />
                ) : (
                  <>LOGO<br/>Entreprise</>
                )}
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-black flex-col gap-1">
                  <span>Changer Logo</span>
                </div>
                
                <input 
                  type="file" 
                  id={`upload-ent-logo-${enterprise.id}`}
                  className="hidden" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && onUpdate) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const updated = { ...enterprise, logo: reader.result as string };
                        onUpdate(updated);
                        showFeedback('success', "Le logo de l'entreprise a été mis à jour !");
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
              <div className="text-sm space-y-1 text-[#132e15] font-semibold">
                <p><span className="font-bold">Numéro membre :</span> {enterprise.memberNo}</p>
                <p><span className="font-bold">Statut membre :</span> {enterprise.statutMembre}</p>
                <p><span className="font-bold">Date d'adhésion :</span> {enterprise.dateAdhesion}</p>
                <p><span className="font-bold">Nom commercial :</span> {enterprise.name}</p>
                <p><span className="font-bold">Raison sociale :</span> {enterprise.raisonSociale}</p>
                <p><span className="font-bold">Secteur principal :</span> {enterprise.secteur}</p>
                <p><span className="font-bold">Pays + ville :</span> {enterprise.pays} - {enterprise.ville}</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 py-4 border-b border-[#132e15]/10 bg-white sticky top-0 z-20 px-8">
            {tabs.map((tab, index) => (
              <React.Fragment key={tab}>
                <button
                  onClick={() => {
                    setActiveTab(tab);
                    setSelectedItemIndex(null);
                  }}
                  className={`text-sm tracking-wide transition-colors cursor-pointer ${
                    activeTab === tab 
                      ? 'text-[#132e15] font-black underline underline-offset-8 decoration-2' 
                      : 'text-[#132e15]/60 hover:text-[#132e15]'
                  }`}
                >
                  {tab}
                </button>
                {index < tabs.length - 1 && (
                  <span className="text-[#132e15]/20 font-light">|</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-white relative">
            <AnimatePresence>
              {feedbackMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-full shadow-lg font-bold text-sm border ${
                    feedbackMessage.type === 'success' 
                      ? 'bg-green-100 text-green-800 border-green-500' 
                      : 'bg-red-100 text-red-800 border-red-500'
                  }`}
                >
                  {feedbackMessage.text}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <EditFormModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        type={editType}
        mode={editMode}
        enterprise={enterprise}
        onSave={handleSave}
        itemIndex={selectedItemIndex}
      />
    </AnimatePresence>
  );
};
