import React, { useState, useEffect } from 'react';
import { SidebarLayout } from '../components/SidebarLayout';
import { 
  getStoredEnterprises, 
  saveStoredEnterprises 
} from '../utils/enterpriseStorage';
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
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Cotisations: React.FC = () => {
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'up_to_date' | 'delayed'>('delayed');
  const [selectedEnt, setSelectedEnt] = useState<any | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('Juin');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // New Payment Form State
  const [paymentAmount, setPaymentAmount] = useState('10000');
  const [paymentLabel, setPaymentLabel] = useState('Cotisation Annuelle 2025');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [showToast, setShowToast] = useState(false);
  const [toastText, setToastText] = useState('');

  // Receipt and Currency conversion states
  const [receiptModalEnt, setReceiptModalEnt] = useState<any | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
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
          amount: Number(cot.amount) || 10000,
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

    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Reçu officiel - ${ent.name} - ${payment.reference}</title>
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
          <p>Chambre de Commerce, d'Industrie et de Services (CCIM)</p>
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
          Reçu généré automatiquement depuis la plateforme administrative CCIM.
        </div>
        <div class="footer-right">
          <div class="sig-line"></div>
          <span>La Trésorerie Générale</span>
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
    a.download = `Recu_${ent.name.replace(/[^a-zA-Z0-9]/g, '_')}_${payment.reference}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadData = () => {
    setEnterprises(getStoredEnterprises());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('enterprises_updated', loadData);
    return () => {
      window.removeEventListener('enterprises_updated', loadData);
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
    const baseSum = list.reduce((s: number, c: any) => s + (Number(c.amount) || 0), 0);
    const yearsSum = (Number(ent.cotisation_2023) || 0) + (Number(ent.cotisation_2024) || 0) + (Number(ent.cotisation_2025) || 0);
    const sumPaid = baseSum + yearsSum;
    const isUpToDate = sumPaid >= 10000;
    const lastDate = list.length > 0 ? list[list.length - 1].date : '-';
    return { sumPaid, isUpToDate, lastDate };
  };

  const downloadTreasuryReport = () => {
    const eurVal = (totalTreasury / 655.957).toFixed(2);
    const madVal = (totalTreasury * 0.0165).toFixed(2);
    const aedVal = (totalTreasury * 0.00603).toFixed(2);
    const gbpVal = (totalTreasury * 0.00129).toFixed(2);
    const qarVal = (totalTreasury * 0.00597).toFixed(2);
    
    let reportText = `========================================================================\n`;
    reportText += `       BILAN GENERAL ET CONVERSION DE LA TRESORERIE (CAISSE)\n`;
    reportText += `           CHAMBRE DE COMMERCE ET D'INDUSTRIE (CCIM)\n`;
    reportText += `========================================================================\n`;
    reportText += `Date de generation : ${new Date().toLocaleString('fr-FR')}\n\n`;
    
    reportText += `------------------------------------------------------------------------\n`;
    reportText += `1. SOLDE DE LA CAISSE EN DEVISE UNIQUE OU CONVERTIE\n`;
    reportText += `------------------------------------------------------------------------\n`;
    reportText += ` Solde Principal (FCFA) : ${totalTreasury.toLocaleString()} FCFA\n`;
    reportText += ` Conversion Euro (EUR)   : ${Number(eurVal).toLocaleString('fr-FR')} EUR  (Taux: 1 EUR = 655.957 FCFA)\n`;
    reportText += ` Dirham Marocain (MAD)   : ${Number(madVal).toLocaleString('fr-FR')} MAD  (Taux: 1 MAD = 60.30 FCFA)\n`;
    reportText += ` Dirham des EAU (AED)    : ${Number(aedVal).toLocaleString('fr-FR')} AED  (Taux: 1 AED = 165.70 FCFA)\n`;
    reportText += ` Livre Sterling (GBP)    : ${Number(gbpVal).toLocaleString('fr-FR')} GBP  (Taux: 1 GBP = 775.20 FCFA)\n`;
    reportText += ` Dirham du Qatar (QAR)   : ${Number(qarVal).toLocaleString('fr-FR')} QAR  (Taux: 1 QAR = 167.50 FCFA)\n\n`;
    
    reportText += `------------------------------------------------------------------------\n`;
    reportText += `2. DETAILS PAR MEMBRE ET EQUIVALENCES MULTI-DEVISES\n`;
    reportText += `------------------------------------------------------------------------\n`;
    reportText += `${'Societe'.padEnd(25)} | ${'N° Membre'.padEnd(10)} | ${'Statut'.padEnd(10)} | ${'Solde (FCFA)'.padEnd(14)} | ${'Euro (EUR)'.padEnd(12)} | ${'Dirham (MAD)'.padEnd(12)} | ${'Dirham (Qatar)'.padEnd(14)}\n`;
    reportText += `-`.repeat(110) + `\n`;
    
    enterprises.forEach(ent => {
      const stats = getEnterpriseStats(ent);
      const mEur = (stats.sumPaid / 655.957).toFixed(2);
      const mMad = (stats.sumPaid * 0.0165).toFixed(2);
      const mQar = (stats.sumPaid * 0.00597).toFixed(2);
      const statusLabel = stats.isUpToDate ? 'A Jour' : 'Retard';
      const cleanName = ent.name.substring(0, 24);
      
      reportText += `${cleanName.padEnd(25)} | ${ent.memberNo.padEnd(10)} | ${statusLabel.padEnd(10)} | ${(stats.sumPaid.toString() + ' FCFA').padEnd(14)} | ${(mEur + ' EUR').padEnd(12)} | ${(mMad + ' MAD').padEnd(12)} | ${(mQar + ' QAR').padEnd(14)}\n`;
    });
    
    reportText += `\n========================================================================\n`;
    reportText += `                     FIN DU RAPPORT DE TRESORERIE\n`;
    reportText += `========================================================================\n`;
    
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CCIM_Bilan_Caisse_Converti_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCustomConversionReport = () => {
    const val = conversionInput === '' ? totalTreasury : (Number(conversionInput) || 0);
    const eurVal = (val / 655.957).toFixed(2);
    const madVal = (val * 0.0165).toFixed(2);
    const aedVal = (val * 0.00603).toFixed(2);
    const gbpVal = (val * 0.00129).toFixed(2);
    const qarVal = (val * 0.00597).toFixed(2);
    
    let text = `========================================================================\n`;
    text += `             FICHE DE CONVERSION DE CHANGE PERSONNALISÉE\n`;
    text += `              CHAMBRE DE COMMERCE ET D'INDUSTRIE (CCIM)\n`;
    text += `========================================================================\n`;
    text += `Généré le : ${new Date().toLocaleString('fr-FR')}\n\n`;
    text += `Montant à Convertir Saisi : ${val.toLocaleString()} FCFA\n\n`;
    text += `FICHES DES DEVISES CONVERTIES :\n`;
    text += `------------------------------------------------------------------------\n`;
    text += ` - Euro (EUR)           : ${eurVal} €  (Taux fixe: 655.957 FCFA)\n`;
    text += ` - Dirham Maroc (MAD)   : ${madVal} MAD (Taux estimé: 0.0165)\n`;
    text += ` - Émirats Arabes (AED) : ${aedVal} AED (Taux estimé: 0.00603)\n`;
    text += ` - Livre Sterling (GBP) : ${gbpVal} £   (Taux estimé: 0.00129)\n`;
    text += ` - Qatar Rial (QAR)     : ${qarVal} QAR (Taux estimé: 0.00597)\n\n`;
    text += `------------------------------------------------------------------------\n`;
    text += `             Document de simulation administrative.\n`;
    text += `========================================================================\n`;
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CCIM_Conversion_Simulee_${val}_FCFA.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formattedEnterprises = enterprises.map(ent => {
    const { sumPaid, isUpToDate, lastDate } = getEnterpriseStats(ent);
    return {
      ...ent,
      sumPaid,
      isUpToDate,
      lastDate
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
    // Suggest standard reference
    setPaymentRef(`VIR-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnt) return;

    const data = {
      date: paymentDate,
      label: paymentLabel,
      amount: Number(paymentAmount) || 10000,
      reference: paymentRef || 'Virement bancaire'
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
  };

  return (
    <SidebarLayout>
      <div className="max-w-[1440px] mx-auto p-4 md:p-8 font-sans space-y-8 bg-transparent min-h-screen">
        
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
        <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-black uppercase text-[#132e15] tracking-widest block">SUIVIE DES COTISATIONS</span>
            <h1 className="text-3xl font-serif font-black text-[#132e15]">Paiements & Trésorerie</h1>
            <p className="text-xs text-gray-400 font-bold">Sélectionnez la période et actualisez pour synchroniser le bilan financier.</p>
          </div>

          {/* Selective Dropdowns + Update Button block */}
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            {/* Month drop-down */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-250 rounded-2xl px-4 py-2.5">
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
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-250 rounded-2xl px-4 py-2.5">
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
              className="bg-[#132e15] hover:bg-[#204923] text-white border border-[#ebd078]/20 px-6 py-3 rounded-2xl font-black text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-xs"
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

        {/* Dashboard 3 KPI Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: En Retard Code Block */}
          <div className="bg-rose-50/65 border-2 border-rose-100 rounded-3xl p-6 text-left flex items-center justify-between gap-4 shadow-3xs">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-rose-600 tracking-wider">Membres Insolvables</span>
              <h3 className="text-4xl font-serif font-black text-rose-700">{delayedCount}</h3>
              <p className="text-xs text-rose-950/70 font-semibold">Sociétés en attente de cotisation fixe</p>
            </div>
            <div className="p-4 bg-rose-100/50 rounded-2xl text-rose-600 border border-rose-200">
              <AlertCircle className="w-8 h-8" />
            </div>
          </div>

          {/* Card 2: À Jour Code Block */}
          <div className="bg-emerald-50/65 border-2 border-emerald-100 rounded-3xl p-6 text-left flex items-center justify-between gap-4 shadow-3xs">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Membres Réguliers</span>
              <h3 className="text-4xl font-serif font-black text-emerald-700">{upToDateCount}</h3>
              <p className="text-xs text-emerald-950/70 font-semibold">Sociétés en règle (vers. &ge; 10 000 FCFA)</p>
            </div>
            <div className="p-4 bg-emerald-100/50 rounded-2xl text-emerald-600 border border-emerald-200">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>

          {/* Card 3: Période Code Block */}
          <div className="bg-amber-50/50 border-2 border-amber-100/50 rounded-3xl p-6 text-left flex items-center justify-between gap-4 shadow-3xs">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">Exercice &amp; Période</span>
              <h3 className="text-2xl font-serif font-black text-[#132e15] truncate">{selectedMonth} {selectedYear}</h3>
              <p className="text-xs text-amber-900/70 font-semibold">Période d'évaluation courante</p>
            </div>
            <div className="p-4 bg-amber-100/55 rounded-2xl text-amber-800 border border-amber-200">
              <Calendar className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Double-Column Grid for Cashier Change Simulator and Members list */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Column Left: Beautiful Cashier Change Simulator (1 block width) */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-150 flex flex-col justify-between gap-5 h-full">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-gray-400 text-[9px] font-black uppercase tracking-wider">Total de la Caisse</p>
                    <h3 className="text-xl font-serif font-black text-emerald-900 leading-tight">
                      {formatAmount(totalTreasury)}
                    </h3>
                  </div>
                </div>

                {/* Custom Converter Engine Widget */}
                <div className="bg-emerald-50/50 border border-emerald-100/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[8px] font-black uppercase text-emerald-950/70 tracking-wider">
                      🎛️ Change multi-devises
                    </p>
                    {conversionInput !== '' && (
                      <button 
                        onClick={() => setConversionInput('')}
                        className="text-[8px] font-black text-rose-700 underline cursor-pointer"
                      >
                        Effacer
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder={`${totalTreasury.toLocaleString()} FCFA`}
                        value={conversionInput}
                        onChange={(e) => setConversionInput(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full pl-3 pr-12 py-2 rounded-xl border border-emerald-200 bg-white text-xs font-bold outline-none focus:border-emerald-700 text-emerald-950 placeholder:text-gray-400 font-mono"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-450 font-mono">
                        FCFA
                      </span>
                    </div>

                    {/* Selector Buttons */}
                    <div className="flex flex-wrap gap-1">
                      {(['EUR', 'MAD', 'AED', 'GBP', 'QAR'] as const).map(curr => {
                        const icon = curr === 'EUR' ? '🇪🇺' : curr === 'MAD' ? '🇲🇦' : curr === 'AED' ? '🇦🇪' : curr === 'GBP' ? '🇬🇧' : '🇶🇦';
                        return (
                          <button
                            key={curr}
                            onClick={() => setConversionTarget(curr)}
                            className={`px-2 py-1 rounded text-[9px] font-black border transition-all cursor-pointer ${
                              conversionTarget === curr
                              ? 'bg-[#132e15] border-[#132e15] text-[#ebd078]'
                              : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-500'
                            }`}
                          >
                            {icon} {curr}
                          </button>
                        );
                      })}
                    </div>

                    {/* Result panel */}
                    <div className="bg-slate-900 text-white rounded-xl p-3 text-center relative overflow-hidden">
                      <span className="text-[8px] font-black uppercase text-[#ebd078] tracking-widest block mb-0.5">Simulation de change</span>
                      <span className="text-xs font-mono font-black">
                        {(() => {
                          const base = conversionInput === '' ? totalTreasury : (Number(conversionInput) || 0);
                          let result = 0;
                          let s = '€';
                          if (conversionTarget === 'EUR') { result = base / 655.957; s = '€'; }
                          else if (conversionTarget === 'MAD') { result = base * 0.0165; s = 'DH'; }
                          else if (conversionTarget === 'AED') { result = base * 0.00603; s = 'AED'; }
                          else if (conversionTarget === 'GBP') { result = base * 0.00129; s = '£'; }
                          else if (conversionTarget === 'QAR') { result = base * 0.00597; s = 'QAR'; }
                          return `${result.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${s}`;
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conversion print-out action */}
              <button
                onClick={downloadCustomConversionReport}
                className="bg-[#132e15] hover:bg-emerald-900 text-[#ebd078] hover:text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 w-full transition-all border border-emerald-950/20 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Télécharger Simulation
              </button>
            </div>
          </div>

          {/* Column Right: Interactive workspace - styled like the official tab container (3 blocks width) */}
          <div className="xl:col-span-3 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-xs space-y-6 text-left">
              
              {/* Header inside table workspace: containing Search Input, Currency display selector, and tabs */}
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-gray-100 pb-4">
                
                {/* Tab select group */}
                <div className="inline-flex items-center gap-1.5 bg-gray-100 p-1 rounded-2xl border border-gray-200">
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
                      placeholder="Rechercher un membre..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 outline-none focus:border-emerald-700 text-xs font-semibold text-gray-700 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Members workspace table */}
              <div className="overflow-x-auto rounded-2xl border border-gray-150">
                <table className="w-full text-left border-collapse min-w-[850px] bg-white">
                  <thead>
                    <tr className="bg-[#132e15] border-b border-emerald-950 text-white text-[10px] uppercase font-black tracking-wider">
                      <th className="p-4">N° membre</th>
                      <th className="p-4">Entreprise</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4">Payé ({displayCurrency})</th>
                      <th className="p-4">Reste à payer ({displayCurrency})</th>
                      <th className="p-4">Paiements</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-700">
                    {filtered.map(ent => {
                      const restToPay = Math.max(0, 10000 - ent.sumPaid);
                      return (
                        <tr key={ent.id} className="hover:bg-gray-50/50 transition-all font-semibold">
                          {/* Member ID */}
                          <td className="p-4 font-mono font-black text-gray-400">
                            {ent.memberNo || 'CCIM-00'}
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

                          {/* Status - displays elegant "Actif" pill which is official */}
                          <td className="p-4">
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[10px] px-2.5 py-1 rounded-full font-black border border-emerald-100 uppercase tracking-wide">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              Actif
                            </span>
                          </td>

                          {/* Amount Paid */}
                          <td className="p-4 font-mono text-emerald-800 font-extrabold">
                            {formatAmount(ent.sumPaid)}
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
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Receipts list trigger */}
                              <button
                                onClick={() => setReceiptModalEnt(ent)}
                                className="inline-flex items-center gap-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                title="Reçus et Bilan"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-600" />
                                Reçus ({getPaymentsList(ent).length})
                              </button>

                              {/* Credit context modifier uploader template */}
                              <button
                                onClick={() => handleOpenPayment(ent)}
                                className="inline-flex items-center gap-1 bg-[#FAF9F5] hover:bg-cscm-green/10 border border-[#A69371]/40 hover:border-cscm-green text-[#132e15] hover:text-cscm-green px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
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
        </div>
      </div>

      {/* Add Direct Payment Modal Dialog */}
      <AnimatePresence>
        {selectedEnt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              bg-black=""
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEnt(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 relative z-10 shadow-2xl border border-[#a69371]/20 font-sans"
            >
              <button 
                onClick={() => setSelectedEnt(null)}
                className="absolute top-5 right-5 p-2 hover:bg-gray-150 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-5 h-5 text-[#132e15]" />
              </button>

              <div className="space-y-6">
                <div className="text-left border-b pb-4">
                  <div className="w-10 h-10 bg-cscm-green/10 text-cscm-green rounded-xl flex items-center justify-center mb-3">
                    <Coins className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-serif font-black text-cscm-dark">Enregistrer une Cotisation</h3>
                  <p className="text-[#132e15]/80 text-xs mt-1 font-bold">Créditer le compte de <b>{selectedEnt.name}</b></p>
                </div>

                <form onSubmit={handleRegisterPayment} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] font-black text-[#132e15] uppercase tracking-wider mb-2">MONTANT FIXÉ (FCFA)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#132e15] text-xs font-bold font-semibold">FCFA</span>
                      <input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full pl-14 pr-4 py-3 bg-white border border-gray-250 rounded-xl outline-none focus:border-cscm-green text-sm font-black text-[#132e15]"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-emerald-800 font-extrabold mt-1 bg-emerald-50 px-2 py-0.5 rounded inline-block">Conformément aux statuts de la Chambre (10,000 FCFA)</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#132e15] uppercase tracking-wider mb-2">LIBELLÉ DU PAIEMENT</label>
                    <input
                      type="text"
                      value={paymentLabel}
                      onChange={(e) => setPaymentLabel(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-250 rounded-xl outline-none focus:border-cscm-green text-sm font-bold text-[#132e15]"
                      required
                    />
                  </div>

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
                      <label className="block text-[10px] font-black text-[#132e15] uppercase tracking-wider mb-2">RÉFÉRENCE BANCAIRE</label>
                      <input
                        type="text"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-250 rounded-xl outline-none focus:border-cscm-green text-xs font-mono font-black text-[#132e15]"
                        placeholder="Ex: VIR-102941"
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
                      className="flex-1 bg-cscm-green hover:bg-[#1a3814] text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <CheckCircle2 className="w-4 h-4 text-cscm-gold shrink-0" />
                      <span>Confirmer le versement</span>
                    </button>
                  </div>
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
              className="bg-white rounded-3xl w-full max-w-3xl p-6 md:p-8 relative z-10 shadow-2xl border border-[#a69371]/20 font-sans max-h-[90vh] flex flex-col overflow-hidden"
            >
              <button 
                onClick={() => setReceiptModalEnt(null)}
                className="absolute top-5 right-5 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
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
                      {getPaymentsList(receiptModalEnt).map((pay: any) => (
                        <div 
                          key={pay.id} 
                          className="bg-gray-50 hover:bg-gray-100/50 border border-gray-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
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
                              <span className="bg-[#132e15]/5 text-[#132e15] border border-[#132e15]/10 text-xs px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1.5 shadow-3xs bg-emerald-50 text-emerald-950">
                                🪙 Montant : {formatAmount(pay.amount)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setSelectedReceipt({ ent: receiptModalEnt, payment: pay })}
                              type="button"
                              className="bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center shadow-3xs"
                              title="Visualiser le reçu"
                            >
                              <Eye className="w-4 h-4 text-blue-700 shrink-0" />
                            </button>
                            <button
                              onClick={() => downloadReceiptFile(receiptModalEnt, pay)}
                              type="button"
                              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center shadow-3xs"
                              title="Télécharger le reçu"
                            >
                              <Download className="w-4 h-4 text-emerald-800 shrink-0" />
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
              className="bg-white rounded-3xl w-full max-w-xl p-6 md:p-8 relative z-10 shadow-2xl border-2 border-[#132e15] font-sans"
            >
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="absolute top-5 right-5 p-2 hover:bg-gray-150 rounded-lg cursor-pointer transition-colors"
                title="Fermer le reçu"
              >
                <X className="w-5 h-5 text-[#132e15]" />
              </button>

              <div className="space-y-6">
                <div className="text-center border-b pb-4">
                  <div className="w-12 h-12 bg-cscm-green/10 text-cscm-green rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-black">
                    ★
                  </div>
                  <h3 className="text-lg font-serif font-black text-cscm-dark uppercase tracking-wide">Chambre de Commerce</h3>
                  <p className="text-[#a69371] text-2xs font-black tracking-widest uppercase">Reçu de paiement officiel</p>
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

                <div className="bg-[#e1eadf]/70 border-2 border-[#132e15]/45 rounded-3xl p-5 text-center">
                  <p className="text-[10px] uppercase font-black tracking-wider text-gray-500 mb-1">Montant Encaissé ({displayCurrency})</p>
                  <p className="text-2xl font-black text-emerald-950">{formatAmount(selectedReceipt.payment.amount)}</p>
                </div>

                <div className="flex gap-4 items-center justify-between pt-2">
                  <div className="border border-dashed border-[#132e15]/80 rounded-xl p-2 text-center text-[9px] font-black uppercase tracking-widest text-[#132e15] scale-90">
                    ★ CCIM PAYÉ ★
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400">La Trésorerie CCIM</p>
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
                    className="flex-1 bg-cscm-green hover:bg-[#1a3814] text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center"
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
    </SidebarLayout>
  );
};
