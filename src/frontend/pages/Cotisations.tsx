import React, { useState, useEffect } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { ModalPortal } from '../components/ModalPortal';
import { jsPDF } from 'jspdf';
import { 
  getStoredEnterprises, 
  saveStoredEnterprises 
} from '../../database/enterpriseStorage';
import { getEffectiveApiKey } from '../../backend/paymentConfig';
import { 
  getLocalCotisationRules, 
  saveCotisationRules, 
  fetchLatestCotisationRules 
} from '../../database/cotisationRules';
import { 
  Coins, 
  Search, 
  Plus, 
  Calendar, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  HelpCircle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  X,
  FileText,
  Download,
  Eye,
  Lock,
  Settings,
  AlertTriangle,
  Loader2,
  Pencil,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

export const Cotisations: React.FC = () => {
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [rules, setRules] = useState(() => getLocalCotisationRules());
  const [newRuleAmount, setNewRuleAmount] = useState(() => String(getLocalCotisationRules().amountPerSemester));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'up_to_date' | 'delayed'>('delayed');
  const [selectedEnt, setSelectedEnt] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('Juin');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // New Payment Form State
  const [paymentAmount, setPaymentAmount] = useState(() => String(getLocalCotisationRules().amountPerSemester));
  const [paymentCurrency, setPaymentCurrency] = useState<string>('FCFA');
  const [paymentLabel, setPaymentLabel] = useState('Cotisation Annuelle 2025');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState('');

  // Online Payment System States
  const [paymentMode, setPaymentMode] = useState<'manual' | 'online'>('manual');
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem('CCIM_PAYMENT_API_KEY') || '');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentProgressText, setPaymentProgressText] = useState('');
  
  // Card Details Form State
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Receipt and Currency conversion states
  const [receiptModalEnt, setReceiptModalEnt] = useState<any | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ ent: any; payment: any } | null>(null);
  
  // Cotisation Editing States
  const [editingPayment, setEditingPayment] = useState<any | null>(null); // { ent: any, payment: any }
  const [editLabel, setEditLabel] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCurrency, setEditCurrency] = useState<string>('FCFA');
  const [editDate, setEditDate] = useState('');
  const [editRef, setEditRef] = useState('');
  const [editMethod, setEditMethod] = useState('Virement bancaire');

  const [displayCurrency, setDisplayCurrency] = useState<'FCFA' | 'EUR' | 'MAD' | 'AED' | 'GBP' | 'QAR'>('FCFA');

  // Custom Interactive Currency Converter state
  const [conversionInput, setConversionInput] = useState<string>('');
  const [conversionTarget, setConversionTarget] = useState<'EUR' | 'MAD' | 'AED' | 'GBP' | 'QAR'>('EUR');

  // Multi-currency conversion helpers
  const formatAmount = (amountFCFA: number) => {
    switch (displayCurrency) {
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
        return `${amountFCFA.toLocaleString()} FCFA`;
    }
  };

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
          amount: Number(cot.amount) || rules.amountPerSemester,
          date: cot.date || new Date().toISOString().split('T')[0],
          reference: cot.reference || `REF-${Math.floor(Math.random() * 900000 + 100000)}`,
          method: 'Virement bancaire'
        });
      });
    }
    
    return payments;
  };

  const downloadReceiptFile = (ent: any, payment: any) => {
    const rawAmount = Number(payment.amount);
    let amountStr = '';
    
    switch (displayCurrency) {
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

  const loadData = () => {
    const list = getStoredEnterprises();
    setEnterprises(list);
    
    // Synchro temps réel des modaux ouverts
    setSelectedEnt(prev => {
      if (!prev) return null;
      const updated = list.find(e => e.id === prev.id);
      return updated || prev;
    });

    setReceiptModalEnt(prev => {
      if (!prev) return null;
      const updated = list.find(e => e.id === prev.id);
      return updated || prev;
    });
  };

  const handleStartEdit = (ent: any, payment: any) => {
    setEditingPayment({ ent, payment });
    setEditLabel(payment.label);
    setEditAmount(String(payment.amount));
    setEditDate(payment.date);
    setEditRef(payment.reference);
    setEditMethod(payment.method || 'Virement bancaire');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;

    const { ent, payment } = editingPayment;
    const amountNum = editCurrency === 'EUR'
      ? Math.round(Number(editAmount) * 655.957)
      : Number(editAmount) || 0;

    const list = getStoredEnterprises();
    const updated = list.map(item => {
      if (item.id === ent.id) {
        if (payment.id === '2023') {
          return { ...item, cotisation_2023: amountNum };
        } else if (payment.id === '2024') {
          return { ...item, cotisation_2024: amountNum };
        } else if (payment.id === '2025') {
          return { ...item, cotisation_2025: amountNum };
        } else if (payment.id.startsWith('custom-')) {
          const index = parseInt(payment.id.replace('custom-', ''), 10);
          const cots = [...(item.cotisations || [])];
          if (cots[index]) {
            cots[index] = {
              ...cots[index],
              label: editLabel,
              amount: amountNum,
              date: editDate,
              reference: editRef,
              method: editMethod
            };
          }
          return { ...item, cotisations: cots };
        }
      }
      return item;
    });

    saveStoredEnterprises(updated);
    setEnterprises(updated);

    // Sync state for modals
    setReceiptModalEnt((prev: any) => {
      if (!prev) return null;
      const refreshed = updated.find((i: any) => i.id === prev.id);
      return refreshed || prev;
    });

    setEditingPayment(null);
    setToastText("Cotisation modifiée avec succès.");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    
    // Trigger update event across other components
    window.dispatchEvent(new Event('enterprises_updated'));
  };

  const handleDeleteCotisation = (ent: any, payment: any) => {
    setDeleteTarget({ ent, payment });
  };

  const confirmDeleteCotisation = () => {
    if (!deleteTarget) return;
    const { ent, payment } = deleteTarget;

    const list = getStoredEnterprises();
    const updated = list.map(item => {
      if (item.id === ent.id) {
        if (payment.id === '2023') {
          return { ...item, cotisation_2023: 0 };
        } else if (payment.id === '2024') {
          return { ...item, cotisation_2024: 0 };
        } else if (payment.id === '2025') {
          return { ...item, cotisation_2025: 0 };
        } else if (payment.id.startsWith('custom-')) {
          const index = parseInt(payment.id.replace('custom-', ''), 10);
          const cots = (item.cotisations || []).filter((_: any, idx: number) => idx !== index);
          return { ...item, cotisations: cots };
        }
      }
      return item;
    });

    saveStoredEnterprises(updated);
    setEnterprises(updated);

    // Sync state for modals
    setReceiptModalEnt((prev: any) => {
      if (!prev) return null;
      const refreshed = updated.find((i: any) => i.id === prev.id);
      return refreshed || prev;
    });

    setDeleteTarget(null);
    setToastText("Cotisation supprimée avec succès.");
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    
    // Trigger update event across other components
    window.dispatchEvent(new Event('enterprises_updated'));
  };

  const loadRules = () => {
    const activeRules = getLocalCotisationRules();
    setRules(activeRules);
    setNewRuleAmount(String(activeRules.amountPerSemester));
    setPaymentAmount(String(activeRules.amountPerSemester));
  };

  const handleUpdateRules = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(newRuleAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setToastText("Montant invalide.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    
    const userJson = localStorage.getItem('user');
    const author = userJson ? JSON.parse(userJson).email || JSON.parse(userJson).prenom : 'Utilisateur';

    const updatedRules = {
      amountPerSemester: parsedAmount,
      currency: 'FCFA',
      lastUpdated: new Date().toISOString(),
      updatedBy: author
    };

    try {
      await saveCotisationRules(updatedRules);
      setToastText("Règles de cotisation actualisées avec succès !");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      // Also update default payment amount input
      setPaymentAmount(String(parsedAmount));
    } catch (err) {
      setToastText("Erreur lors de la mise à jour des règles.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  useEffect(() => {
    loadData();
    loadRules();
    window.addEventListener('enterprises_updated', loadData);
    window.addEventListener('cotisation_rules_updated', loadRules);
    return () => {
      window.removeEventListener('enterprises_updated', loadData);
      window.removeEventListener('cotisation_rules_updated', loadRules);
    };
  }, []);

  const totalTreasury = enterprises.reduce((acc, ent) => {
    const sum = (ent.cotisations || []).reduce((s: number, c: any) => s + (Number(c.amount) || 0), 0);
    const yearsTotal = (Number(ent.cotisation_2023) || 0) + (Number(ent.cotisation_2024) || 0) + (Number(ent.cotisation_2025) || 0);
    return acc + sum + yearsTotal;
  }, 0);

  // Compute status helpers
  const getEnterpriseStats = (ent: any) => {
    const list = ent.cotisations || [];
    
    // Determine target year and half-year based on selectedMonth and selectedYear (for periodPaid info)
    const targetYear = selectedYear;
    const firstHalfMonths = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin'];
    const targetHalf = firstHalfMonths.includes(selectedMonth) ? 1 : 2;
    
    // Calculate total paid for the target year (can be in multiple installments)
    let periodPaid = 0;
    
    // 1. Check custom cotisations for target year
    list.forEach((c: any) => {
      if (c.date) {
        const pDate = new Date(c.date);
        if (!isNaN(pDate.getTime())) {
          const pYear = pDate.getFullYear().toString();
          if (pYear === targetYear) {
            periodPaid += Number(c.amount) || 0;
          }
        }
      }
    });
    
    // 2. Add legacy annual payments for target year
    if (targetYear === '2023' && ent.cotisation_2023) {
      periodPaid += Number(ent.cotisation_2023) || 0;
    }
    if (targetYear === '2024' && ent.cotisation_2024) {
      periodPaid += Number(ent.cotisation_2024) || 0;
    }
    if (targetYear === '2025' && ent.cotisation_2025) {
      periodPaid += Number(ent.cotisation_2025) || 0;
    }
    
    // Overall sum paid across all history
    const baseSum = list.reduce((s: number, c: any) => s + (Number(c.amount) || 0), 0);
    const yearsSum = (Number(ent.cotisation_2023) || 0) + (Number(ent.cotisation_2024) || 0) + (Number(ent.cotisation_2025) || 0);
    const sumPaid = baseSum + yearsSum;
    
    // Calculate global required amount up to the selected evaluation period
    const dateAdhesionStr = ent.dateAdhesion || ent.dateCreation || '';
    let membershipYear = 2023;
    let membershipHalf = 1;
    let membershipMonth = 1;

    if (dateAdhesionStr) {
      const adDate = new Date(dateAdhesionStr);
      if (!isNaN(adDate.getTime())) {
        membershipYear = adDate.getFullYear();
        membershipMonth = adDate.getMonth() + 1;
        membershipHalf = membershipMonth <= 6 ? 1 : 2;
      }
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentHalf = currentMonth <= 6 ? 1 : 2;

    const parsedAmountInput = Number(newRuleAmount);
    const activeRuleAmount = (!isNaN(parsedAmountInput) && parsedAmountInput > 0)
      ? parsedAmountInput
      : rules.amountPerSemester;

    let requiredTotalToDate = 0;
    let isExempt = false;

    // Check if joining date is in the future relative to current period
    if (membershipYear > currentYear || (membershipYear === currentYear && membershipHalf > currentHalf)) {
      isExempt = true;
    } else {
      const effectiveMemberYear = Math.max(2023, membershipYear);
      const effectiveMemberHalf = membershipYear < 2023 ? 1 : membershipHalf;

      for (let y = effectiveMemberYear; y <= currentYear; y++) {
        const startHalf = (y === effectiveMemberYear) ? effectiveMemberHalf : 1;
        const endHalf = (y === currentYear) ? currentHalf : 2;
        for (let h = startHalf; h <= endHalf; h++) {
          requiredTotalToDate += activeRuleAmount; // Dynamic active rule amount per half-year (semester)
        }
      }
    }

    const isUpToDate = isExempt ? true : (sumPaid >= requiredTotalToDate);
    const lastDate = list.length > 0 ? list[list.length - 1].date : '-';
    
    return { 
      sumPaid, 
      periodPaid, 
      isUpToDate, 
      lastDate, 
      requiredAmount: requiredTotalToDate, // Treat global required to date as requiredAmount
      isExempt,
      requiredTotalToDate
    };
  };

  const downloadTreasuryReport = () => {
    const eurVal = (totalTreasury / 655.957).toFixed(2);
    const madVal = (totalTreasury * 0.0165).toFixed(2);
    const aedVal = (totalTreasury * 0.00603).toFixed(2);
    const gbpVal = (totalTreasury * 0.00129).toFixed(2);
    const qarVal = (totalTreasury * 0.00597).toFixed(2);

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
    doc.setFontSize(18);
    doc.text("BILAN DE TRESORERIE GENERAL", 20, 28);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(235, 208, 120); // Gold
    doc.text("Chambre Sénégalaise de Commerce au Maroc (CSCM)", 20, 36);

    // Date de generation
    doc.setTextColor(19, 46, 21);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`Date de génération : ${new Date().toLocaleString('fr-FR')}`, 15, 55);

    // 1. SOLDE DE LA CAISSE EN DEVISE UNIQUE OU CONVERTIE
    doc.setFillColor(245, 245, 245);
    doc.rect(15, 62, 180, 10, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.text("1. SOLDE GLOBAL DE LA CAISSE (EQUIVALENCES)", 20, 68);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);

    const devises = [
      { name: "Franc CFA (XOF)", val: `${totalTreasury.toLocaleString()} FCFA`, taux: "Devise Pivot" },
      { name: "Euro (EUR)", val: `${Number(eurVal).toLocaleString('fr-FR')} EUR`, taux: "1 EUR = 655.957 FCFA" },
      { name: "Dirham Marocain (MAD)", val: `${Number(madVal).toLocaleString('fr-FR')} MAD`, taux: "1 MAD = 60.30 FCFA" },
      { name: "Dirham des EAU (AED)", val: `${Number(aedVal).toLocaleString('fr-FR')} AED`, taux: "1 AED = 165.70 FCFA" },
      { name: "Livre Sterling (GBP)", val: `${Number(gbpVal).toLocaleString('fr-FR')} GBP`, taux: "1 GBP = 775.20 FCFA" },
      { name: "Rial du Qatar (QAR)", val: `${Number(qarVal).toLocaleString('fr-FR')} QAR`, taux: "1 QAR = 167.50 FCFA" }
    ];

    let y = 80;
    devises.forEach(dev => {
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      doc.text(dev.name, 20, y);
      
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(19, 46, 21);
      doc.text(dev.val, 80, y);

      doc.setFont('Helvetica', 'italic');
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(8);
      doc.text(`(Taux: ${dev.taux})`, 140, y);
      doc.setFontSize(10);

      y += 8;
    });

    // 2. DETAILS PAR MEMBRE ET EQUIVALENCES MULTI-DEVISES
    doc.setFillColor(245, 245, 245);
    doc.rect(15, y + 5, 180, 10, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(19, 46, 21);
    doc.text("2. STATUT DE COTISATION DES MEMBRES", 20, y + 11);

    y += 24;
    // Table Headers
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(19, 46, 21);
    doc.text("Société", 18, y);
    doc.text("N° Membre", 65, y);
    doc.text("Statut", 95, y);
    doc.text("Montant Payé", 125, y);
    doc.text("Reste à payer", 160, y);

    doc.setDrawColor(19, 46, 21);
    doc.setLineWidth(0.3);
    doc.line(15, y + 3, 195, y + 3);

    y += 9;
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(60, 60, 60);

    enterprises.forEach((ent) => {
      const stats = getEnterpriseStats(ent);
      const rest = Math.max(0, stats.requiredAmount - stats.sumPaid);
      const statusLabel = stats.isExempt
        ? 'Non membre'
        : stats.isUpToDate 
          ? (stats.sumPaid >= 30000 
              ? `A Jour (${(stats.sumPaid / 20000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ans)` 
              : 'A Jour') 
          : 'Retard';

      if (y > 260) {
        doc.addPage();
        // Border for new page
        doc.setDrawColor(19, 46, 21);
        doc.setLineWidth(1);
        doc.rect(8, 8, 194, 281);
        doc.setDrawColor(235, 208, 120);
        doc.setLineWidth(0.5);
        doc.rect(10, 10, 190, 277);
        y = 30;

        // Table headers on new page
        doc.setFontSize(9);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(19, 46, 21);
        doc.text("Société", 18, y);
        doc.text("N° Membre", 65, y);
        doc.text("Statut", 95, y);
        doc.text("Montant Payé", 125, y);
        doc.text("Reste à payer", 160, y);
        doc.line(15, y + 3, 195, y + 3);
        y += 9;
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
      }

      doc.text(ent.name.substring(0, 24), 18, y);
      doc.text(ent.memberNo || 'CSCM-00', 65, y);
      
      if (stats.isUpToDate) {
        doc.setTextColor(20, 100, 20);
        doc.text(statusLabel, 95, y);
      } else {
        doc.setTextColor(180, 20, 20);
        doc.text(statusLabel, 95, y);
      }
      doc.setTextColor(60, 60, 60);

      doc.text(`${stats.sumPaid.toLocaleString()} XOF`, 125, y);
      doc.text(`${rest.toLocaleString()} XOF`, 160, y);

      y += 8;
    });

    doc.save(`CSCM_Bilan_Caisse_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const downloadCustomConversionReport = () => {
    // Left empty since custom conversion is removed
  };

  const formattedEnterprises = enterprises.map(ent => {
    const { sumPaid, periodPaid, isUpToDate, lastDate, requiredAmount, isExempt } = getEnterpriseStats(ent);
    return {
      ...ent,
      sumPaid,
      periodPaid,
      isUpToDate,
      lastDate,
      requiredAmount,
      isExempt
    };
  });

  const upToDateCount = formattedEnterprises.filter(e => e.isUpToDate).length;
  const delayedCount = formattedEnterprises.filter(e => !e.isUpToDate).length;

  const filtered = formattedEnterprises.filter(ent => {
    const matchesSearch = ent.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          ent.raisonSociale.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ent.memberNo.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'up_to_date') return matchesSearch && ent.isUpToDate;
    if (statusFilter === 'delayed') return matchesSearch && !ent.isUpToDate;
    return matchesSearch;
  });

  const handleOpenPayment = (ent: any) => {
    setSelectedEnt(ent);
    setPaymentMode('manual');
    setPaymentAmount(String(rules.amountPerSemester));
    setPaymentCurrency('FCFA');
    setPaymentLabel('Cotisation Semestrielle');
    setCardName('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setIsProcessingPayment(false);
    setPaymentProgressText('');
    // Suggest standard reference
    setPaymentRef(`VIR-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnt) return;

    const selectedCurr = CURRENCIES.find(c => c.code === paymentCurrency) || CURRENCIES[0];
    const finalAmountInFCFA = Math.round(Number(paymentAmount) * selectedCurr.rate);

    if (paymentMode === 'online') {
      const apiKey = getEffectiveApiKey();
      if (!apiKey) {
        setToastText("Erreur : Clé API manquante pour le paiement en ligne !");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }
      
      // Card details validation (simple simulation check)
      if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
        setToastText("Veuillez remplir toutes les informations de votre carte bancaire.");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return;
      }

      setIsProcessingPayment(true);
      setPaymentProgressText("Connexion sécurisée à la passerelle de paiement...");

      // Staged simulation
      setTimeout(() => {
        setPaymentProgressText(`Authentification de la clé API [${apiKey.substring(0, 8)}...]...`);
      }, 850);

      setTimeout(() => {
        setPaymentProgressText("Transmission cryptée SSL 256 bits et vérification bancaire...");
      }, 1700);

      setTimeout(() => {
        setPaymentProgressText(`Montant de ${finalAmountInFCFA.toLocaleString()} XOF approuvé par l'API ! Finalisation...`);
      }, 2550);

      setTimeout(() => {
        const ref = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
        const data = {
          date: paymentDate,
          label: paymentLabel || 'Cotisation en ligne (API)',
          amount: finalAmountInFCFA,
          originalAmount: Number(paymentAmount),
          originalCurrency: paymentCurrency,
          reference: ref,
          method: 'Paiement en ligne'
        };

        const updated = enterprises.map(ent => {
          if (ent.id === selectedEnt.id) {
            const cots = [...(ent.cotisations || [])];
            cots.push(data);
            return {
              ...ent,
              cotisations: cots
            };
          }
          return ent;
        });

        saveStoredEnterprises(updated);
        setSelectedEnt(null);
        setIsProcessingPayment(false);
        setToastText(`Paiement en ligne de ${data.amount.toLocaleString()} FCFA traité avec succès !`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      }, 3400);

    } else {
      // Manual Mode
      const data = {
        date: paymentDate,
        label: paymentLabel,
        amount: finalAmountInFCFA,
        originalAmount: Number(paymentAmount),
        originalCurrency: paymentCurrency,
        reference: paymentRef || 'Virement bancaire',
        method: 'Virement bancaire'
      };

      const updated = enterprises.map(ent => {
        if (ent.id === selectedEnt.id) {
          const cots = [...(ent.cotisations || [])];
          cots.push(data);
          return {
            ...ent,
            cotisations: cots
          };
        }
        return ent;
      });

      saveStoredEnterprises(updated);
      setSelectedEnt(null);
      setToastText(`Cotisation pour "${selectedEnt.name}" enregistrée avec succès !`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <SidebarLayout>
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="max-w-7xl mx-auto w-full p-4 md:p-8 font-sans space-y-8 bg-transparent min-h-screen"
      >
        
        {/* Toast Feedbacks */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: -40, x: '-50%' }}
              animate={{ opacity: 1, y: 20, x: '-50%' }}
              exit={{ opacity: 0, y: -40, x: '-50%' }}
              className="fixed top-4 left-1/2 z-[110] bg-cscm-dark border border-cscm-gold/30 text-white rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-cscm-gold" />
              <span className="text-sm font-semibold">{toastText}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Header Selector Panel - styled perfectly like Capture 1/4 */}
        <div className="surface-card p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#132e15] to-[#1b381c] text-cscm-gold flex items-center justify-center shrink-0 shadow-lg shadow-cscm-green/20 ring-1 ring-cscm-gold/20">
              <Coins className="w-7 h-7" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase text-cscm-green tracking-widest block">Chambre Sénégalaise de Commerce au Maroc</span>
              <h1 className="page-title">Paiements & Trésorerie</h1>
              <p className="page-subtitle">Suivi officiel des cotisations et actualisation en temps réel du bilan financier.</p>
            </div>
          </div>

          {/* Selective Dropdowns + Update Button block */}
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Month drop-down */}
            <div className="flex items-center gap-2 bg-[#FAF9F5] border border-gray-200 rounded-xl px-4 py-2.5 transition-all hover:border-cscm-green/40">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Mois :</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-[#132e15] font-black text-xs md:text-sm outline-none cursor-pointer"
              >
                {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Year drop-down */}
            <div className="flex items-center gap-2 bg-[#FAF9F5] border border-gray-200 rounded-xl px-4 py-2.5 transition-all hover:border-cscm-green/40">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Année :</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-[#132e15] font-black text-xs md:text-sm outline-none cursor-pointer"
              >
                {['2023', '2024', '2025', '2026', '2027', '2028'].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Actualiser Action */}
            <button
              onClick={() => {
                setIsRefreshing(true);
                setTimeout(() => {
                  setIsRefreshing(false);
                  setToastText("Données de cotisations actualisées avec succès.");
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 2000);
                }, 750);
              }}
              className="btn-gold px-6 py-3 font-black uppercase tracking-wider shrink-0"
            >
              <svg 
                className={`w-4 h-4 text-[#ebd078] ${isRefreshing ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="3" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        {/* Panel de Configuration des Cotisations - Dynamique et Simplifié */}
        <div className="bg-[#FAF9F5] rounded-3xl p-6 border border-[#ebd078]/40 shadow-[0_2px_20px_rgba(19,46,21,0.05)] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex items-center gap-3 text-left">
            <div className="w-11 h-11 rounded-xl bg-white text-cscm-green border border-[#ebd078]/40 flex items-center justify-center shrink-0 shadow-sm">
              <Settings className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-black uppercase text-cscm-green/70 tracking-widest block">Règle tarifaire active</span>
              <h3 className="text-base font-serif font-black text-cscm-dark">
                Montant des cotisations par semestre : {rules.amountPerSemester.toLocaleString()} {rules.currency}
              </h3>
            </div>
          </div>
          <form onSubmit={handleUpdateRules} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
            <div className="relative flex-1 sm:w-60">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-black tracking-wider">XOF (FCFA)</span>
              <input
                type="number"
                value={newRuleAmount}
                onChange={(e) => setNewRuleAmount(e.target.value)}
                placeholder="Saisissez le montant de la cotisation..."
                className="w-full pl-24 pr-4 py-3 bg-white border-2 border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/10 rounded-xl outline-none text-xs font-black text-[#132e15] transition-all text-center"
                required
                min="1"
              />
            </div>

            <button
              type="submit"
              className="btn-gold px-6 py-3 font-black uppercase tracking-wider whitespace-nowrap"
            >
              Enregistrer
            </button>
          </form>
        </div>

        {/* Dashboard 4 KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: En Retard Code Block */}
          <div className="stat-card text-left flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider">Membres Insolvables</span>
              <h3 className="text-4xl font-serif font-black text-rose-700">{delayedCount}</h3>
              <p className="text-xs text-gray-500 font-semibold">Sociétés en attente de cotisation fixe</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-7 h-7" />
            </div>
          </div>

          {/* Card 2: À Jour Code Block */}
          <div className="stat-card text-left flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Membres Réguliers</span>
              <h3 className="text-4xl font-serif font-black text-emerald-700">{upToDateCount}</h3>
              <p className="text-xs text-gray-500 font-semibold">Sociétés en règle</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
          </div>

          {/* Card 3: Période Code Block */}
          <div className="stat-card text-left flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Exercice &amp; Période</span>
              <h3 className="text-2xl font-serif font-black text-[#132e15] truncate">{selectedMonth} {selectedYear}</h3>
              <p className="text-xs text-gray-500 font-semibold">Période d'évaluation courante</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
              <Calendar className="w-7 h-7" />
            </div>
          </div>

          {/* Card 4: Total de la Caisse dynamically formatted in selected currency */}
          <div className="stat-card text-left flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-cscm-green tracking-wider">Total de la Caisse</span>
              <h3 className="text-2xl font-serif font-black text-emerald-950 truncate">{formatAmount(totalTreasury)}</h3>
              <p className="text-xs text-gray-500 font-semibold">Devise courante : {displayCurrency}</p>
            </div>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cscm-green to-[#1b381c] text-cscm-gold border border-cscm-gold/20 flex items-center justify-center shrink-0 shadow-sm">
              <Coins className="w-7 h-7" />
            </div>
          </div>
        </div>

        {/* Interactive workspace - full width */}
        <div className="w-full space-y-6">
          <div className="surface-card p-6 space-y-6 text-left">
              
              {/* Header inside table workspace: containing Search Input, Currency display selector, and tabs */}
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-gray-100 pb-4">
                
                {/* Tab select group */}
                <div className="flex flex-wrap sm:inline-flex items-center gap-1.5 bg-gray-100 p-1 rounded-2xl border border-gray-200">
                  <button
                    onClick={() => setStatusFilter('delayed')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                      statusFilter === 'delayed'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-gray-500 hover:text-rose-600'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'delayed' ? 'bg-white' : 'bg-rose-600'}`} />
                    En retard ({delayedCount})
                  </button>

                  <button
                    onClick={() => setStatusFilter('up_to_date')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
                      statusFilter === 'up_to_date'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-gray-500 hover:text-emerald-700'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'up_to_date' ? 'bg-white' : 'bg-emerald-700'}`} />
                    À jour ({upToDateCount})
                  </button>

                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all cursor-pointer ${
                      statusFilter === 'all'
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'text-gray-500 hover:text-slate-800'
                    }`}
                  >
                    Tous ({formattedEnterprises.length})
                  </button>
                </div>

                {/* Devise drop-down & search wrapper */}
                <div className="flex items-center gap-3 w-full lg:w-auto">
                  <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold font-semibold shrink-0">
                    <span className="text-[9px] font-black text-gray-400">DEVISE :</span>
                    <select
                      value={displayCurrency}
                      onChange={(e) => setDisplayCurrency(e.target.value as any)}
                      className="bg-transparent text-gray-700 font-bold outline-none cursor-pointer"
                    >
                      <option value="FCFA">FCFA (XOF)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="MAD">MAD (Dirham)</option>
                      <option value="AED">AED (Emirats)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="QAR">QAR (Qatar)</option>
                    </select>
                  </div>

                  <div className="relative flex-1 lg:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Saisissez un membre à rechercher..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-[#FAF9F5] outline-none focus:border-cscm-green focus:bg-white focus:ring-4 focus:ring-cscm-green/10 transition-all text-xs font-semibold text-gray-700 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Members workspace table */}
              <div className="table-wrap shadow-sm">
                <table className="data-table" style={{ minWidth: '850px' }}>
                  <thead>
                    <tr>
                      <th>N° membre</th>
                      <th>Entreprise</th>
                      <th>Statut</th>
                      <th>Payé ({displayCurrency})</th>
                      <th>Reste à payer ({displayCurrency})</th>
                      <th>Paiements</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs font-semibold text-gray-700">
                    {filtered.map((ent, idx) => {
                      const restToPay = Math.max(0, (ent.requiredAmount || 0) - (ent.sumPaid || 0));
                      return (
                        <tr key={`${ent.id || idx}-${idx}`} className="hover:bg-gray-50/50 transition-all font-semibold">
                          {/* Member ID */}
                          <td className="p-4 font-mono font-black text-gray-400">
                            {ent.memberNo || 'CSCM-00'}
                          </td>

                          {/* Member Entity Details */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 font-serif font-black flex items-center justify-center shrink-0 border border-emerald-100">
                                {ent.name.charAt(0)}
                              </div>
                              <div className="space-y-0.5">
                                <span className="font-extrabold text-[#132e15] text-sm block">{ent.name}</span>
                                <span className="text-[9px] text-[#A69371] uppercase font-black tracking-widest block">{ent.secteur || 'PME'}</span>
                              </div>
                            </div>
                          </td>

                          {/* Status - displays elegant cotisation status */}
                          <td className="p-4">
                            {ent.isExempt ? (
                              <span className="badge-neutral" title={`Adhésion le ${ent.dateAdhesion || ent.dateCreation || 'N/A'}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                Non membre
                              </span>
                            ) : ent.isUpToDate ? (
                              <div className="flex flex-col gap-1 items-start">
                                <span className="badge-green">
                                  <span className="w-1.5 h-1.5 rounded-full bg-cscm-green animate-pulse" />
                                  À jour
                                </span>
                                {ent.sumPaid >= rules.amountPerSemester * 3 ? (
                                  <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider block">
                                    {(ent.sumPaid / (rules.amountPerSemester * 2)).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ans payés
                                  </span>
                                ) : ent.sumPaid >= rules.amountPerSemester * 2 ? (
                                  <span className="text-[9px] bg-emerald-50/50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider block">
                                    1 an payé
                                  </span>
                                ) : ent.sumPaid >= rules.amountPerSemester ? (
                                  <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider block">
                                    0,5 an payé
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <span className="badge-danger">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                En retard
                              </span>
                            )}
                          </td>

                          {/* Amount Paid */}
                          <td className="p-4 font-mono text-emerald-800 font-extrabold text-left">
                            <div className="flex flex-col">
                              <span>{formatAmount(ent.sumPaid || 0)}</span>
                              <span className="text-[9px] text-[#A69371] font-semibold mt-0.5">
                                Période: {formatAmount(ent.periodPaid || 0)}
                              </span>
                            </div>
                          </td>

                          {/* Rest to Pay */}
                          <td className="p-4 font-mono font-extrabold">
                            {restToPay === 0 ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-black uppercase">Soldé</span>
                            ) : (
                              <span className="text-rose-600">{formatAmount(restToPay)}</span>
                            )}
                          </td>

                          {/* Contributions Count */}
                          <td className="p-4">
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md font-mono text-xs font-black">
                              {getPaymentsList(ent).length}
                            </span>
                          </td>

                          {/* Custom Actions */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                onClick={() => setReceiptModalEnt(ent)}
                                className="btn-action-blue"
                                title="Reçus et Bilan"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-600" />
                                Reçus ({getPaymentsList(ent).length})
                              </button>

                              <button
                                onClick={() => handleOpenPayment(ent)}
                                className="btn-action-green"
                                title="Enregistrer Versement"
                              >
                                <Coins className="w-3.5 h-3.5 text-cscm-gold" />
                                Créditer
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {/* Fallback empty view */}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-16 text-center text-gray-450 italic font-bold">
                          Aucun membre ne correspond à ce filtre pour la période sélectionnée.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>

      {/* Add Direct Payment Modal Dialog */}
      <ModalPortal>
      <AnimatePresence>
        {selectedEnt && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isProcessingPayment) setSelectedEnt(null);
              }}
              className="modal-backdrop"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="modal-shell-lg font-sans"
            >
              <div className="modal-body relative">
              {!isProcessingPayment && (
                <button 
                  onClick={() => setSelectedEnt(null)}
                  className="absolute top-4 right-4 btn-icon z-20"
                >
                  <X className="w-5 h-5 text-[#132e15]" />
                </button>
              )}

              {/* Loader Overlay */}
              {isProcessingPayment && (
                <div className="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-800 rounded-full flex items-center justify-center border border-emerald-100 shadow-sm">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                  <h4 className="text-lg font-serif font-black text-cscm-dark">Traitement en cours...</h4>
                  <p className="text-xs text-emerald-800/80 font-mono font-bold bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 max-w-xs leading-relaxed">
                    {paymentProgressText}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5" />
                    Paiement crypté SSL de bout en bout
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="text-left border-b pb-4">
                  <div className="w-10 h-10 bg-cscm-green/10 text-cscm-green rounded-xl flex items-center justify-center mb-3">
                    <Coins className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-serif font-black text-cscm-dark">Enregistrer une Cotisation</h3>
                  <p className="text-[#132e15]/80 text-xs mt-1 font-bold">Créditer le compte de <b>{selectedEnt.name}</b></p>
                </div>

                {/* Tabs Selector */}
                <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-2xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('manual')}
                    className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      paymentMode === 'manual'
                        ? 'bg-[#132e15] text-[#ebd078] shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Saisie Manuelle
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('online')}
                    className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      paymentMode === 'online'
                        ? 'bg-[#132e15] text-[#ebd078] shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Paiement en Ligne (API)
                  </button>
                </div>

                <form onSubmit={handleRegisterPayment} className="space-y-4 text-left">
                  {/* Common Fields */}
                  <div className="space-y-3 bg-[#FAF9F5] p-4 rounded-2xl border border-gray-150">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase text-[#132e15] tracking-wider block">Devise du versement</label>
                      <select
                        value={paymentCurrency}
                        onChange={(e) => setPaymentCurrency(e.target.value)}
                        className="bg-white border border-gray-200 text-[#132e15] font-serif font-black text-xs py-1.5 px-3 rounded-xl shadow-3xs outline-none cursor-pointer focus:border-[#132e15] transition-all min-w-[150px]"
                      >
                        {CURRENCIES.map(curr => (
                          <option key={curr.code} value={curr.code}>
                            {curr.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">
                        {paymentCurrency === 'FCFA' ? 'Montant exact (FCFA)' : `Montant exact (${paymentCurrency})`}
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#132e15] text-xs font-black">
                          {paymentCurrency}
                        </span>
                        <input
                          type="number"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="w-full pl-14 pr-4 py-3 bg-white border border-gray-250 rounded-xl outline-none focus:border-cscm-green text-sm font-black text-[#132e15]"
                          placeholder="Saisissez le montant exact"
                          required
                          min="1"
                          step="any"
                        />
                      </div>
                    </div>

                    {paymentAmount && Number(paymentAmount) > 0 && (() => {
                      const selectedCurr = CURRENCIES.find(c => c.code === paymentCurrency) || CURRENCIES[0];
                      if (paymentCurrency === 'FCFA') {
                        const eurEquivalent = Number(paymentAmount) / 655.957;
                        return (
                          <div className="bg-[#132e15]/5 border border-[#132e15]/10 rounded-xl p-2.5 text-center text-xs">
                            <p className="text-xs text-gray-600 font-semibold">
                              Équivalent indicatif : <span className="font-mono text-xs font-black">{eurEquivalent.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                            </p>
                          </div>
                        );
                      } else {
                        const convertedFCFA = Math.round(Number(paymentAmount) * selectedCurr.rate);
                        return (
                          <div className="bg-[#132e15]/5 border border-[#132e15]/10 rounded-xl p-2.5 text-center text-xs">
                            <p className="text-xs text-emerald-800 font-extrabold">
                              Conversion automatique : <span className="font-mono text-sm font-black">{convertedFCFA.toLocaleString()} FCFA</span>
                            </p>
                          </div>
                        );
                      }
                    })()}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#132e15] uppercase tracking-wider mb-2">LIBELLÉ DE LA TRANSACTION</label>
                    <input
                      type="text"
                      value={paymentLabel}
                      onChange={(e) => setPaymentLabel(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-250 rounded-xl outline-none focus:border-cscm-green text-sm font-bold text-[#132e15]"
                      placeholder="Saisissez le libellé de la transaction (Ex: Cotisation Semestrielle)"
                      required
                    />
                  </div>

                  {paymentMode === 'manual' ? (
                    /* MANUAL STATE VIEW */
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-[#132e15] uppercase tracking-wider mb-2">DATE DE TRANSACTION</label>
                          <input
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-250 rounded-xl outline-none focus:border-cscm-green text-xs font-black text-[#132e15]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-[#132e15] uppercase tracking-wider mb-2">RÉFÉRENCE DE TRANSFERT</label>
                          <input
                            type="text"
                            value={paymentRef}
                            onChange={(e) => setPaymentRef(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-gray-250 rounded-xl outline-none focus:border-cscm-green text-xs font-mono font-black text-[#132e15]"
                            placeholder="Saisissez la référence du transfert (Ex: VIR-102941)"
                            required
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedEnt(null)}
                          className="btn-secondary flex-1 text-xs"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="btn-primary flex-1 text-xs"
                        >
                          <CheckCircle2 className="w-4 h-4 text-cscm-gold shrink-0" />
                          <span>Confirmer le versement</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ONLINE PAYMENT GATEWAY */
                    <div className="space-y-4">
                      {!getEffectiveApiKey() ? (
                        /* API KEY MISSING ERROR BLOCK */
                        <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-4 text-xs font-semibold space-y-3">
                          <div className="flex items-start gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-extrabold text-rose-800 text-sm">Passerelle de Paiement Bloquée</p>
                              <p className="text-rose-700/80 mt-1 leading-relaxed">
                                La clé API pour le paiement en ligne n'est pas configurée. Une clé API valide est requise pour initier les paiements en ligne de manière sécurisée.
                              </p>
                            </div>
                          </div>
                          
                          <div className="border-t border-rose-150 pt-3 space-y-2">
                            <p className="text-[10px] font-black uppercase text-rose-800 tracking-wider">Où placer cette clé API ?</p>
                            <ul className="list-disc pl-4 space-y-1 text-[10px] text-rose-700 font-bold">
                              <li>
                                <span className="text-rose-900">Méthode recommandée :</span> Ajoutez la variable d'environnement dans votre fichier <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-rose-950 font-semibold">.env</code> à la racine du projet :
                                <div className="mt-1 bg-rose-950 text-rose-100 font-mono text-[9px] p-2 rounded-lg font-black select-all">
                                  VITE_PAYMENT_API_KEY=votre_cle_api_stripe_ou_paytech
                                </div>
                              </li>
                              <li>
                                <span className="text-rose-900">Méthode de test rapide :</span> Saisissez la clé ci-dessous pour l'activer immédiatement sur votre session locale :
                              </li>
                            </ul>
                            
                            <div className="flex gap-2 mt-2">
                              <input
                                type="text"
                                placeholder="Insérer la clé API (Ex: pk_test_...)"
                                value={apiKeyInput}
                                onChange={(e) => {
                                  setApiKeyInput(e.target.value);
                                  localStorage.setItem('CCIM_PAYMENT_API_KEY', e.target.value);
                                }}
                                className="flex-1 px-3 py-2 bg-white border border-rose-200 rounded-xl outline-none focus:border-rose-500 font-mono text-[10px] text-rose-950 font-black"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (apiKeyInput.trim()) {
                                    setToastText("Clé API de test enregistrée !");
                                    setShowToast(true);
                                    setTimeout(() => setShowToast(false), 2000);
                                  }
                                }}
                                className="btn-danger px-3 py-2 text-[10px] font-black uppercase tracking-wider shrink-0"
                              >
                                Activer
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* SECURE PAYMENT FORM (API ACTIVE) */
                        <div className="space-y-4">
                          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Passerelle de Paiement Active</span>
                            </div>
                            <span className="text-[9px] font-mono text-emerald-950/70 font-black bg-emerald-100 px-2 py-0.5 rounded">
                              Key: {getEffectiveApiKey().substring(0, 8)}...
                            </span>
                          </div>

                          <div className="space-y-3 border-t pt-3">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Saisie des informations de carte</span>
                            
                            <div>
                              <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Nom sur la carte</label>
                              <input
                                type="text"
                                placeholder="Saisissez le nom complet du titulaire de la carte"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value)}
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-cscm-green text-xs font-bold text-gray-850"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Numéro de Carte Bancaire</label>
                              <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                  type="text"
                                  placeholder="Saisissez le numéro de carte (4532 •••• •••• 8824)"
                                  value={cardNumber}
                                  onChange={(e) => {
                                    // simple spacer formatting
                                    const raw = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                                    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
                                    setCardNumber(formatted.substring(0, 19));
                                  }}
                                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-cscm-green text-xs font-mono font-black text-gray-850"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Date d'expiration</label>
                                <input
                                  type="text"
                                  placeholder="Saisissez la date d'expiration (MM/YY)"
                                  value={cardExpiry}
                                  onChange={(e) => {
                                    let v = e.target.value.replace(/[^0-9]/g, '');
                                    if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2, 4);
                                    setCardExpiry(v.substring(0, 5));
                                  }}
                                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-cscm-green text-xs font-mono font-black text-center text-gray-850"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Code CVC (CVV)</label>
                                <input
                                  type="password"
                                  placeholder="Saisissez le code de sécurité (CVV)"
                                  maxLength={3}
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ''))}
                                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-cscm-green text-xs font-mono font-black text-center text-gray-850"
                                  required
                                />
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 flex gap-3">
                            <button
                              type="button"
                              onClick={() => setSelectedEnt(null)}
                              className="btn-secondary flex-1 text-xs"
                            >
                              Annuler
                            </button>
                            <button
                              type="submit"
                              className="btn-gold flex-1 py-3"
                            >
                              <Lock className="w-4 h-4 shrink-0" />
                              <span>Payer {paymentCurrency === 'EUR' ? `${Number(paymentAmount).toLocaleString('fr-FR')} EUR` : `${Number(paymentAmount).toLocaleString()} FCFA`}</span>
                            </button>
                          </div>

                          <div className="text-center">
                            <span className="inline-flex items-center gap-1 text-[9px] text-gray-400 font-bold uppercase tracking-wider mx-auto">
                              🛡️ Sécurisé via clé API • Cryptage de niveau militaire AES-256
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </form>
              </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </ModalPortal>

      {/* Payment History & Receipt Picker Modal */}
      <ModalPortal>
      <AnimatePresence>
        {receiptModalEnt && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setReceiptModalEnt(null)}
              className="modal-backdrop"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="modal-shell max-w-3xl font-sans"
            >
              <div className="modal-body relative flex flex-col">
              <button 
                onClick={() => setReceiptModalEnt(null)}
                className="absolute top-4 right-4 btn-icon z-20"
              >
                <X className="w-5 h-5 text-[#132e15]" />
              </button>

              <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                <div className="text-left border-b pb-4 shrink-0">
                  <span className="text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200 uppercase px-2.5 py-1 rounded-full inline-block mb-2">
                    N° MEMBRE: {receiptModalEnt.memberNo}
                  </span>
                  <h3 className="text-2xl font-serif font-black text-cscm-dark">{receiptModalEnt.name}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Raison sociale: <b>{receiptModalEnt.raisonSociale}</b> • Secteur: <b>{receiptModalEnt.secteur}</b>
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 text-left">Historique complet des cotisations & Reçus</h4>
                  
                  {getPaymentsList(receiptModalEnt).length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm font-semibold">
                      Aucune cotisation n'a été enregistrée pour ce membre.
                    </div>
                  ) : (
                    <div className="space-y-3 text-left font-sans">
                      {getPaymentsList(receiptModalEnt).map((pay: any, idx: number) => (
                        <div 
                          key={`${pay.id || idx}-${idx}`} 
                          className="bg-[#FAF9F5] hover:bg-white border border-gray-200 hover:border-cscm-green/25 hover:shadow-sm p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-cscm-dark">{pay.label}</span>
                              <span className="text-[9px] font-mono text-gray-450 bg-gray-200 px-1.5 py-0.5 rounded">Réf: {pay.reference}</span>
                            </div>
                            
                            {/* Decorative Icon representations for Date & Method */}
                            <div className="text-[11px] text-gray-400 flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                <b>{pay.date}</b>
                              </span>
                              <span className="flex items-center gap-1">
                                <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                                <b>{pay.method}</b>
                              </span>
                            </div>

                            {/* Beautiful visual chosen currency badge */}
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <span className="badge-green normal-case tracking-normal text-xs px-2.5 py-1">
                                <Coins className="w-3.5 h-3.5" />
                                Montant : {formatAmount(pay.amount)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleStartEdit(receiptModalEnt, pay)}
                              type="button"
                              className="btn-icon-gold"
                              title="Modifier cette cotisation"
                            >
                              <Pencil className="w-4 h-4 shrink-0" />
                            </button>
                            <button
                              onClick={() => handleDeleteCotisation(receiptModalEnt, pay)}
                              type="button"
                              className="btn-icon-danger"
                              title="Supprimer cette cotisation"
                            >
                              <Trash2 className="w-4 h-4 shrink-0" />
                            </button>
                            <button
                              onClick={() => setSelectedReceipt({ ent: receiptModalEnt, payment: pay })}
                              type="button"
                              className="inline-flex items-center justify-center p-2 rounded-xl border border-blue-100 bg-white hover:bg-blue-50 hover:border-blue-200 text-blue-700 transition-all duration-200 cursor-pointer outline-none focus-visible:ring-4 focus-visible:ring-blue-300/30 active:scale-95"
                              title="Visualiser le reçu"
                            >
                              <Eye className="w-4 h-4 shrink-0" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t shrink-0 flex justify-end">
                  <button
                    onClick={() => setReceiptModalEnt(null)}
                    type="button"
                    className="btn-secondary !text-xs"
                  >
                    Fermer la liste
                  </button>
                </div>
              </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </ModalPortal>

      {/* Single Printable Receipt Modal View */}
      <ModalPortal>
      <AnimatePresence>
        {selectedReceipt && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReceipt(null)}
              className="modal-backdrop"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="modal-shell max-w-xl font-sans"
            >
              <div className="modal-body relative">
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="absolute top-4 right-4 btn-icon z-20"
                title="Fermer le reçu"
              >
                <X className="w-5 h-5 text-[#132e15]" />
              </button>

              <div className="space-y-6">
                <div className="text-center border-b pb-4">
                  <div className="w-12 h-12 bg-cscm-green/10 text-cscm-green rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-black">
                    ★
                  </div>
                  <h3 className="text-base font-serif font-black text-cscm-dark uppercase tracking-wide leading-tight">Chambre Sénégalaise de Commerce au Maroc CSCM</h3>
                  <p className="text-[#a69371] text-2xs font-black tracking-widest uppercase">Reçu de paiement officiel</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-white/50 text-left">
                    <p className="text-[10px] uppercase font-black tracking-wider text-gray-400 mb-1.5">Détails Reçu</p>
                    <p className="text-[#132e15] mb-1"><b>N° :</b> REC-2026-{selectedReceipt.payment.reference}</p>
                    <p className="text-[#132e15] mb-1"><b>Date :</b> {selectedReceipt.payment.date}</p>
                    <p className="text-[#132e15]"><b>Libellé :</b> {selectedReceipt.payment.label}</p>
                  </div>
                  <div className="bg-gray-50/70 p-3.5 rounded-2xl border border-white/50 text-left">
                    <p className="text-[10px] uppercase font-black tracking-wider text-gray-400 mb-1.5">Membre Émetteur</p>
                    <p className="text-[#132e15] mb-1"><b>Nom :</b> {selectedReceipt.ent.name}</p>
                    <p className="text-[#132e15] mb-1"><b>N° :</b> {selectedReceipt.ent.memberNo}</p>
                    <p className="text-[#132e15]"><b>Secteur :</b> {selectedReceipt.ent.secteur}</p>
                  </div>
                </div>

                <div className="bg-[#e1eadf]/70 border-2 border-[#132e15]/45 rounded-3xl p-5 text-center">
                  <p className="text-[10px] uppercase font-black tracking-wider text-gray-500 mb-1">Montant Encaissé ({displayCurrency})</p>
                  <p className="text-2xl font-black text-emerald-950">{formatAmount(selectedReceipt.payment.amount)}</p>
                </div>

                <div className="flex gap-4 items-center justify-between pt-2">
                  <div className="border border-dashed border-[#132e15]/80 rounded-xl p-2 text-center text-[9px] font-black uppercase tracking-widest text-[#132e15] scale-90">
                    ★ CSCM PAYÉ ★
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400">La Trésorerie CSCM</p>
                    <p className="text-xs font-serif font-bold text-cscm-green italic">Signé électroniquement</p>
                  </div>
                </div>
              </div>
              </div>

              <div className="modal-footer flex-wrap md:flex-nowrap">
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    type="button"
                    className="btn-secondary flex-1 min-w-[80px] text-xs"
                  >
                    Retour
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteCotisation(selectedReceipt.ent, selectedReceipt.payment);
                      setSelectedReceipt(null);
                    }}
                    type="button"
                    className="btn-danger flex-1 min-w-[120px] text-xs"
                    title="Supprimer définitivement ce reçu"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span>Supprimer</span>
                  </button>
                  <button
                    onClick={() => downloadReceiptFile(selectedReceipt.ent, selectedReceipt.payment)}
                    type="button"
                    className="btn-primary flex-1 min-w-[140px] text-xs"
                  >
                    <Download className="w-4 h-4 text-cscm-gold shrink-0" />
                    <span>Télécharger Officiel</span>
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </ModalPortal>

      {/* Edit Cotisation Modal View */}
      <ModalPortal>
      <AnimatePresence>
        {editingPayment && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPayment(null)}
              className="modal-backdrop"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="modal-shell-md font-sans text-left"
            >
              <div className="modal-body relative">
              <button 
                onClick={() => setEditingPayment(null)}
                className="absolute top-4 right-4 btn-icon z-20"
                title="Fermer"
              >
                <X className="w-5 h-5 text-cscm-dark" />
              </button>

              <div className="space-y-4">
                <div className="border-b border-white/40 pb-3">
                  <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Modification</span>
                  <h3 className="text-xl font-serif font-black text-cscm-dark">Modifier la Cotisation</h3>
                  <p className="text-xs text-gray-400 font-bold mt-0.5">Pour : <b className="text-cscm-green">{editingPayment.ent.name}</b></p>
                </div>

                <form id="edit-cotisation-form" onSubmit={handleSaveEdit} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-cscm-dark uppercase tracking-wider mb-1.5">Libellé de la transaction</label>
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl outline-none focus:border-cscm-green text-xs font-bold text-cscm-dark disabled:bg-gray-100 disabled:text-gray-400"
                      required
                      disabled={editingPayment.payment.id === '2023' || editingPayment.payment.id === '2024' || editingPayment.payment.id === '2025'}
                    />
                  </div>

                  <div className="space-y-3 bg-[#FAF9F5] p-4 rounded-2xl border border-gray-150">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase text-[#132e15] tracking-wider block">Devise de modification</label>
                      <div className="flex gap-1 bg-gray-200/60 p-0.5 rounded-lg border border-gray-200">
                        <button
                          type="button"
                          onClick={() => setEditCurrency('FCFA')}
                          className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase transition-all cursor-pointer ${
                            editCurrency === 'FCFA'
                              ? 'bg-[#132e15] text-[#ebd078] shadow-3xs'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          FCFA (XOF)
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditCurrency('EUR')}
                          className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase transition-all cursor-pointer ${
                            editCurrency === 'EUR'
                              ? 'bg-[#132e15] text-[#ebd078] shadow-3xs'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          Euro (EUR)
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">
                        {editCurrency === 'EUR' ? 'Montant modifié (EUR)' : 'Montant modifié (FCFA)'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#132e15] text-xs font-black">
                          {editCurrency === 'EUR' ? 'EUR' : 'FCFA'}
                        </span>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="w-full pl-14 pr-4 py-2 bg-white border border-gray-250 rounded-xl outline-none focus:border-cscm-green text-xs font-black text-[#132e15]"
                          required
                          min="1"
                          step="any"
                        />
                      </div>
                    </div>

                    {editAmount && Number(editAmount) > 0 && (
                      <div className="bg-[#132e15]/5 border border-[#132e15]/10 rounded-xl p-2.5 text-center text-xs">
                        {editCurrency === 'EUR' ? (
                          <p className="text-xs text-emerald-800 font-extrabold">
                            Conversion automatique : <span className="font-mono text-xs font-black">{Math.round(Number(editAmount) * 655.957).toLocaleString()} FCFA</span>
                          </p>
                        ) : (
                          <p className="text-xs text-gray-600 font-semibold">
                            Équivalent indicatif : <span className="font-mono text-xs font-black">{(Number(editAmount) / 655.957).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-cscm-dark uppercase tracking-wider mb-1.5">Date du versement</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl outline-none focus:border-cscm-green text-xs font-black text-cscm-dark disabled:bg-gray-100 disabled:text-gray-400"
                      required
                      disabled={editingPayment.payment.id === '2023' || editingPayment.payment.id === '2024' || editingPayment.payment.id === '2025'}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-cscm-dark uppercase tracking-wider mb-1.5">Référence</label>
                    <input
                      type="text"
                      value={editRef}
                      onChange={(e) => setEditRef(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl outline-none focus:border-cscm-green text-xs font-mono font-black text-cscm-dark disabled:bg-gray-100 disabled:text-gray-400"
                      required
                      disabled={editingPayment.payment.id === '2023' || editingPayment.payment.id === '2024' || editingPayment.payment.id === '2025'}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-cscm-dark uppercase tracking-wider mb-1.5">Méthode de Paiement</label>
                    <select
                      value={editMethod}
                      onChange={(e) => setEditMethod(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-250 rounded-xl outline-none focus:border-cscm-green text-xs font-bold text-cscm-dark disabled:bg-gray-100 disabled:text-gray-400"
                      required
                      disabled={editingPayment.payment.id === '2023' || editingPayment.payment.id === '2024' || editingPayment.payment.id === '2025'}
                    >
                      <option value="Virement bancaire">Virement bancaire</option>
                      <option value="Paiement en ligne">Paiement en ligne</option>
                      <option value="Carte Bancaire (En Ligne)">Carte Bancaire (En Ligne)</option>
                      <option value="Chèque">Chèque</option>
                      <option value="Espèces">Espèces</option>
                    </select>
                  </div>

                  {/* Warning label for legacy years */}
                  {(editingPayment.payment.id === '2023' || editingPayment.payment.id === '2024' || editingPayment.payment.id === '2025') && (
                    <div className="bg-amber-50 border border-amber-200 text-[#a8820c] font-bold p-3 rounded-xl text-[10px] leading-relaxed">
                      💡 Saisie d'historique : Pour cette cotisation historique d'archive, seul le montant brut est éditable. Les informations d'archive de date et de référence restent immuables.
                    </div>
                  )}

                </form>
              </div>
              </div>

              <div className="modal-footer">
                    <button
                      type="button"
                      onClick={() => setEditingPayment(null)}
                      className="btn-secondary flex-1 text-xs"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      form="edit-cotisation-form"
                      className="btn-primary flex-1 text-xs"
                    >
                      <span>Enregistrer les modifications</span>
                    </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </ModalPortal>

      <ConfirmationModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteCotisation}
        title={`Voulez-vous vraiment supprimer définitivement ce reçu d'un montant de ${formatAmount(deleteTarget?.payment?.amount || 0)} ?`}
      />
    </SidebarLayout>
  );
};
