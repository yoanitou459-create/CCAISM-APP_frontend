import React, { useState, useEffect } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { jsPDF } from 'jspdf';
import { 
  getStoredEnterprises, 
  saveStoredEnterprises 
} from '../utils/enterpriseStorage';
import { getEffectiveApiKey } from '../utils/paymentConfig';
import { 
  getLocalCotisationRules, 
  saveCotisationRules, 
  fetchLatestCotisationRules 
} from '../utils/cotisationRules';
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
    doc.text(ent.name || ent.raisonSociale || '', 65, 72);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text("Numéro d'adhérent :", 20, 79);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(19, 46, 21);
    doc.text(ent.memberNo || '-', 65, 79);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text("Secteur d'activité :", 20, 86);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(19, 46, 21);
    doc.text(ent.secteur || 'PME', 65, 86);

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
    const matchesSearch = (ent.name || ent.raisonSociale || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
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
        className="max-w-[1440px] mx-auto p-4 md:p-8 font-sans space-y-8 bg-transparent min-h-screen"
      >
        
        {/* Toast Feedbacks */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: -40, x: '-50%' }}
              animate={{ opacity: 1, y: 20, x: '-50%' }}
              exit={{ opacity: 0, y: -40, x: '-50%' }}
              className="fixed top-4 left-1/2 z-[110] px-6 py-4 rounded-2xl shadow-[0_20px_50px_-16px_rgba(62,123,50,0.35)] font-semibold flex items-center gap-3 border bg-white text-emerald-700 border-emerald-100"
            >
              <CheckCircle2 className="w-5 h-5 text-cscm-green" />
              <span className="text-sm">{toastText}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* En-tête */}
        <div className="hero-banner">
          <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div className="space-y-2 text-left">
              <span className="badge-soft">
                <Coins className="w-3.5 h-3.5" />
                Trésorerie &amp; Cotisations
              </span>
              <h1 className="page-title md:text-4xl">Paiements &amp; Trésorerie</h1>
              <p className="text-sm text-[#22301C]/55 font-medium max-w-2xl leading-relaxed">
                Suivi officiel des cotisations membres, encaissements et actualisation du bilan financier de la Chambre.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto shrink-0">
              <div className="flex items-center gap-2 bg-white border border-cscm-green/15 rounded-2xl px-4 py-2.5 shadow-sm">
                <span className="text-[10px] font-bold text-[#22301C]/45 uppercase tracking-wider">Mois</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-cscm-dark font-semibold text-sm outline-none cursor-pointer"
                >
                  {['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white border border-cscm-green/15 rounded-2xl px-4 py-2.5 shadow-sm">
                <span className="text-[10px] font-bold text-[#22301C]/45 uppercase tracking-wider">Année</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="bg-transparent text-cscm-dark font-semibold text-sm outline-none cursor-pointer"
                >
                  {['2023', '2024', '2025', '2026', '2027', '2028'].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsRefreshing(true);
                  setTimeout(() => {
                    setIsRefreshing(false);
                    setToastText("Données de cotisations actualisées avec succès.");
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 2000);
                  }, 750);
                }}
                className="btn-submit px-5 py-3 flex items-center gap-2 text-xs uppercase tracking-wider shrink-0"
              >
                <svg
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Actualiser
              </button>
            </div>
          </div>
        </div>

        {/* Règles des cotisations */}
        <div className="card-elevated p-6 md:p-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 text-cscm-green">
              <Settings className="w-5 h-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Règles des cotisations</span>
            </div>
            <h3 className="section-title text-lg">
              Règle active : {rules.amountPerSemester.toLocaleString()} {rules.currency} par semestre
            </h3>
            <p className="text-xs text-[#22301C]/55 font-medium">Les modifications sont appliquées immédiatement pour tous les utilisateurs.</p>
          </div>
          <form onSubmit={handleUpdateRules} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
            <div className="relative flex-1 sm:w-64">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#22301C]/40 text-[10px] font-bold tracking-wider">XOF</span>
              <input
                type="number"
                value={newRuleAmount}
                onChange={(e) => setNewRuleAmount(e.target.value)}
                placeholder="Montant semestriel..."
                className="input-light pl-14 text-center font-semibold"
                required
                min="1"
              />
            </div>
            <button type="submit" className="btn-submit px-6 py-3 text-xs uppercase tracking-wider whitespace-nowrap">
              Enregistrer
            </button>
          </form>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          <div className="card-elevated p-6 flex justify-between items-start relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-rose-500/[0.06] group-hover:scale-125 transition-transform duration-500" />
            <div className="relative space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#274420]/40 block">Membres insolvables</span>
              <span className="text-[2.4rem] leading-none text-rose-600 block mt-3 font-sans font-semibold tracking-tight">{delayedCount}</span>
              <span className="text-[10px] font-semibold text-gray-400 block mt-2">En attente de cotisation</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shrink-0 relative">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="card-elevated p-6 flex justify-between items-start relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-emerald-500/[0.06] group-hover:scale-125 transition-transform duration-500" />
            <div className="relative space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#274420]/40 block">Membres réguliers</span>
              <span className="text-[2.4rem] leading-none text-emerald-600 block mt-3 font-sans font-semibold tracking-tight">{upToDateCount}</span>
              <span className="text-[10px] font-semibold text-gray-400 block mt-2">Cotisations à jour</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 shrink-0 relative">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="card-elevated p-6 flex justify-between items-start relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-amber-500/[0.07] group-hover:scale-125 transition-transform duration-500" />
            <div className="relative space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#274420]/40 block">Exercice &amp; période</span>
              <span className="text-xl md:text-2xl leading-none text-amber-700 block mt-4 font-sans font-semibold tracking-tight truncate">{selectedMonth} {selectedYear}</span>
              <span className="text-[10px] font-semibold text-gray-400 block mt-2.5">Période d'évaluation</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shrink-0 relative">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="card-elevated p-6 flex justify-between items-start relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-cscm-green/[0.06] group-hover:scale-125 transition-transform duration-500" />
            <div className="relative space-y-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#274420]/40 block">Total de la caisse</span>
              <span className="text-lg md:text-xl leading-none text-cscm-green block mt-4 font-sans font-semibold tracking-tight truncate">{formatAmount(totalTreasury)}</span>
              <span className="text-[10px] font-semibold text-gray-400 block mt-2.5">Devise : {displayCurrency}</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-cscm-green-soft border border-cscm-green/15 flex items-center justify-center text-cscm-green shrink-0 relative">
              <Coins className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Tableau des membres */}
        <div className="card-elevated p-6 md:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-gray-100 pb-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter('delayed')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 border flex items-center gap-2 cursor-pointer ${
                  statusFilter === 'delayed'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300 hover:bg-rose-50/50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'delayed' ? 'bg-white' : 'bg-rose-500'}`} />
                En retard ({delayedCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('up_to_date')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 border flex items-center gap-2 cursor-pointer ${
                  statusFilter === 'up_to_date'
                    ? 'bg-cscm-green text-white border-cscm-green shadow-md shadow-cscm-green/20'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-cscm-green/30 hover:bg-cscm-green-soft/50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'up_to_date' ? 'bg-cscm-gold-light' : 'bg-cscm-green'}`} />
                À jour ({upToDateCount})
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 border cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-[#274420] text-white border-[#274420] shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50/80'
                }`}
              >
                Tous ({formattedEnterprises.length})
              </button>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold shrink-0 shadow-sm">
                <span className="text-[9px] font-bold text-[#22301C]/40 uppercase">Devise</span>
                <select
                  value={displayCurrency}
                  onChange={(e) => setDisplayCurrency(e.target.value as any)}
                  className="bg-transparent text-cscm-dark font-semibold outline-none cursor-pointer"
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
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cscm-green/60 w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Rechercher un membre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 outline-none focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-sm font-semibold text-gray-800 placeholder:text-gray-300 bg-white transition-all"
                />
              </div>
            </div>
          </div>

          <div className="table-shell">
            <table className="table-base min-w-[850px]">
              <thead className="table-head">
                <tr className="table-head-row">
                  <th className="table-th">N° membre</th>
                  <th className="table-th">Entreprise</th>
                  <th className="table-th">Statut</th>
                  <th className="table-th">Payé ({displayCurrency})</th>
                  <th className="table-th">Reste à payer</th>
                  <th className="table-th">Paiements</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                    {filtered.map((ent, idx) => {
                      const restToPay = Math.max(0, (ent.requiredAmount || 0) - (ent.sumPaid || 0));
                      const displayName = ent.name || ent.raisonSociale || 'Entreprise';
                      return (
                        <tr key={`${ent.id || idx}-${idx}`} className="table-row">
                          <td className="table-td font-mono text-[#22301C]/50 text-xs font-bold">
                            {ent.memberNo || 'CSCM-00'}
                          </td>

                          <td className="table-td">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-cscm-green-soft text-cscm-green font-bold flex items-center justify-center shrink-0 border border-cscm-green/15">
                                {displayName.charAt(0)}
                              </div>
                              <div className="space-y-0.5 min-w-0">
                                <span className="font-bold text-cscm-dark text-sm block truncate">{displayName}</span>
                                <span className="text-[9px] text-cscm-gold uppercase font-bold tracking-wider block">{ent.secteur || 'PME'}</span>
                              </div>
                            </div>
                          </td>

                          <td className="table-td">
                            {ent.isExempt ? (
                              <span className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-500 text-[10px] px-2.5 py-1 rounded-full font-black border border-gray-200 uppercase tracking-wide" title={`Adhésion le ${ent.dateAdhesion || ent.dateCreation || 'N/A'}`}>
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                Non membre
                              </span>
                            ) : ent.isUpToDate ? (
                              <div className="flex flex-col gap-1 items-start">
                                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[10px] px-2.5 py-1 rounded-full font-black border border-emerald-100 uppercase tracking-wide">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
                              <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 text-[10px] px-2.5 py-1 rounded-full font-black border border-rose-100 uppercase tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                En retard
                              </span>
                            )}
                          </td>

                          <td className="table-td font-mono text-emerald-700 font-bold text-left">
                            <div className="flex flex-col">
                              <span>{formatAmount(ent.sumPaid || 0)}</span>
                              <span className="text-[9px] text-[#22301C]/45 font-semibold mt-0.5">
                                Période: {formatAmount(ent.periodPaid || 0)}
                              </span>
                            </div>
                          </td>

                          <td className="table-td font-mono font-bold">
                            {restToPay === 0 ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-black uppercase">Soldé</span>
                            ) : (
                              <span className="text-rose-600">{formatAmount(restToPay)}</span>
                            )}
                          </td>

                          <td className="table-td">
                            <span className="bg-cscm-green-soft text-cscm-green border border-cscm-green/15 px-2.5 py-1 rounded-lg font-mono text-xs font-bold">
                              {getPaymentsList(ent).length}
                            </span>
                          </td>

                          <td className="table-td text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setReceiptModalEnt(ent)}
                                className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 text-blue-700 px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                title="Reçus et Bilan"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                Reçus ({getPaymentsList(ent).length})
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenPayment(ent)}
                                className="btn-submit px-3 py-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider"
                                title="Enregistrer Versement"
                              >
                                <Coins className="w-3.5 h-3.5" />
                                Créditer
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="table-td p-16 text-center text-[#22301C]/45 italic font-medium">
                          Aucun membre ne correspond à ce filtre pour la période sélectionnée.
                        </td>
                      </tr>
                    )}
              </tbody>
            </table>
          </div>
        </div>
        </motion.div>

      {/* Add Direct Payment Modal Dialog */}
      <AnimatePresence>
        {selectedEnt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isProcessingPayment) setSelectedEnt(null);
              }}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-[1.75rem] w-full max-w-lg p-6 md:p-8 relative z-10 shadow-[0_30px_80px_-24px_rgba(62,123,50,0.3)] ring-1 ring-black/5 font-sans overflow-hidden"
            >
              {!isProcessingPayment && (
                <button 
                  onClick={() => setSelectedEnt(null)}
                  className="absolute top-5 right-5 p-2 hover:bg-gray-150 rounded-lg cursor-pointer transition-colors"
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
                <div className="text-left border-b border-cscm-green/10 pb-4">
                  <div className="w-11 h-11 bg-cscm-green-soft text-cscm-green rounded-2xl flex items-center justify-center mb-3 border border-cscm-green/15">
                    <Coins className="w-5 h-5" />
                  </div>
                  <h3 className="section-title text-xl">Enregistrer une cotisation</h3>
                  <p className="text-[#22301C]/55 text-xs mt-1 font-medium">Créditer le compte de <strong className="text-cscm-dark">{selectedEnt.name || selectedEnt.raisonSociale}</strong></p>
                </div>

                <div className="grid grid-cols-2 p-1 bg-cscm-green-soft/60 rounded-2xl border border-cscm-green/10">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('manual')}
                    className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      paymentMode === 'manual'
                        ? 'bg-cscm-green text-white shadow-md'
                        : 'text-gray-500 hover:text-cscm-dark'
                    }`}
                  >
                    Saisie manuelle
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('online')}
                    className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      paymentMode === 'online'
                        ? 'bg-cscm-green text-white shadow-md'
                        : 'text-gray-500 hover:text-cscm-dark'
                    }`}
                  >
                    Paiement en ligne
                  </button>
                </div>

                <form onSubmit={handleRegisterPayment} className="space-y-4 text-left">
                  <div className="space-y-3 bg-cscm-green-soft/50 p-4 rounded-2xl border border-cscm-green/10">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold uppercase text-cscm-dark tracking-wider block">Devise du versement</label>
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
                          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="flex-1 btn-submit py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
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
                                className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 cursor-pointer"
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
                              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                            >
                              Annuler
                            </button>
                            <button
                              type="submit"
                              className="flex-1 bg-[#132e15] hover:bg-emerald-950 text-[#ebd078] hover:text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center border border-[#ebd078]/25"
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment History & Receipt Picker Modal */}
      <AnimatePresence>
        {receiptModalEnt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setReceiptModalEnt(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-[1.75rem] w-full max-w-3xl p-6 md:p-8 relative z-10 shadow-[0_30px_80px_-24px_rgba(62,123,50,0.3)] ring-1 ring-black/5 font-sans max-h-[90vh] flex flex-col overflow-hidden"
            >
              <button 
                onClick={() => setReceiptModalEnt(null)}
                className="absolute top-5 right-5 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5 text-[#132e15]" />
              </button>

              <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                <div className="text-left border-b border-cscm-green/10 pb-4 shrink-0">
                  <span className="text-[10px] font-bold bg-cscm-green-soft text-cscm-green border border-cscm-green/15 uppercase px-2.5 py-1 rounded-full inline-block mb-2">
                    N° membre : {receiptModalEnt.memberNo}
                  </span>
                  <h3 className="page-title text-2xl">{receiptModalEnt.name || receiptModalEnt.raisonSociale}</h3>
                  <p className="text-[#22301C]/55 text-xs mt-1 font-medium">
                    Secteur : <strong className="text-cscm-dark">{receiptModalEnt.secteur}</strong>
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
                          className="card-elevated p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
                              <span className="bg-cscm-green-soft text-cscm-green border border-cscm-green/15 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5">
                                Montant : {formatAmount(pay.amount)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleStartEdit(receiptModalEnt, pay)}
                              type="button"
                              className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center shadow-3xs"
                              title="Modifier cette cotisation"
                            >
                              <Pencil className="w-4 h-4 text-amber-700 shrink-0" />
                            </button>
                            <button
                              onClick={() => handleDeleteCotisation(receiptModalEnt, pay)}
                              type="button"
                              className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center shadow-3xs"
                              title="Supprimer cette cotisation"
                            >
                              <Trash2 className="w-4 h-4 text-rose-700 shrink-0" />
                            </button>
                            <button
                              onClick={() => setSelectedReceipt({ ent: receiptModalEnt, payment: pay })}
                              type="button"
                              className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center shadow-3xs"
                              title="Visualiser le reçu"
                            >
                              <Eye className="w-4 h-4 text-blue-700 shrink-0" />
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
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Fermer la liste
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Single Printable Receipt Modal View */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReceipt(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-[1.75rem] w-full max-w-xl p-6 md:p-8 relative z-10 shadow-[0_30px_80px_-24px_rgba(62,123,50,0.3)] ring-1 ring-cscm-green/15 font-sans"
            >
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="absolute top-5 right-5 p-2 hover:bg-gray-150 rounded-lg cursor-pointer transition-colors"
                title="Fermer le reçu"
              >
                <X className="w-5 h-5 text-[#132e15]" />
              </button>

              <div className="space-y-6">
                <div className="text-center border-b border-cscm-green/10 pb-4">
                  <div className="w-12 h-12 bg-cscm-green-soft text-cscm-green rounded-2xl flex items-center justify-center mx-auto mb-2 border border-cscm-green/15">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="section-title uppercase tracking-wide">Chambre Sénégalaise de Commerce au Maroc</h3>
                  <p className="text-cscm-gold text-[10px] font-bold tracking-widest uppercase mt-1">Reçu de paiement officiel</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-250 text-left">
                    <p className="text-[10px] uppercase font-black tracking-wider text-gray-400 mb-1.5">Détails Reçu</p>
                    <p className="text-[#132e15] mb-1"><b>N° :</b> REC-2026-{selectedReceipt.payment.reference}</p>
                    <p className="text-[#132e15] mb-1"><b>Date :</b> {selectedReceipt.payment.date}</p>
                    <p className="text-[#132e15]"><b>Libellé :</b> {selectedReceipt.payment.label}</p>
                  </div>
                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-250 text-left">
                    <p className="text-[10px] uppercase font-black tracking-wider text-gray-400 mb-1.5">Membre Émetteur</p>
                    <p className="text-[#132e15] mb-1"><b>Nom :</b> {selectedReceipt.ent.name}</p>
                    <p className="text-[#132e15] mb-1"><b>N° :</b> {selectedReceipt.ent.memberNo}</p>
                    <p className="text-[#132e15]"><b>Secteur :</b> {selectedReceipt.ent.secteur}</p>
                  </div>
                </div>

                <div className="bg-cscm-green-soft/70 border border-cscm-green/20 rounded-2xl p-5 text-center">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-[#22301C]/45 mb-1">Montant encaissé ({displayCurrency})</p>
                  <p className="text-2xl font-bold text-cscm-green">{formatAmount(selectedReceipt.payment.amount)}</p>
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

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    type="button"
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                  >
                    Retour
                  </button>
                  <button
                    onClick={() => downloadReceiptFile(selectedReceipt.ent, selectedReceipt.payment)}
                    type="button"
                    className="flex-1 btn-submit py-3 text-xs uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4 text-cscm-gold shrink-0" />
                    <span>Télécharger Officiel</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Cotisation Modal View */}
      <AnimatePresence>
        {editingPayment && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPayment(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-[1.75rem] w-full max-w-md p-6 relative z-10 shadow-[0_30px_80px_-24px_rgba(62,123,50,0.3)] ring-1 ring-black/5 font-sans text-left"
            >
              <button 
                onClick={() => setEditingPayment(null)}
                className="absolute top-5 right-5 p-2 hover:bg-cscm-green-soft rounded-xl cursor-pointer transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5 text-cscm-dark" />
              </button>

              <div className="space-y-4">
                <div className="border-b border-cscm-green/10 pb-3">
                  <span className="text-[9px] font-bold uppercase text-[#22301C]/45 tracking-wider">Modification</span>
                  <h3 className="section-title text-xl">Modifier la cotisation</h3>
                  <p className="text-xs text-[#22301C]/55 font-medium mt-0.5">Pour : <strong className="text-cscm-green">{editingPayment.ent.name || editingPayment.ent.raisonSociale}</strong></p>
                </div>

                <form onSubmit={handleSaveEdit} className="space-y-4">
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

                  <div className="pt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setEditingPayment(null)}
                      className="flex-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-cscm-green hover:bg-[#1a3814] text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer text-center"
                    >
                      <span>Enregistrer les modifications</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteCotisation}
        title={`Voulez-vous vraiment supprimer cette cotisation de ${deleteTarget?.payment?.amount?.toLocaleString() || 0} FCFA ?`}
      />
    </SidebarLayout>
  );
};
