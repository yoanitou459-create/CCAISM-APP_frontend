import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, Pencil, Plus, Eye, Download, Info, Briefcase, ShieldCheck, Landmark, Lightbulb, Contact, Coins, FileText, Building2, UserCheck, MapPin, Layers, Globe, Star, DollarSign, Mail, Phone, User, Trash2 } from 'lucide-react';
import { EditFormModal } from '../components/EditFormModal';
import { EnterpriseSummaryModal } from '../components/EnterpriseSummaryModal';
import { ModalPortal } from '../components/ModalPortal';
import { FeedbackToast, buildDetailFeedbackMessage } from '../components/FeedbackToast';
import { jsPDF } from 'jspdf';
import { getLocalCotisationRules } from '../../database/cotisationRules';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getStoredEnterprises, saveStoredEnterprises } from '../../database/enterpriseStorage';
import { SidebarLayout } from '../components/SidebarLayout';

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
    case 'Fiche technique':
      return FileText;
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

export const EnterpriseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [enterprise, setEnterprise] = useState<any>(null);

  const [activeTab, setActiveTab] = useState('Informations générales');
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
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

  const loadEnterprise = () => {
    // Only perform redirections if we are actively on an enterprise detail page
    const isDetailRoute = location.pathname.startsWith('/enterprises/') && 
                          location.pathname !== '/enterprises/add' && 
                          location.pathname !== '/enterprises';
    if (!isDetailRoute) return;

    const freshList = getStoredEnterprises();
    const found = freshList.find(e => String(e.id) === String(id));
    if (found) {
      setEnterprise(found);
    } else {
      navigate('/enterprises');
    }
  };

  useEffect(() => {
    loadEnterprise();
    window.addEventListener('enterprises_updated', loadEnterprise);
    return () => {
      window.removeEventListener('enterprises_updated', loadEnterprise);
    };
  }, [id]);

  useEffect(() => {
    setActiveTab('Informations générales');
    setSelectedItemIndex(null);
    setFeedbackMessage(null);
    setPreviewCert(null);
  }, [id]);

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
          Reçu généré automatiquement depuis la plateforme CSCM.
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
    'Fiche technique',
    'Métiers & expertises',
    'Certifications',
    'Données financières',
    'Besoins',
    'Contacts',
    'Cotisations'
  ];

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 3500);
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

  const getEnterpriseContacts = (ent: any): any[] => {
    if (!ent) return [];
    const list: any[] = [];
    const seenKeys = new Set<string>();

    // 1. From existing contacts array
    if (ent.contacts && Array.isArray(ent.contacts)) {
      ent.contacts.forEach((c: any, idx: number) => {
        let pName = (c.prenom || '').trim();
        let nName = (c.nom || '').trim();
        let fName = (c.name || '').trim();

        if (!pName && !nName && fName) {
          const parts = fName.split(/\s+/);
          if (parts.length > 1) {
            pName = parts[0];
            nName = parts.slice(1).join(' ');
          } else {
            nName = fName;
          }
        }
        if (!fName && (pName || nName)) {
          fName = `${pName} ${nName}`.trim();
        }

        const key = `${pName.toLowerCase()}_${nName.toLowerCase()}_${fName.toLowerCase()}`;
        if (fName && !seenKeys.has(key)) {
          seenKeys.add(key);
          list.push({
            id: c.id || `c-${idx}`,
            prenom: pName,
            nom: nName,
            name: fName,
            function: c.function || c.fonction || 'Contact',
            phone: c.phone || c.telephone || '',
            email: c.email || c.mail || '',
            isPrimary: c.isPrimary || (idx === 0 ? 'Oui' : 'Non')
          });
        }
      });
    }

    // 2. From enterprise root fields (Nom adhérent, Prénom adhérent, Responsable, etc.)
    const prenom = (ent.prenom_adherent || ent.prenomContact || ent.prenom_responsable || ent.prenom_dirigeant || ent.prenomRep || ent.prenom || '').trim();
    const nom = (ent.nom_adherent || ent.nomContact || ent.nom_responsable || ent.nom_dirigeant || ent.nomRep || ent.nom || '').trim();
    const rawResp = (ent.responsable || ent.dirigeant || '').trim();
    const fonction = (ent.fonction_adherent || ent.fonction || ent.fonction_responsable || ent.fonctionResponsable || ent.poste || 'Dirigeant / Représentant légal').trim();
    const phone = (ent.telephone_principale || ent.mobileContact || ent.telephoneSecondaire || ent.telephone_secondaire || ent.telephone || '').trim();
    const email = (ent.email_principal || ent.emailContact || ent.email || '').trim();

    let fullRespName = '';
    if (prenom && nom) fullRespName = `${prenom} ${nom}`.trim();
    else if (nom) fullRespName = nom;
    else if (prenom) fullRespName = prenom;
    else if (rawResp) fullRespName = rawResp;

    if (fullRespName && fullRespName !== 'Non spécifié') {
      const key = `${prenom.toLowerCase()}_${nom.toLowerCase()}_${fullRespName.toLowerCase()}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        list.unshift({
          id: `c-root-${ent.id || '0'}`,
          prenom: prenom || (rawResp ? rawResp.split(/\s+/)[0] : ''),
          nom: nom || (rawResp ? rawResp.split(/\s+/).slice(1).join(' ') : ''),
          name: fullRespName,
          function: fonction,
          phone: phone,
          email: email,
          isPrimary: 'Oui'
        });
      }
    }

    return list;
  };

  const handleEdit = (type: string, mode: 'add' | 'edit' = 'edit', index: number | null = null) => {
    if (mode === 'edit' && index === null && ['Certifications', 'Données financières', 'Besoins', 'Contacts', 'Cotisations'].includes(type)) {
      showFeedback('error', 'Sélectionnez d’abord une ligne à modifier.');
      return;
    }
    setEditType(type);
    setEditMode(mode);
    setSelectedItemIndex(index);
    setIsEditModalOpen(true);
  };

  const handleDeleteContact = (indexToDelete: number) => {
    const currentList = getEnterpriseContacts(enterprise);
    if (indexToDelete < 0 || indexToDelete >= currentList.length) return;
    
    const contactToDelete = currentList[indexToDelete];
    const confirmDelete = window.confirm(`Voulez-vous vraiment supprimer le contact ${contactToDelete.name || 'sélectionné'} ?`);
    if (!confirmDelete) return;

    const newContacts = currentList.filter((_, idx) => idx !== indexToDelete);
    const updatedEnterprise = { ...enterprise, contacts: newContacts };
    handleUpdateEnterprise(updatedEnterprise);
    setSelectedItemIndex(null);
    showFeedback('success', 'Contact supprimé avec succès.');
  };

  const handleUpdateEnterprise = (updatedEnterprise: any) => {
    const list = getStoredEnterprises();
    const updated = list.map(e => String(e.id) === String(updatedEnterprise.id) ? updatedEnterprise : e);
    saveStoredEnterprises(updated);
    setEnterprise(updatedEnterprise);
  };

  const handleSave = (data: any) => {
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
      const currentContacts = getEnterpriseContacts(enterprise);
      const newContacts = [...currentContacts];
      if (editMode === 'add') {
        newContacts.push(data);
      } else if (selectedItemIndex !== null && selectedItemIndex < newContacts.length) {
        newContacts[selectedItemIndex] = data;
      } else if (newContacts.length > 0) {
        newContacts[0] = data;
      } else {
        newContacts.push(data);
      }

      const isPrimary = data.isPrimary === 'Oui';
      updatedEnterprise = { 
        ...enterprise, 
        contacts: newContacts,
        ...(isPrimary ? {
          nom_adherent: data.nom || data.name || '',
          prenom_adherent: data.prenom || '',
          nomContact: data.nom || data.name || '',
          prenomContact: data.prenom || '',
          responsable: data.name || `${data.prenom || ''} ${data.nom || ''}`.trim(),
          fonction: data.function || enterprise.fonction,
          fonction_adherent: data.function || enterprise.fonction_adherent,
          ...(data.phone ? { telephone: data.phone } : {}),
          ...(data.email ? { email: data.email } : {})
        } : {})
      };
    } else {
      updatedEnterprise = { ...enterprise, ...data };
    }
    handleUpdateEnterprise(updatedEnterprise);
    showFeedback('success', buildDetailFeedbackMessage(editType, editMode));
    setIsEditModalOpen(false);
  };

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
    
    // 1. Direct fields from enterprise
    const prenom = ent.prenomContact || ent.prenom_adherent || ent.prenom_responsable || ent.prenom_dirigeant || ent.prenomRep || '';
    const nom = ent.nomContact || ent.nom_adherent || ent.nom_responsable || ent.nom_dirigeant || ent.nomRep || ent.dirigeant || ent.responsable || '';
    
    let fullName = '';
    if (prenom && nom) fullName = `${prenom} ${nom}`.trim();
    else if (nom) fullName = nom.trim();
    else if (prenom) fullName = prenom.trim();
    
    let fonction = ent.fonction || ent.fonction_adherent || ent.fonction_responsable || ent.fonctionResponsable || ent.poste || '';
    let phone = ent.mobileContact || ent.telephoneSecondaire || ent.telephone_secondaire || ent.telephone || '';
    let email = ent.emailContact || ent.email_principal || ent.email || '';

    // 2. Primary contact fallback from contacts list
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

  const renderContent = () => {
    switch (activeTab) {
      case 'Informations générales': {
        const fiscalVal = getFiscalId(enterprise);
        const respVal = getResponsableInfo(enterprise);
        const customAttrs = enterprise.custom_attributes || {};
        const extraEntries = Object.entries(customAttrs).filter(([k, v]) => {
          return v && String(v).trim() !== '';
        });

        return (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
              <div>
                <h3 className="text-2xl md:text-3xl font-serif font-black text-[#132e15]">Informations générales</h3>
                <p className="text-xs text-gray-500 font-semibold mt-1">Données d'enregistrement, coordonnées et attributs importés</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsSummaryModalOpen(true)}
                  className="btn-gold"
                  title="Ouvrir la fiche technique imprimable"
                >
                  <FileText className="w-4 h-4" /> Fiche Technique (PDF)
                </button>
                <button 
                  onClick={() => handleEdit('Informations générales')}
                  className="btn-gold"
                >
                  <Pencil className="w-4 h-4" /> Modifier
                </button>
              </div>
            </div>

            {/* Main General Info Card */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#12210E]/10 shadow-[0_2px_20px_rgba(19,46,21,0.05)] space-y-4 text-[#132e15]">
              {[
                { label: "Date d'adhésion", value: enterprise.dateAdhesion || enterprise.date_adhesion || '' },
                { label: "Statut membre", value: enterprise.statutMembre || enterprise.statut_adhesion || '' },
                { label: "Raison sociale", value: enterprise.raisonSociale || enterprise.name || '' },
                { label: "Nom commercial", value: enterprise.nomCommercial || enterprise.nom_commercial || enterprise.name || '' },
                { label: "N° Membre CSCM", value: enterprise.memberNo || 'M001' },
                { label: "Type de membre", value: enterprise.typeMembre || enterprise.type_membre || 'Adhérent' },
                { label: "Forme Juridique", value: enterprise.formeJuridique || enterprise.forme_juridique || '' },
                { label: "Numéro RC", value: enterprise.numRC || enterprise.numero_rc || '' },
                { 
                  label: "ICE / NINEA", 
                  value: fiscalVal || 'Non disponible',
                  isFiscal: true
                },
                { 
                  label: "Responsable / Dirigeant", 
                  value: respVal.name || 'Non spécifié',
                  isResp: true
                },
                { 
                  label: "Fonction du Responsable", 
                  value: respVal.fonction || 'Non spécifié' 
                },
                { label: "Date création", value: enterprise.dateCreation || enterprise.date_creation || '' },
                { label: "Effectif", value: enterprise.effectif ? `${enterprise.effectif} personnes` : '' },
                { label: "Pays", value: enterprise.pays || '' },
                { label: "Ville", value: enterprise.ville || '' },
                { label: "Adresse complète", value: enterprise.adresse || enterprise.adresse_complete || '' },
                { label: "Code postal", value: enterprise.codePostal || enterprise.code_postal || '' },
                { label: "Téléphone principal", value: enterprise.telephone || enterprise.telephone_principale || '' },
                { label: "Téléphone secondaire", value: enterprise.telephoneSecondaire || enterprise.telephone_secondaire || '' },
                { label: "Email de contact", value: enterprise.email || enterprise.email_principal || '' },
                { label: "Site web officiel", value: enterprise.siteWeb || enterprise.site_web || '' },
                { label: "Description de l'activité", value: enterprise.description || enterprise.description_activite || '' },
                { label: "Secteur d'activité", value: enterprise.secteur || '' },
              ].map((item: any) => (
                <div key={item.label} className="flex flex-col sm:flex-row gap-1 sm:gap-4 border-b border-[#132e15]/5 pb-2.5 last:border-b-0 last:pb-0 text-left">
                  <span className="font-extrabold text-[#132e15] sm:min-w-[220px] shrink-0 text-xs sm:text-sm">{item.label} :</span>
                  {item.isFiscal ? (
                    <span className="font-mono font-bold text-amber-900 bg-amber-50/90 px-2.5 py-0.5 rounded-lg border border-amber-200/60 inline-block w-fit text-xs">
                      {item.value}
                    </span>
                  ) : item.isResp && item.value !== 'Non spécifié' ? (
                    <span className="font-bold text-[#132e15] bg-emerald-50/80 px-2.5 py-0.5 rounded-lg border border-emerald-200/60 inline-block w-fit text-xs">
                      {item.value}
                    </span>
                  ) : (
                    <span className="font-semibold text-[#132e15]/90 break-words text-xs sm:text-sm">{item.value || 'Non spécifié'}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Custom Excel Attributes Sub-Section */}
            {extraEntries.length > 0 && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#12210E]/10 shadow-[0_2px_20px_rgba(19,46,21,0.05)] space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Layers className="w-5 h-5 text-emerald-800" />
                  <h4 className="font-serif font-black text-lg text-[#132e15]">Données & Colonnes Importées du Fichier Excel</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                  {extraEntries.map(([k, v], idx) => (
                    <div key={idx} className="p-3 bg-gray-50/80 rounded-2xl border border-gray-100/90 text-left">
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
        );
      }
      case 'Fiche technique': {
        const fiscalVal = getFiscalId(enterprise);
        const respVal = getResponsableInfo(enterprise);
        const customAttrs = enterprise.custom_attributes || {};
        const extraEntries = Object.entries(customAttrs).filter(([k, v]) => v && String(v).trim() !== '');

        return (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-[#12210E]/10 shadow-[0_2px_20px_rgba(19,46,21,0.05)]">
              <div>
                <h3 className="text-2xl md:text-3xl font-serif font-black text-[#132e15]">Fiche Technique Officielle</h3>
                <p className="text-xs text-gray-500 font-semibold mt-1">Dossier technique consolidé de l'entreprise (100% des données importées)</p>
              </div>
              <button 
                onClick={() => setIsSummaryModalOpen(true)}
                className="btn-gold flex items-center gap-2"
                title="Générer et télécharger la fiche technique au format PDF"
              >
                <Download className="w-4 h-4" /> Télécharger en PDF
              </button>
            </div>

            {/* 1. Identité légale */}
            <div className="bg-white p-6 rounded-3xl border border-[#12210E]/10 shadow-[0_2px_20px_rgba(19,46,21,0.05)] space-y-4 text-left">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Building2 className="w-5 h-5 text-emerald-800" />
                <h4 className="font-serif font-black text-lg text-[#132e15]">1. Identité Légale & Enregistrement</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-gray-400 block">Raison Sociale</span>
                  <span className="text-xs font-black text-[#132e15] block mt-0.5">{enterprise.raisonSociale || enterprise.name}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-gray-400 block">Nom Commercial</span>
                  <span className="text-xs font-bold text-[#132e15] block mt-0.5">{enterprise.nomCommercial || enterprise.nom_commercial || enterprise.name}</span>
                </div>
                <div className="p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-amber-800 block">ICE / NINEA</span>
                  <span className="text-xs font-mono font-black text-amber-900 block mt-0.5">{fiscalVal || 'Non disponible'}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-gray-400 block">N° Registre Commerce</span>
                  <span className="text-xs font-mono font-bold text-[#132e15] block mt-0.5">{enterprise.numRC || enterprise.numero_rc || 'Non spécifié'}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-gray-400 block">Forme Juridique</span>
                  <span className="text-xs font-bold text-[#132e15] block mt-0.5">{enterprise.formeJuridique || enterprise.forme_juridique || 'SARL'}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-gray-400 block">Statut / Type Membre</span>
                  <span className="text-xs font-bold text-[#132e15] block mt-0.5">{enterprise.statutMembre || enterprise.statut_adhesion || 'Actif'} ({enterprise.typeMembre || enterprise.type_membre || 'Adhérent'})</span>
                </div>
              </div>
            </div>

            {/* 2. Dirigeant & Responsable */}
            <div className="bg-white p-6 rounded-3xl border border-[#12210E]/10 shadow-[0_2px_20px_rgba(19,46,21,0.05)] space-y-4 text-left">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <UserCheck className="w-5 h-5 text-emerald-800" />
                <h4 className="font-serif font-black text-lg text-[#132e15]">2. Dirigeant & Responsables</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-gray-400 block">Nom & Prénom</span>
                  <span className="text-xs font-black text-[#132e15] block mt-0.5">{respVal.name || 'Non spécifié'}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-gray-400 block">Fonction / Titre</span>
                  <span className="text-xs font-bold text-[#132e15] block mt-0.5">{respVal.fonction || 'Dirigeant / Représentant'}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-gray-400 block">Téléphone direct</span>
                  <span className="text-xs font-mono font-bold text-[#132e15] block mt-0.5">{respVal.phone || enterprise.telephone || 'Non renseigné'}</span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-gray-400 block">Email direct</span>
                  <span className="text-xs font-mono font-bold text-[#132e15] block mt-0.5 break-all">{respVal.email || enterprise.email || 'Non renseigné'}</span>
                </div>
              </div>

              {/* Extra contacts list if available */}
              {(() => {
                const contacts = getEnterpriseContacts(enterprise);
                if (contacts.length > 1) {
                  return (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-2">Autres contacts enregistrés ({contacts.length - 1})</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {contacts.slice(1).map((c: any, cIdx: number) => (
                          <div key={cIdx} className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-between">
                            <div>
                              <span className="font-extrabold text-xs text-[#132e15] block">{c.name || `${c.prenom || ''} ${c.nom || ''}`.trim()}</span>
                              <span className="text-[10px] text-gray-500 font-bold block">{c.function || 'Contact'}</span>
                            </div>
                            <div className="text-[10px] font-semibold text-gray-600 mt-1.5 space-y-0.5">
                              {c.phone && <span className="block text-emerald-800 font-bold">Tél: {c.phone}</span>}
                              {c.email && <span className="block text-blue-700 font-bold break-all">Email: {c.email}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* 3. Métiers & Capacités */}
            <div className="bg-white p-6 rounded-3xl border border-[#12210E]/10 shadow-[0_2px_20px_rgba(19,46,21,0.05)] space-y-4 text-left">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Briefcase className="w-5 h-5 text-emerald-800" />
                <h4 className="font-serif font-black text-lg text-[#132e15]">3. Métiers, Expertises & Capacités de Production</h4>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-[9px] font-black uppercase text-gray-400 block">Secteur d'activité</span>
                    <span className="text-xs font-black text-[#132e15] block mt-0.5">{enterprise.secteur || 'Non renseigné'}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-[9px] font-black uppercase text-gray-400 block">Niveau d'expertise</span>
                    <span className="text-xs font-bold text-[#132e15] block mt-0.5">{enterprise.niveauExpertise || enterprise.niveau_expertise || 'Standard'}</span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-[9px] font-black uppercase text-gray-400 block">Description technique</span>
                  <p className="text-xs text-gray-700 italic mt-1 font-medium">"{enterprise.description || enterprise.description_activite || 'Conseil et accompagnement technique.'}"</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-[9px] font-black uppercase text-gray-400 block">Produits / Services</span>
                    <span className="text-xs font-medium text-[#132e15] block mt-0.5">{enterprise.produitsServices || enterprise.produits_services || 'Non spécifié'}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-[9px] font-black uppercase text-gray-400 block">Technologies</span>
                    <span className="text-xs font-medium text-[#132e15] block mt-0.5">{enterprise.technologies || enterprise.technologies_utilisees || 'Non spécifié'}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-[9px] font-black uppercase text-gray-400 block">Marchés cibles</span>
                    <span className="text-xs font-medium text-[#132e15] block mt-0.5">{enterprise.marchesCibles || enterprise.marches_cibles || 'Non spécifié'}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-[9px] font-black uppercase text-gray-400 block">Clients références</span>
                    <span className="text-xs font-medium text-[#132e15] block mt-0.5">{enterprise.clientsReferences || enterprise.clients_references || 'Non spécifié'}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-[9px] font-black uppercase text-gray-400 block">Capacité de production</span>
                    <span className="text-xs font-medium text-[#132e15] block mt-0.5">{enterprise.capaciteProduction || enterprise.capacite_production || 'Non spécifié'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Données Financières & Cotisations */}
            {(enterprise.chiffre_affaires_2023 || enterprise.chiffre_affaires_2024 || enterprise.cotisation_2023 || enterprise.cotisation_2024 || enterprise.cotisation_2025) && (
              <div className="bg-white p-6 rounded-3xl border border-[#12210E]/10 shadow-[0_2px_20px_rgba(19,46,21,0.05)] space-y-4 text-left">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <DollarSign className="w-5 h-5 text-emerald-800" />
                  <h4 className="font-serif font-black text-lg text-[#132e15]">4. Indicateurs Financiers & Cotisations</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {enterprise.chiffre_affaires_2024 && (
                    <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                      <span className="text-[9px] font-black uppercase text-blue-600 block">CA 2024</span>
                      <span className="text-xs font-black text-blue-900 mt-0.5 block">{Number(enterprise.chiffre_affaires_2024).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  )}
                  {enterprise.chiffre_affaires_2023 && (
                    <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                      <span className="text-[9px] font-black uppercase text-blue-600 block">CA 2023</span>
                      <span className="text-xs font-black text-blue-900 mt-0.5 block">{Number(enterprise.chiffre_affaires_2023).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  )}
                  {enterprise.cotisation_2024 && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                      <span className="text-[9px] font-black uppercase text-emerald-600 block">Cotisation 2024</span>
                      <span className="text-xs font-black text-emerald-900 mt-0.5 block">{Number(enterprise.cotisation_2024).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  )}
                  {enterprise.cotisation_2025 && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                      <span className="text-[9px] font-black uppercase text-emerald-600 block">Cotisation 2025</span>
                      <span className="text-xs font-black text-emerald-900 mt-0.5 block">{Number(enterprise.cotisation_2025).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. Attributs Excel Complémentaires */}
            {extraEntries.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-[#12210E]/10 shadow-[0_2px_20px_rgba(19,46,21,0.05)] space-y-4 text-left">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Layers className="w-5 h-5 text-emerald-800" />
                  <h4 className="font-serif font-black text-lg text-[#132e15]">5. Autres Attributs Importés du Fichier</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {extraEntries.map(([k, v], idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-xl">
                      <span className="text-[9px] font-black uppercase text-gray-400 block truncate" title={k}>
                        {k.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-bold text-[#132e15] mt-0.5 block break-words">
                        {String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }
      case 'Métiers & expertises':
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-8 max-w-2xl mx-auto">
              <h3 className="text-3xl font-serif font-black text-[#132e15]">Métiers & expertises</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleEdit('Métiers & expertises', 'edit')}
                  className="btn-gold"
                >
                  <Pencil className="w-4 h-4" /> Modifier
                </button>
              </div>
            </div>
            <div className="bg-white p-4 sm:p-8 rounded-3xl border border-[#12210E]/10 shadow-[0_2px_20px_rgba(19,46,21,0.05)] max-w-2xl mx-auto space-y-4 text-[#132e15]">
              {[
                { label: "Secteur d'activité", value: enterprise.secteur || '' },
                { label: "Expertise principale", value: enterprise.expertisePrincipale || enterprise.niveau_expertise || '' },
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
              <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                <button 
                  onClick={() => handleEdit('Certifications', 'add')}
                  className="btn-gold flex-1 sm:flex-initial"
                >
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
                <button 
                  onClick={() => handleEdit('Certifications', 'edit', selectedItemIndex)}
                  className="btn-gold flex-1 sm:flex-initial"
                >
                  <Pencil className="w-3.5 h-3.5" /> Modifier
                </button>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block table-wrap max-w-3xl mx-auto shadow-[0_2px_20px_rgba(19,46,21,0.05)]">
              <table className="data-table-bordered w-full">
                <thead>
                  <tr>
                    <th className="text-left min-w-[180px]">Certification(s)</th>
                    <th className="text-left">Code(s)</th>
                    <th className="text-left whitespace-nowrap">Date</th>
                    <th className="text-left">Organisme</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-[#132e15] font-semibold text-xs">
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
                                  className="btn-action-green shrink-0"
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
                                  className="btn-action-blue shrink-0"
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
                            className="btn-action-green shrink-0"
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
                            className="btn-action-blue shrink-0"
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
            <div key={`${year}-${idx}`} className="bg-white text-left border border-[#12210E]/10 rounded-3xl p-6 shadow-[0_2px_20px_rgba(19,46,21,0.05)] space-y-6">
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
          <div className="space-y-8 max-w-7xl mx-auto w-full pb-12 text-[#132e15]">
            {/* Header section with buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-[#12210E]/10 shadow-[0_2px_20px_rgba(19,46,21,0.05)]">
              <h3 className="text-2xl md:text-3xl font-serif font-black text-[#132e15]">Données Financières</h3>
              <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                <button 
                  onClick={() => handleEdit('Données financières', 'add')}
                  className="btn-gold flex-1 sm:flex-initial"
                >
                  <Plus className="w-4 h-4" /> Ajouter donnée
                </button>
                {unifiedFinancials.length > 0 && (
                  <button 
                    onClick={() => {
                      if (enterprise.financialData && enterprise.financialData.length > 0) {
                        handleEdit('Données financières', 'edit', enterprise.financialData.length - 1);
                      } else {
                        showFeedback('error', 'Seules les saisies manuelles peuvent être modifiées.');
                      }
                    }}
                    className="btn-gold flex-1 sm:flex-initial"
                  >
                    <Pencil className="w-4 h-4" /> Modifier dernière
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
              <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                <button 
                  onClick={() => handleEdit('Besoins', 'add')}
                  className="btn-gold flex-1 sm:flex-initial"
                >
                  <Plus className="w-4 h-4" /> Ajouter
                </button>
                <button 
                  onClick={() => handleEdit('Besoins', 'edit', selectedItemIndex)}
                  className="btn-gold flex-1 sm:flex-initial"
                >
                  <Pencil className="w-3.5 h-3.5" /> Modifier
                </button>
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block table-wrap max-w-3xl mx-auto shadow-[0_2px_20px_rgba(19,46,21,0.05)]">
              <table className="data-table-bordered w-full">
                <thead>
                  <tr>
                    <th className="text-left">Titre</th>
                    <th className="text-left">Type</th>
                    <th className="text-left">Budget</th>
                    <th className="text-left">Priorité</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-[#132e15] font-semibold text-xs">
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
      case 'Contacts': {
        const contactsList = getEnterpriseContacts(enterprise);

        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 max-w-7xl mx-auto w-full">
              <div>
                <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#132e15] text-left">Contacts & Dirigeants</h3>
                <p className="text-xs text-gray-500 font-semibold mt-1">Gérez les interlocuteurs, représentants légaux et contacts opérationnels de l'adhérent.</p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                <button 
                  onClick={() => handleEdit('Contacts', 'add')}
                  className="btn-gold flex-1 sm:flex-initial shadow-sm hover:scale-[1.02] transition-transform"
                >
                  <Plus className="w-4 h-4" /> Ajouter un contact
                </button>
                {contactsList.length > 0 && selectedItemIndex !== null && (
                  <button 
                    onClick={() => handleEdit('Contacts', 'edit', selectedItemIndex)}
                    className="btn-gold flex-1 sm:flex-initial shadow-sm"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Modifier
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden max-w-7xl mx-auto w-full rounded-2xl border border-[#12210E]/10 shadow-[0_2px_20px_rgba(19,46,21,0.05)] bg-white">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#132e15] text-white text-xs font-black uppercase tracking-wider">
                    <th className="border border-[#132e15]/20 p-3 text-left">Contact (Nom & Prénom)</th>
                    <th className="border border-[#132e15]/20 p-3 text-left">Prénom</th>
                    <th className="border border-[#132e15]/20 p-3 text-left">Nom</th>
                    <th className="border border-[#132e15]/20 p-3 text-left">Fonction</th>
                    <th className="border border-[#132e15]/20 p-3 text-left">Téléphone</th>
                    <th className="border border-[#132e15]/20 p-3 text-left">Email</th>
                    <th className="border border-[#132e15]/20 p-3 text-center">Statut</th>
                    <th className="border border-[#132e15]/20 p-3 text-center w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-[#132e15] font-semibold text-xs divide-y divide-[#132e15]/10">
                  {contactsList && contactsList.length > 0 ? (
                    contactsList.map((contact: any, i: number) => {
                      const isSelected = selectedItemIndex === i;
                      const isPrimary = contact.isPrimary === 'Oui';
                      return (
                        <tr 
                          key={i}
                          onClick={() => setSelectedItemIndex(i)}
                          className={`cursor-pointer transition-colors ${isSelected ? 'bg-[#132e15]/10 font-bold' : 'hover:bg-[#132e15]/5'}`}
                        >
                          <td className="border border-[#132e15]/15 p-3 h-12">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-[#132e15]/10 text-[#132e15] flex items-center justify-center font-black text-[11px] shrink-0 border border-[#132e15]/20">
                                {contact.prenom ? contact.prenom.charAt(0).toUpperCase() : (contact.nom ? contact.nom.charAt(0).toUpperCase() : 'C')}
                              </div>
                              <span className="font-extrabold text-[#132e15]">{contact.name || `${contact.prenom || ''} ${contact.nom || ''}`.trim() || '—'}</span>
                            </div>
                          </td>
                          <td className="border border-[#132e15]/15 p-3 h-12 text-gray-700">{contact.prenom || '—'}</td>
                          <td className="border border-[#132e15]/15 p-3 h-12 font-bold text-gray-900">{contact.nom || '—'}</td>
                          <td className="border border-[#132e15]/15 p-3 h-12 text-gray-700">{contact.function || '—'}</td>
                          <td className="border border-[#132e15]/15 p-3 h-12">
                            {contact.phone ? (
                              <a 
                                href={`tel:${contact.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 text-emerald-800 hover:text-emerald-950 font-bold hover:underline"
                              >
                                <Phone className="w-3 h-3 text-emerald-700" />
                                {contact.phone}
                              </a>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="border border-[#132e15]/15 p-3 h-12">
                            {contact.email ? (
                              <a 
                                href={`mailto:${contact.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-semibold hover:underline break-all"
                              >
                                <Mail className="w-3 h-3 text-blue-600 shrink-0" />
                                {contact.email}
                              </a>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="border border-[#132e15]/15 p-3 h-12 text-center">
                            {isPrimary ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#E6C657]/25 text-[#6B5416] border border-[#E6C657]/50">
                                Principal
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200">
                                Secondaire
                              </span>
                            )}
                          </td>
                          <td className="border border-[#132e15]/15 p-3 h-12 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleEdit('Contacts', 'edit', i)}
                                title="Modifier ce contact"
                                className="p-1.5 rounded-lg text-[#132e15] hover:bg-[#132e15]/10 transition-colors"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteContact(i)}
                                title="Supprimer ce contact"
                                className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-[#132e15]/60 italic font-bold">
                        Aucun contact enregistré
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-4 max-w-7xl mx-auto w-full">
              {contactsList && contactsList.length > 0 ? (
                contactsList.map((contact: any, i: number) => {
                  const isPrimary = contact.isPrimary === 'Oui';
                  return (
                    <div 
                      key={i}
                      onClick={() => setSelectedItemIndex(i)}
                      className={`p-4 rounded-2xl border text-left transition-all ${
                        selectedItemIndex === i 
                          ? 'border-[#132e15] bg-[#132e15]/10 shadow-sm' 
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0 flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#132e15]/10 text-[#132e15] flex items-center justify-center font-black text-xs shrink-0 border border-[#132e15]/20 mt-0.5">
                            {contact.prenom ? contact.prenom.charAt(0).toUpperCase() : (contact.nom ? contact.nom.charAt(0).toUpperCase() : 'C')}
                          </div>
                          <div>
                            <h4 className="font-black text-[#132e15] text-sm break-words">{contact.name || `${contact.prenom || ''} ${contact.nom || ''}`.trim()}</h4>
                            <p className="text-[11px] text-gray-500 font-bold uppercase mt-0.5">{contact.function || 'Contact'}</p>
                            {(contact.prenom || contact.nom) && (
                              <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                {contact.prenom && <span>Prénom : <b className="text-gray-700">{contact.prenom}</b> </span>}
                                {contact.nom && <span>| Nom : <b className="text-gray-700">{contact.nom}</b></span>}
                              </p>
                            )}
                          </div>
                        </div>
                        {isPrimary && (
                          <span className="bg-[#E6C657]/25 text-[#6B5416] border border-[#E6C657]/50 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0">
                            Principal
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-2 border-t border-[#132e15]/5 text-[11px] font-semibold text-gray-600">
                        <div>
                          <span className="text-gray-400 block font-bold uppercase tracking-wider text-[9px]">Téléphone</span>
                          {contact.phone ? (
                            <a href={`tel:${contact.phone}`} className="text-emerald-800 font-bold hover:underline inline-flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-emerald-700" />
                              {contact.phone}
                            </a>
                          ) : (
                            <span className="text-gray-400 font-normal">—</span>
                          )}
                        </div>
                        <div>
                          <span className="text-gray-400 block font-bold uppercase tracking-wider text-[9px]">Email</span>
                          {contact.email ? (
                            <a href={`mailto:${contact.email}`} className="text-blue-700 font-bold break-all hover:underline inline-flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-blue-600 shrink-0" />
                              {contact.email}
                            </a>
                          ) : (
                            <span className="text-gray-400 font-normal">—</span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit('Contacts', 'edit', i)}
                          className="px-3 py-1 text-xs font-bold text-[#132e15] bg-[#132e15]/10 hover:bg-[#132e15]/20 rounded-lg inline-flex items-center gap-1 transition-colors"
                        >
                          <Pencil className="w-3 h-3" /> Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteContact(i)}
                          className="px-3 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg inline-flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-white rounded-2xl border border-gray-150 text-[#132e15]/60 italic font-bold">
                  Aucun contact enregistré
                </div>
              )}
            </div>
          </div>
        );
      }
      case 'Cotisations': {
        const payments = getPaymentsList(enterprise);
        
        return (
          <div className="space-y-6 max-w-7xl mx-auto w-full pb-12 text-[#132e15]">
            {/* Header with action buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-[#12210E]/10 shadow-[0_2px_20px_rgba(19,46,21,0.05)]">
              <h3 className="text-2xl md:text-3xl font-serif font-black text-[#132e15]">Historique des cotisations</h3>
              <div className="flex gap-2 flex-wrap w-full sm:w-auto">
                <button 
                  onClick={() => handleEdit('Cotisations', 'add')}
                  className="btn-gold flex-1 sm:flex-initial"
                >
                  <Plus className="w-4 h-4" /> Ajouter Cotisation
                </button>
                <button 
                  onClick={() => {
                    if (selectedItemIndex === null) {
                      showFeedback('error', 'Sélectionnez une cotisation personnalisée à modifier.');
                    } else {
                      handleEdit('Cotisations', 'edit', selectedItemIndex);
                    }
                  }}
                  className="btn-gold flex-1 sm:flex-initial"
                  disabled={selectedItemIndex === null}
                >
                  <Pencil className="w-4 h-4" /> Modifier
                </button>
              </div>
            </div>

            {/* Currency conversion options & Total card matching Capture 1 */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white p-6 rounded-3xl border border-[#12210E]/10 shadow-[0_2px_20px_rgba(19,46,21,0.05)]">
              <div className="flex flex-col gap-1 text-left">
                <span className="field-label"><Coins /> Afficher les montants en</span>
                <select 
                  value={displayCurrency} 
                  onChange={(e) => setDisplayCurrency(e.target.value)}
                  className="field-select min-w-[220px]"
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
            <div className="hidden md:block table-wrap shadow-[0_2px_20px_rgba(19,46,21,0.05)]">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th className="font-serif">DATE</th>
                    <th className="font-serif">LIBELLÉ / MOTIF</th>
                    <th className="font-serif text-right">MONTANT ({displayCurrency})</th>
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

  if (!enterprise) {
    return (
      <SidebarLayout>
        <div className="flex items-center justify-center min-h-screen bg-[#FAF9F5]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#132e15]" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div key="enterprise-detail-wrapper" className="w-full min-h-full flex flex-col">
        {/* Header Section */}
        <div className="relative bg-gradient-to-br from-[#2E4D31] via-[#355a38] to-[#1A3D18] border-b border-[#ebd078]/20 overflow-hidden">
          {/* Decorative gold glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#ebd078]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-[#2E4D31]/30 blur-3xl" />

          <button onClick={() => navigate('/enterprises')} className="absolute top-4 left-4 md:top-6 md:left-6 z-10 inline-flex items-center justify-center p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-[#ebd078] transition-all duration-200 cursor-pointer active:scale-95 outline-none focus-visible:ring-4 focus-visible:ring-[#ebd078]/30" title="Retour">
            <ChevronLeft className="w-6 h-6 md:w-7 md:h-7" />
          </button>

          <div className="relative p-6 md:p-10">
            <div className="flex flex-col md:flex-row items-center md:items-center justify-center md:justify-start gap-5 md:gap-8 mt-8 md:mt-2 w-full max-w-7xl mx-auto w-full text-center md:text-left">
              <label 
                htmlFor={`upload-ent-logo-${enterprise.id}`}
                className="w-32 h-32 rounded-3xl ring-2 ring-[#ebd078]/40 ring-offset-2 ring-offset-[#2E4D31] flex items-center justify-center text-center p-2 text-xs font-black overflow-hidden bg-white text-black cursor-pointer relative group shadow-xl shadow-black/30 transition-all hover:ring-[#ebd078] shrink-0"
                title="Cliquer pour changer le logo de l'entreprise"
              >
                {enterprise.logo ? (
                  <img src={enterprise.logo} alt={enterprise.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-[#132e15] font-black leading-tight text-center">
                    LOGO<br/>
                    <span className="text-[10px] font-black text-[#132e15]/70 uppercase">Entreprise</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-[#12210E]/85 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[#ebd078] text-xs font-black flex-col gap-1">
                  <Pencil className="w-4 h-4" />
                  <span className="tracking-wide">Changer Logo</span>
                </div>
              </label>
              
              <input 
                type="file" 
                id={`upload-ent-logo-${enterprise.id}`}
                className="hidden" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const updated = { ...enterprise, logo: reader.result as string };
                      handleUpdateEnterprise(updated);
                      showFeedback('success', 'Logo de l’entreprise mis à jour.');
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <div className="flex-1 min-w-0">
                <h1 className="font-serif font-black text-2xl md:text-4xl text-white tracking-tight break-words">
                  {enterprise.raisonSociale || enterprise.name}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                  {enterprise.statutMembre && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#ebd078]/15 text-[#ebd078] border border-[#ebd078]/30">
                      {enterprise.statutMembre}
                    </span>
                  )}
                  {enterprise.secteur && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-white border border-white/20">
                      {enterprise.secteur}
                    </span>
                  )}
                  {enterprise.memberNo && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-white/80 border border-white/15">
                      N° {enterprise.memberNo}
                    </span>
                  )}
                  {(() => {
                    const fid = getFiscalId(enterprise);
                    if (!fid) return null;
                    return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black font-mono tracking-wider bg-amber-400/20 text-amber-200 border border-amber-300/30">
                        ICE / NINEA : {fid}
                      </span>
                    );
                  })()}
                  {(() => {
                    const resp = getResponsableInfo(enterprise);
                    if (!resp.name || resp.name === 'Non spécifié') return null;
                    return (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                        Dirigeant : {resp.name} {resp.fonction ? `(${resp.fonction})` : ''}
                      </span>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1.5 mt-4 text-sm text-white/80 font-semibold">
                  <p><span className="font-bold text-[#ebd078]/80">Date d'adhésion :</span> {enterprise.dateAdhesion || '—'}</p>
                  <p><span className="font-bold text-[#ebd078]/80">Secteur principal :</span> {enterprise.secteur || '—'}</p>
                  <p><span className="font-bold text-[#ebd078]/80">ICE / NINEA :</span> {getFiscalId(enterprise) || '—'}</p>
                  <p><span className="font-bold text-[#ebd078]/80">Responsable :</span> {getResponsableInfo(enterprise).name || '—'}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <button
                    onClick={() => setIsSummaryModalOpen(true)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#ebd078] hover:bg-[#dfbe5c] text-[#132e15] font-black text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
                    title="Générer et télécharger la Fiche Technique Officielle au format PDF"
                  >
                    <FileText className="w-4 h-4 text-[#132e15]" />
                    <span>Fiche Technique Officielle (PDF)</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('Fiche technique');
                      setSelectedItemIndex(null);
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-all border border-white/20 active:scale-95 cursor-pointer"
                    title="Consulter la fiche technique en ligne"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Voir la Fiche Technique</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Navigation Links / Buttons */}
          <div className="py-3 border-b border-cscm-green/10 bg-white/90 backdrop-blur-md sticky top-0 z-20 px-4 md:px-8">
            <div className="max-w-7xl mx-auto w-full tab-nav md:flex-wrap md:justify-center">
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
                    className={`tab-btn ${isActive ? 'tab-btn-active' : 'tab-btn-inactive'}`}
                    title={tab}
                  >
                    <IconComponent className="w-4 h-4 shrink-0" />
                    <span className="leading-none tracking-tight">{shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 md:p-8 bg-gradient-to-b from-[#f0f7ec] via-[#FAF9F5] to-[#f7f4e8] relative min-h-[60vh]">
            <FeedbackToast
              message={feedbackMessage}
              onDismiss={() => setFeedbackMessage(null)}
            />

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

      <EnterpriseSummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        enterprise={enterprise}
      />

      {/* Certification Document Preview Modal */}
      <ModalPortal>
      <AnimatePresence>
        {previewCert && (
          <div key="cert-preview-container" className="modal-overlay">
            <motion.div
              key="cert-preview-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              exit={{ opacity: 0 }}
              className="modal-backdrop"
              onClick={() => setPreviewCert(null)}
            />
            <motion.div
              key="cert-preview-body"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="modal-shell max-w-5xl max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-white/40 flex flex-wrap items-center justify-between gap-3 bg-white/40 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50/80 text-emerald-800 flex items-center justify-center border border-emerald-100/80 shrink-0">
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
                    className="btn-outline shrink-0"
                    title="Télécharger"
                  >
                    <Download className="w-4 h-4 text-emerald-800" />
                    <span>Télécharger</span>
                  </button>
                  <button
                    onClick={() => setPreviewCert(null)}
                    className="btn-icon shrink-0"
                    title="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-auto p-6 bg-white/20 flex items-center justify-center min-h-[450px]">
                {previewCert.fileData?.startsWith('data:image/') ? (
                  <div className="bg-white/80 backdrop-blur-sm p-3 rounded-2xl border border-white/60 shadow-sm max-w-full max-h-[70vh] overflow-auto flex items-center justify-center">
                    <img
                      src={previewBlobUrl || previewCert.fileData}
                      alt={previewCert.name}
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-[60vh] object-contain rounded-xl"
                    />
                  </div>
                ) : (previewCert.fileData?.startsWith('data:application/pdf') || previewCert.fileData?.includes('pdf') || previewCert.fileName?.toLowerCase().endsWith('.pdf')) ? (
                  <div className="w-full h-[65vh] bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-sm overflow-hidden flex flex-col">
                    <iframe
                      src={previewBlobUrl || previewCert.fileData}
                      title={previewCert.name}
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : (
                  <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-3xl border border-white/60 shadow-sm max-w-md space-y-4">
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
                      className="btn-cta"
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
      </ModalPortal>
    </SidebarLayout>
  );
};
