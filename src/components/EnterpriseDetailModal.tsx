import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, Pencil, Plus, Eye, Download, Info, Briefcase, ShieldCheck, Landmark, Lightbulb, Contact, Coins } from 'lucide-react';
import { EditFormModal } from './EditFormModal';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { jsPDF } from 'jspdf';
import { getLocalCotisationRules } from '../utils/cotisationRules';

const CURRENCIES = [
  { code: 'FCFA', name: 'FCFA (XOF) - Franc CFA', rate: 1, symbol: 'XOF' },
  { code: 'EUR', name: 'Euro (EUR) - €', rate: 655.957, symbol: '€' },
  { code: 'USD', name: 'Dollar US (USD) - $', rate: 600, symbol: '$' },
  { code: 'MAD', name: 'Dirham Marocain (MAD) - DH', rate: 60.3, symbol: 'DH' },
  { code: 'GBP', name: 'Livre Sterling (GBP) - £', rate: 775.2, symbol: '£' },
  { code: 'CAD', name: 'Dollar Canadien (CAD) - C$', rate: 445, symbol: 'C$' },
  { code: 'CHF', name: 'Franc Suisse (CHF) - CHF', rate: 685, symbol: 'CHF' },
  { code: 'AED', name: 'Dirham EAU (AED) - AED', rate: 163.5, symbol: 'AED' },
  { code: 'SAR', name: 'Riyal Saoudien (SAR) - SR', rate: 160, symbol: 'SR' }
];

const getTabIcon = (tab: string) => {
  switch (tab) {
    case 'Informations générales':
      return Info;
    case 'Métiers & expertises':
      return Briefcase;
    case 'Certifications':
      return ShieldCheck;
    case 'Données financières':
      return Landmark;
    case 'Besoins':
      return Lightbulb;
    case 'Contacts':
      return Contact;
    case 'Cotisations':
      return Coins;
    default:
      return Info;
  }
};

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
  const [displayCurrency, setDisplayCurrency] = useState<string>('FCFA');
  const [previewCert, setPreviewCert] = useState<any | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (previewCert && previewCert.fileData) {
      if (previewCert.fileData.startsWith('data:')) {
        try {
          const parts = previewCert.fileData.split(',');
          const byteString = atob(parts[1]);
          const mimeString = parts[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          const url = URL.createObjectURL(blob);
          setPreviewBlobUrl(url);
          return () => {
            URL.revokeObjectURL(url);
          };
        } catch (e) {
          console.error("Failed to convert data URI to object URL:", e);
          setPreviewBlobUrl(previewCert.fileData);
        }
      } else {
        setPreviewBlobUrl(previewCert.fileData);
      }
    } else {
      setPreviewBlobUrl(null);
    }
  }, [previewCert]);

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
          amount: Number(cot.amount) || getLocalCotisationRules().amountPerSemester,
          date: cot.date || new Date().toISOString().split('T')[0],
          reference: cot.reference || `REF-${Math.floor(Math.random() * 900000 + 100000)}`,
          method: 'Virement bancaire'
        });
      });
    }
    
    return payments;
  };

  const downloadReceiptPDF = (ent: any, payment: any, currencyCode: string) => {
    const rawAmount = Number(payment.amount);
    let amountStr = '';
    
    if (currencyCode === 'FCFA') {
      amountStr = `${rawAmount.toLocaleString('fr-FR')} FCFA`;
    } else {
      const curr = CURRENCIES.find(c => c.code === currencyCode);
      if (curr) {
        const converted = rawAmount / curr.rate;
        amountStr = `${converted.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr.code}`;
      } else {
        amountStr = `${rawAmount.toLocaleString('fr-FR')} FCFA`;
      }
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Outer border decoration
    doc.setDrawColor(19, 46, 21); // #132e15
    doc.setLineWidth(1);
    doc.rect(8, 8, 194, 281); // full page margin border
    doc.setDrawColor(235, 208, 120); // gold border
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277);

    // Title Header Block
    doc.setFillColor(19, 46, 21); // #132e15
    doc.rect(12, 12, 186, 32, 'F');

    // Title text
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text("RECU DE PAIEMENT OFFICIEL", 20, 28);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(235, 208, 120); // Gold
    doc.text("Chambre Sénégalaise de Commerce au Maroc (CSCM)", 20, 36);

    // Member and payment information blocks
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    
    // Grid - Section 1: Membre Émetteur
    doc.setFillColor(245, 245, 245);
    doc.rect(15, 55, 180, 10, 'F');
    doc.setTextColor(19, 46, 21);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text("1. INFORMATIONS DU MEMBRE ADHERENT", 20, 61);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text("Nom de l'entreprise :", 20, 72);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(19, 46, 21);
    doc.text(ent.name, 65, 72);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text("Raison Sociale :", 20, 79);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(19, 46, 21);
    doc.text(ent.raisonSociale || ent.name, 65, 79);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text("Numéro d'adhérent :", 20, 86);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(19, 46, 21);
    doc.text(ent.memberNo || '-', 65, 86);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text("Secteur d'activité :", 20, 93);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(19, 46, 21);
    doc.text(ent.secteur || 'PME', 65, 93);

    // Section 2: Détails de la transaction
    doc.setFillColor(245, 245, 245);
    doc.rect(15, 105, 180, 10, 'F');
    doc.setTextColor(19, 46, 21);
    doc.setFont('Helvetica', 'bold');
    doc.text("2. DETAILS DE LA TRANSACTION", 20, 111);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text("Libellé du versement :", 20, 122);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(19, 46, 21);
    doc.text(payment.label || 'Cotisation', 65, 122);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text("Date du paiement :", 20, 129);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(19, 46, 21);
    doc.text(payment.date, 65, 129);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text("Mode de règlement :", 20, 136);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(19, 46, 21);
    doc.text(payment.method || 'Virement bancaire', 65, 136);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text("Référence transaction :", 20, 143);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(19, 46, 21);
    doc.text(payment.reference || '-', 65, 143);

    // Amount box
    doc.setFillColor(237, 252, 244); // light emerald background
    doc.setDrawColor(19, 46, 21);
    doc.setLineWidth(1);
    doc.rect(15, 160, 180, 24, 'FD');

    doc.setTextColor(19, 46, 21);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text("MONTANT ENCAISSÉ", 20, 167);
    
    doc.setFontSize(20);
    doc.text(amountStr, 20, 178);

    // Footer signature and seal
    doc.setTextColor(120, 120, 120);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.text("Reçu généré automatiquement depuis la plateforme administrative sécurisée CSCM.", 15, 220);
    doc.text(`Date de génération : ${new Date().toLocaleString('fr-FR')}`, 15, 224);

    // Signature box
    doc.setDrawColor(19, 46, 21);
    doc.setLineWidth(0.5);
    doc.line(130, 245, 185, 245);
    
    doc.setTextColor(19, 46, 21);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(9);
    doc.text("La Trésorerie Générale CSCM", 136, 250);
    doc.setFont('Helvetica', 'oblique');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Signé électroniquement", 143, 255);

    doc.save(`Recu_${ent.name.replace(/[^a-zA-Z0-9]/g, '_')}_${payment.reference}.pdf`);
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

  const formatAmount = (amountFCFA: number, currencyCode: string) => {
    if (currencyCode === 'FCFA') {
      return `${amountFCFA.toLocaleString('fr-FR')} FCFA`;
    }
    const curr = CURRENCIES.find(c => c.code === currencyCode);
    if (!curr) {
      return `${amountFCFA.toLocaleString('fr-FR')} FCFA`;
    }
    const converted = amountFCFA / curr.rate;
    return `${converted.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr.symbol || curr.code}`;
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
            <div className="bg-white p-4 sm:p-8 rounded-2xl border-2 border-[#132e15]/20 max-w-2xl mx-auto space-y-4 shadow-sm text-[#132e15]">
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
                <div key={item.label} className="flex flex-col sm:flex-row gap-1 sm:gap-4 border-b border-[#132e15]/5 pb-2 last:border-b-0 last:pb-0 text-left">
                  <span className="font-extrabold text-[#132e15] sm:min-w-[150px] shrink-0">{item.label} :</span>
                  <span className="font-semibold text-[#132e15]/90 break-words">{item.value || 'Non spécifié'}</span>
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
            <div className="bg-white p-4 sm:p-8 rounded-2xl border-2 border-[#132e15]/20 max-w-2xl mx-auto space-y-4 shadow-sm text-[#132e15]">
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
                <div key={item.label} className="flex flex-col sm:flex-row gap-1 sm:gap-4 border-b border-[#132e15]/5 pb-2 last:border-b-0 last:pb-0 text-left">
                  <span className="font-extrabold text-[#132e15] sm:min-w-[180px] shrink-0">{item.label} :</span>
                  <span className="font-semibold text-[#132e15]/90 break-words">{item.value || 'Non spécifié'}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Certifications':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 max-w-3xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#132e15] text-left">Certifications</h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => handleEdit('Certifications', 'add')}
                  className="bg-[#132e15] text-[#ebd078] px-3 py-1.5 rounded-full flex items-center justify-center gap-2 text-xs sm:text-sm font-bold border border-[#ebd078]/40 hover:bg-[#132e15]/95 transition-colors cursor-pointer flex-1 sm:flex-initial"
                >
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
                <button 
                  onClick={() => handleEdit('Certifications', 'edit', selectedItemIndex)}
                  className="bg-[#132e15] text-[#ebd078] px-3 py-1.5 rounded-full flex items-center justify-center gap-2 text-xs sm:text-sm font-bold border border-[#ebd078]/40 hover:bg-[#132e15]/95 transition-colors cursor-pointer flex-1 sm:flex-initial"
                >
                  <Pencil className="w-3.5 h-3.5" /> Modifier
                </button>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden max-w-3xl mx-auto rounded-2xl border border-[#132e15]/20 shadow-sm">
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
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewCert(cert);
                                  }}
                                  title="Visualiser le document en ligne"
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white transition-all text-[9px] tracking-wider font-extrabold uppercase px-2 py-1 rounded flex items-center gap-1 cursor-pointer hover:shadow-xs shrink-0"
                                >
                                  <Eye className="w-3 h-3" />
                                  Voir
                                </button>
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
                                  className="bg-[#132e15] hover:bg-emerald-800 text-white transition-all text-[9px] tracking-wider font-extrabold uppercase px-2 py-1 rounded flex items-center gap-1 cursor-pointer hover:shadow-xs shrink-0"
                                >
                                  <Download className="w-3 h-3" />
                                  Doc
                                </button>
                              </div>
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

            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-4 max-w-3xl mx-auto">
              {enterprise.certifications && enterprise.certifications.length > 0 ? (
                enterprise.certifications.map((cert: any, i: number) => (
                  <div 
                    key={i}
                    onClick={() => setSelectedItemIndex(i)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      selectedItemIndex === i 
                        ? 'border-[#132e15] bg-[#132e15]/10 shadow-sm' 
                        : 'border-gray-200 bg-white hover:bg-gray-55 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-[#132e15] text-sm break-words">{cert.name}</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Organisme : {cert.issuer}</p>
                      </div>
                      
                      {cert.fileData && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewCert(cert);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black uppercase px-2.5 py-1.5 rounded flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Eye className="w-3 h-3" /> Voir
                          </button>
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
                            className="bg-[#132e15] text-white text-[9px] font-black uppercase px-2.5 py-1.5 rounded flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <Download className="w-3 h-3" /> Doc
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-[#132e15]/5 text-[11px] font-semibold text-gray-600">
                      <div>
                        <span className="text-gray-400 block font-bold uppercase tracking-wider text-[9px]">Code</span>
                        <span className="text-gray-800 font-bold">{cert.code || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-bold uppercase tracking-wider text-[9px]">Date</span>
                        <span className="text-gray-800 font-bold">{cert.date || '-'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-white rounded-2xl border border-gray-150 text-[#132e15]/60 italic font-bold">
                  Aucune certification enregistrée
                </div>
              )}
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

        const renderExerciseCard = (item: any, idx: number) => {
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
            <div key={`${year}-${idx}`} className="bg-white border text-left border-gray-150 rounded-3xl p-6 shadow-xs space-y-6">
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
                {unifiedFinancials.map((item: any, idx: number) => renderExerciseCard(item, idx))}
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 max-w-3xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#132e15] text-left">Besoins</h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => handleEdit('Besoins', 'add')}
                  className="bg-[#132e15] text-[#ebd078] px-3 py-1.5 rounded-full flex items-center justify-center gap-2 text-xs sm:text-sm font-bold border border-[#ebd078]/40 hover:bg-[#132e15]/95 transition-colors cursor-pointer flex-1 sm:flex-initial"
                >
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
                <button 
                  onClick={() => handleEdit('Besoins', 'edit', selectedItemIndex)}
                  className="bg-[#132e15] text-[#ebd078] px-3 py-1.5 rounded-full flex items-center justify-center gap-2 text-xs sm:text-sm font-bold border border-[#ebd078]/40 hover:bg-[#132e15]/95 transition-colors cursor-pointer flex-1 sm:flex-initial"
                >
                  <Pencil className="w-3.5 h-3.5" /> Modifier
                </button>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden max-w-3xl mx-auto rounded-2xl border border-[#132e15]/20 shadow-sm">
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

            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-4 max-w-3xl mx-auto">
              {enterprise.besoins && enterprise.besoins.length > 0 ? (
                enterprise.besoins.map((besoin: any, i: number) => (
                  <div 
                    key={i}
                    onClick={() => setSelectedItemIndex(i)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      selectedItemIndex === i 
                        ? 'border-[#132e15] bg-[#132e15]/10 shadow-sm' 
                        : 'border-gray-200 bg-white hover:bg-gray-55 hover:bg-gray-50'
                    }`}
                  >
                    <h4 className="font-extrabold text-[#132e15] text-sm break-words">{besoin.title}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Type : {besoin.type || '-'}</p>
                    
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-[#132e15]/5 text-[11px] font-semibold text-gray-600">
                      <div>
                        <span className="text-gray-400 block font-bold uppercase tracking-wider text-[9px]">Budget</span>
                        <span className="text-gray-800 font-bold">{besoin.budget || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-bold uppercase tracking-wider text-[9px]">Priorité</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black mt-0.5 ${
                          besoin.priority === 'Haute' 
                          ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                          : besoin.priority === 'Moyenne'
                          ? 'bg-amber-50 text-amber-700 border border-amber-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {besoin.priority || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-white rounded-2xl border border-gray-150 text-[#132e15]/60 italic font-bold">
                  Aucun besoin enregistré
                </div>
              )}
            </div>
          </div>
        );
      case 'Contacts':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 max-w-4xl mx-auto">
              <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#132e15] text-left">Contacts</h3>
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => handleEdit('Contacts', 'add')}
                  className="bg-[#132e15] text-[#ebd078] px-3 py-1.5 rounded-full flex items-center justify-center gap-2 text-xs sm:text-sm font-bold border border-[#ebd078]/40 hover:bg-[#132e15]/95 transition-colors cursor-pointer flex-1 sm:flex-initial"
                >
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
                <button 
                  onClick={() => handleEdit('Contacts', 'edit', selectedItemIndex)}
                  className="bg-[#132e15] text-[#ebd078] px-3 py-1.5 rounded-full flex items-center justify-center gap-2 text-xs sm:text-sm font-bold border border-[#ebd078]/40 hover:bg-[#132e15]/95 transition-colors cursor-pointer flex-1 sm:flex-initial"
                >
                  <Pencil className="w-3.5 h-3.5" /> Modifier
                </button>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden max-w-4xl mx-auto rounded-2xl border border-[#132e15]/20 shadow-sm">
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

            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-4 max-w-4xl mx-auto">
              {enterprise.contacts && enterprise.contacts.length > 0 ? (
                enterprise.contacts.map((contact: any, i: number) => (
                  <div 
                    key={i}
                    onClick={() => setSelectedItemIndex(i)}
                    className={`p-4 rounded-2xl border text-left transition-all ${
                      selectedItemIndex === i 
                        ? 'border-[#132e15] bg-[#132e15]/10 shadow-sm' 
                        : 'border-gray-200 bg-white hover:bg-gray-55 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-[#132e15] text-sm break-words">{contact.name}</h4>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Fonction : {contact.function || '-'}</p>
                      </div>
                      {contact.isPrimary === 'Oui' && (
                        <span className="bg-[#132e15]/10 text-cscm-green text-[9px] font-black uppercase px-2.5 py-1 rounded">
                          Principal
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-2 border-t border-[#132e15]/5 text-[11px] font-semibold text-gray-600">
                      <div>
                        <span className="text-gray-400 block font-bold uppercase tracking-wider text-[9px]">Téléphone</span>
                        <span className="text-gray-800 font-bold">{contact.phone || '-'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-bold uppercase tracking-wider text-[9px]">Email</span>
                        <span className="text-gray-800 font-bold break-all">{contact.email || '-'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-white rounded-2xl border border-gray-150 text-[#132e15]/60 italic font-bold">
                  Aucun contact enregistré
                </div>
              )}
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
                  onChange={(e) => setDisplayCurrency(e.target.value)}
                  className="bg-white border-2 border-amber-100/30 text-[#132e15] font-serif font-black text-xs py-2.5 px-4 rounded-xl shadow-xs outline-none cursor-pointer focus:border-[#132e15] transition-all min-w-[200px]"
                >
                  {CURRENCIES.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.name}
                    </option>
                  ))}
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

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden rounded-3xl border border-[#132e15]/15 shadow-sm bg-white">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#132e15] text-white text-[11px] font-black uppercase tracking-wider border-b border-[#132e15]/10">
                    <th className="p-4 text-left font-serif">DATE</th>
                    <th className="p-4 text-left font-serif">LIBELLÉ / MOTIF</th>
                    <th className="p-4 text-right font-serif">MONTANT ({displayCurrency})</th>
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
                          key={`${pay.id || index}-${index}`}
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
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-10 text-center text-gray-400 italic font-bold">
                        Aucune cotisation n'a été trouvée pour ce membre.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-4">
              {payments.length > 0 ? (
                payments.map((pay: any, index: number) => {
                  const isCustom = pay.id.startsWith('custom-');
                  const customIndex = isCustom ? Number(pay.id.split('-')[1]) : null;
                  const isSelected = isCustom && selectedItemIndex === customIndex;
                  
                  return (
                    <div
                      key={`${pay.id || index}-${index}`}
                      onClick={() => {
                        if (isCustom) {
                          setSelectedItemIndex(customIndex);
                        } else {
                          setSelectedItemIndex(null);
                        }
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        !isCustom 
                          ? 'border-gray-150 bg-gray-50/50 hover:bg-gray-50' 
                          : isSelected 
                            ? 'border-amber-500 bg-amber-50/70 shadow-sm font-semibold' 
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[10px] text-gray-400 font-mono font-bold block">{pay.date}</span>
                          <h4 className="font-extrabold text-[#132e15] text-sm break-words mt-1">{pay.label}</h4>
                          {!isCustom && (
                            <span className="inline-block text-[8px] font-black bg-green-50 text-green-700 border border-green-200 uppercase px-1.5 py-0.5 rounded mt-1">
                              Importé
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-gray-400 block text-[9px] font-bold uppercase tracking-wider">Montant</span>
                          <span className="text-emerald-850 font-extrabold text-xs block font-mono mt-0.5">
                            {formatAmount(pay.amount, displayCurrency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-white rounded-2xl border border-gray-150 text-[#132e15]/60 italic font-bold">
                  Aucune cotisation n'a été trouvée pour ce membre.
                </div>
              )}
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
      <div className="fixed lg:inset-0 top-16 bottom-16 lg:bottom-0 left-0 right-0 z-30 lg:z-50 bg-[#FAF9F5] flex flex-col overflow-hidden shadow-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 28, stiffness: 220 }}
          className="bg-white w-full h-full flex flex-col overflow-y-auto"
        >
          {/* Header Section */}
          <div className="p-4 md:p-8 border-b border-[#132e15]/10 bg-white relative flex flex-col items-center">
            <button onClick={onClose} className="absolute top-4 left-4 md:top-8 md:left-8 p-2 hover:bg-gray-55 bg-gray-50 md:bg-transparent rounded-full transition-colors cursor-pointer" title="Retour">
              <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-[#132e15]" />
            </button>

            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mt-10 md:mt-4 w-full max-w-4xl">
              <div 
                className="w-32 h-32 rounded-2xl border-2 border-gray-300 flex items-center justify-center text-center p-2 text-xs font-black overflow-hidden bg-white text-black cursor-pointer relative group shadow-sm transition-all hover:border-[#132e15]"
                onClick={() => document.getElementById(`upload-ent-logo-${enterprise.id}`)?.click()} 
                title="Cliquer pour changer le logo de l'entreprise"
              >
                {enterprise.logo ? (
                  <img src={enterprise.logo} alt={enterprise.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-black font-black leading-tight text-center">
                    LOGO<br/>
                    <span className="text-[10px] font-black text-black uppercase">Entreprise</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-white/95 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-black text-xs font-black flex-col gap-1 shadow-inner">
                  <span className="tracking-wide">Changer Logo</span>
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

          {/* Navigation Links / Buttons */}
          <div className="py-3 border-b border-[#132e15]/10 bg-white sticky top-0 z-20 px-4 md:px-8">
            <div className="max-w-4xl mx-auto grid grid-cols-4 sm:grid-cols-7 md:flex md:flex-wrap md:justify-center gap-2">
              {tabs.map((tab) => {
                const IconComponent = getTabIcon(tab);
                const isActive = activeTab === tab;
                const shortName = tab === 'Informations générales' ? 'Général' :
                                  tab === 'Métiers & expertises' ? 'Expertises' :
                                  tab === 'Données financières' ? 'Finance' : tab;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setSelectedItemIndex(null);
                    }}
                    className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2.5 py-2 md:px-4 md:py-2.5 rounded-2xl transition-all duration-250 cursor-pointer text-center md:text-left ${
                      isActive 
                        ? 'bg-[#132e15] text-[#ebd078] shadow-sm font-black ring-1 ring-[#ebd078]/20' 
                        : 'text-[#132e15]/70 hover:bg-[#132e15]/5 hover:text-[#132e15] border border-gray-150 bg-[#FAF9F5]'
                    }`}
                    title={tab}
                  >
                    <IconComponent className="w-4 h-4 md:w-4.5 md:h-4.5 shrink-0" />
                    <span className="text-[9px] md:text-xs font-bold leading-none tracking-tight">{shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 md:p-8 bg-white relative">
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

      {/* Certification Document Preview Modal */}
      <AnimatePresence>
        {previewCert && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
              onClick={() => setPreviewCert(null)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-[#FAF9F5] w-full max-w-5xl rounded-3xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh] border-2 border-[#132e15]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-[#132e15]/10 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100 shrink-0">
                    <Eye className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-black text-[#132e15]">{previewCert.name}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{previewCert.issuer || 'Organisme de certification'} • {previewCert.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = previewCert.fileData;
                      link.download = previewCert.fileName || 'justificatif_certification';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="px-3.5 py-2 hover:bg-gray-100 text-[#132e15] rounded-xl transition-all flex items-center gap-2 text-xs font-black border border-gray-250 cursor-pointer active:scale-95"
                    title="Télécharger"
                  >
                    <Download className="w-4 h-4 text-emerald-800" />
                    <span>Télécharger</span>
                  </button>
                  <button
                    onClick={() => setPreviewCert(null)}
                    className="p-2.5 hover:bg-gray-100 text-gray-600 rounded-xl transition-all cursor-pointer border border-transparent hover:border-gray-200 active:scale-95"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-auto p-6 bg-gray-50 flex items-center justify-center min-h-[450px]">
                {previewCert.fileData?.startsWith('data:image/') ? (
                  <div className="bg-white p-3 rounded-2xl border border-gray-150 shadow-sm max-w-full max-h-[70vh] overflow-auto flex items-center justify-center">
                    <img
                      src={previewBlobUrl || previewCert.fileData}
                      alt={previewCert.name}
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-[60vh] object-contain rounded-xl"
                    />
                  </div>
                ) : (previewCert.fileData?.startsWith('data:application/pdf') || previewCert.fileData?.includes('pdf') || previewCert.fileName?.toLowerCase().endsWith('.pdf')) ? (
                  <div className="w-full h-[65vh] bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden flex flex-col">
                    <iframe
                      src={previewBlobUrl || previewCert.fileData}
                      title={previewCert.name}
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : (
                  <div className="text-center p-8 bg-white rounded-3xl border border-gray-150 shadow-sm max-w-md space-y-4">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-100">
                      <Download className="w-7 h-7" />
                    </div>
                    <div>
                      <h5 className="font-serif font-black text-base text-[#132e15]">Aperçu non disponible</h5>
                      <p className="text-xs text-gray-500 font-medium mt-1 leading-relaxed">
                        Ce type de fichier ne peut pas être affiché directement dans le navigateur. Veuillez le télécharger pour le consulter.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = previewCert.fileData;
                        link.download = previewCert.fileName || 'justificatif_certification';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="w-full bg-[#132e15] hover:bg-emerald-800 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      Télécharger le document
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
};
