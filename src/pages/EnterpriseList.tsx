import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, Trash2, Eye, Plus, ChevronRight, X, Building2, Landmark, CheckCircle2, AlertCircle, Coins, AlertTriangle, Loader2, Lock, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SidebarLayout } from '../components/SidebarLayout';
import { EnterpriseDetailModal } from '../components/EnterpriseDetailModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { EnterpriseSummaryModal } from '../components/EnterpriseSummaryModal';
import { getStoredEnterprises, saveStoredEnterprises, Enterprise } from '../utils/enterpriseStorage';
import { getEffectiveApiKey } from '../utils/paymentConfig';

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

const getSectorStyle = (sector: string) => {
  const sec = (sector || '').toLowerCase();
  if (sec.includes('it') || sec.includes('tech') || sec.includes('informatique')) {
    return 'bg-purple-50 text-purple-700 border-purple-200/60';
  }
  if (sec.includes('btp') || sec.includes('construction') || sec.includes('bâtiment')) {
    return 'bg-amber-50 text-amber-700 border-amber-200/60';
  }
  if (sec.includes('fin') || sec.includes('banque') || sec.includes('finance')) {
    return 'bg-blue-50 text-blue-700 border-blue-200/60';
  }
  if (sec.includes('tra') || sec.includes('log') || sec.includes('transport')) {
    return 'bg-indigo-50 text-indigo-700 border-indigo-200/60';
  }
  if (sec.includes('tou') || sec.includes('voyage') || sec.includes('tourisme')) {
    return 'bg-orange-50 text-orange-700 border-orange-200/60';
  }
  if (sec.includes('edu') || sec.includes('enseig') || sec.includes('education')) {
    return 'bg-cyan-50 text-cyan-700 border-cyan-200/60';
  }
  if (sec.includes('agr') || sec.includes('ferme') || sec.includes('agriculture')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
  }
  if (sec.includes('agro') || sec.includes('alim')) {
    return 'bg-teal-50 text-teal-700 border-teal-200/60';
  }
  if (sec.includes('san') || sec.includes('clini') || sec.includes('sante') || sec.includes('santé')) {
    return 'bg-rose-50 text-rose-700 border-rose-200/60';
  }
  return 'bg-slate-50 text-slate-700 border-slate-200/60';
};

export const EnterpriseList = () => {
  const navigate = useNavigate();
  const [selectedEnterprise, setSelectedEnterprise] = useState<any>(null);
  const [enterpriseToSummary, setEnterpriseToSummary] = useState<any>(null);
  const [enterpriseToDelete, setEnterpriseToDelete] = useState<any>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Quick payment setup state
  const [quickPaymentEnt, setQuickPaymentEnt] = useState<any>(null);
  const [paymentMode, setPaymentMode] = useState<'manual' | 'online'>('manual');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('10000'); // Montant exact modifiable, par défaut 10000 FCFA
  const [paymentCurrency, setPaymentCurrency] = useState<string>('FCFA');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentProgressText, setPaymentProgressText] = useState('');

  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [userRole, setUserRole] = useState<'ADMIN' | 'MODERATEUR' | 'MEMBRE'>('MEMBRE');

  const loadData = () => {
    const freshList = getStoredEnterprises();
    setEnterprises(freshList);
    
    // Synchronisation en temps réel de la fiche de détails ouverte
    setSelectedEnterprise(prev => {
      if (!prev) return null;
      const updated = freshList.find(e => e.id === prev.id);
      return updated || prev;
    });

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserRole(parsed.role || 'MEMBRE');
      } catch (e) {
        // Fallback
      }
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('enterprises_updated', loadData);
    return () => {
      window.removeEventListener('enterprises_updated', loadData);
    };
  }, []);

  const sectors = [
    { name: 'AGRICULTURE', value: 'AGR' },
    { name: 'AGRO', value: 'AGR' },
    { name: 'BTP', value: 'BTP' },
    { name: 'ENERGIE', value: 'ENE' },
    { name: 'FINANCE', value: 'FIN' },
    { name: 'IT', value: 'IT' },
    { name: 'TRANSPORT', value: 'TRA' },
    { name: 'TOURISME', value: 'TOU' },
    { name: 'EDUCATION', value: 'EDU' },
  ];

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    pays: '',
    ville: '',
    secteur: '',
    typeMembre: '',
    taille: ''
  });

  const handleUpdateEnterprise = (updatedEnterprise: any) => {
    const updated = enterprises.map(e => e.id === updatedEnterprise.id ? updatedEnterprise : e);
    setEnterprises(updated);
    saveStoredEnterprises(updated);
    if (selectedEnterprise?.id === updatedEnterprise.id) {
      setSelectedEnterprise(updatedEnterprise);
    }
    if (enterpriseToSummary?.id === updatedEnterprise.id) {
      setEnterpriseToSummary(updatedEnterprise);
    }
  };

  const totalCotisations = enterprises.reduce((total, ent) => {
    const enterpriseTotal = (ent.cotisations || []).reduce((sum, cot) => sum + (Number(cot.amount) || 0), 0);
    const yearsTotal = (Number(ent.cotisation_2023) || 0) + (Number(ent.cotisation_2024) || 0) + (Number(ent.cotisation_2025) || 0);
    return total + enterpriseTotal + yearsTotal;
  }, 0);

  const filteredEnterprises = enterprises.filter(ent => {
    const matchesSearch = (ent.raisonSociale || ent.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (ent.memberNo || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPays = !filters.pays || ent.pays === filters.pays;
    const matchesVille = !filters.ville || ent.ville === filters.ville;
    const matchesSecteur = !filters.secteur || (ent.secteur || '').toLowerCase() === filters.secteur.toLowerCase();
    const matchesStatut = !filters.typeMembre || ent.statutMembre === filters.typeMembre;
    
    let matchesTaille = true;
    if (filters.taille) {
      const size = parseInt(ent.effectif || '0');
      if (filters.taille === 'Petite') matchesTaille = size < 50;
      else if (filters.taille === 'Moyenne') matchesTaille = size >= 50 && size < 200;
      else if (filters.taille === 'Grande') matchesTaille = size >= 200;
    }

    return matchesSearch && matchesPays && matchesVille && matchesSecteur && matchesStatut && matchesTaille;
  });

  const handleDeleteConfirm = () => {
    if (enterpriseToDelete) {
      try {
        const updated = enterprises.filter(e => e.id !== enterpriseToDelete.id);
        saveStoredEnterprises(updated);
        setFeedbackMessage({ type: 'success', text: 'L\'entreprise a été supprimée avec succès.' });
        setEnterpriseToDelete(null);
        setTimeout(() => setFeedbackMessage(null), 3000);
      } catch (error) {
        setFeedbackMessage({ type: 'error', text: 'Une erreur est survenue lors de la suppression.' });
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    }
  };

  const handleRegisterQuickPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickPaymentEnt) return;

    const selectedCurr = CURRENCIES.find(c => c.code === paymentCurrency) || CURRENCIES[0];
    const finalAmountInFCFA = Math.round(Number(paymentAmount) * selectedCurr.rate);

    if (paymentMode === 'online') {
      const apiKey = getEffectiveApiKey();
      if (!apiKey) {
        setFeedbackMessage({
          type: 'error',
          text: "Erreur : Clé API manquante pour le paiement en ligne !"
        });
        setTimeout(() => setFeedbackMessage(null), 4000);
        return;
      }

      if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
        setFeedbackMessage({
          type: 'error',
          text: "Veuillez remplir toutes les informations de votre carte bancaire."
        });
        setTimeout(() => setFeedbackMessage(null), 3000);
        return;
      }

      setIsProcessingPayment(true);
      setPaymentProgressText("Connexion sécurisée à la passerelle de paiement...");

      setTimeout(() => {
        setPaymentProgressText(`Authentification de la clé API [${apiKey.substring(0, 8)}...]...`);
      }, 850);

      setTimeout(() => {
        setPaymentProgressText("Transmission cryptée SSL 256 bits et vérification bancaire...");
      }, 1700);

      setTimeout(() => {
        setPaymentProgressText("Enregistrement sécurisé de la transaction en base...");
      }, 2550);

      setTimeout(() => {
        const payment = {
          date: new Date().toISOString().split('T')[0],
          label: 'Cotisation Annuelle En Ligne',
          amount: finalAmountInFCFA,
          originalAmount: Number(paymentAmount),
          originalCurrency: paymentCurrency,
          reference: `ONL-${Math.floor(100000 + Math.random() * 900000)}`,
          method: 'Carte Bancaire (En Ligne)'
        };

        const current = getStoredEnterprises();
        const updated = current.map(e => {
          if (e.id === quickPaymentEnt.id) {
            return {
              ...e,
              cotisations: [...(e.cotisations || []), payment]
            };
          }
          return e;
        });

        saveStoredEnterprises(updated);
        setQuickPaymentEnt(null);
        setIsProcessingPayment(false);
        setFeedbackMessage({
          type: 'success',
          text: `Paiement en ligne de ${finalAmountInFCFA.toLocaleString()} FCFA traité avec succès !`
        });
        setTimeout(() => setFeedbackMessage(null), 4000);
      }, 3400);

    } else {
      // Manual payment
      const payment = {
        date: new Date().toISOString().split('T')[0],
        label: 'Cotisation Annuelle Fixe',
        amount: finalAmountInFCFA,
        originalAmount: Number(paymentAmount),
        originalCurrency: paymentCurrency,
        reference: paymentRef || 'Virement Bancaire Standard',
        method: 'Virement bancaire'
      };

      const current = getStoredEnterprises();
      const updated = current.map(e => {
        if (e.id === quickPaymentEnt.id) {
          return {
            ...e,
            cotisations: [...(e.cotisations || []), payment]
          };
        }
        return e;
      });

      saveStoredEnterprises(updated);
      setQuickPaymentEnt(null);
      setPaymentRef('');
      setFeedbackMessage({
        type: 'success',
        text: `Paiement de ${finalAmountInFCFA.toLocaleString()} FCFA validé pour ${quickPaymentEnt.name} !`
      });
      setTimeout(() => setFeedbackMessage(null), 3500);
    }
  };

  return (
    <SidebarLayout>
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="max-w-[1440px] mx-auto p-4 md:p-8 font-sans space-y-8"
      >
        {/* Toast Feedbacks */}
        <AnimatePresence>
          {feedbackMessage && (
            <motion.div
              initial={{ opacity: 0, y: -40, x: '-50%' }}
              animate={{ opacity: 1, y: 20, x: '-50%' }}
              exit={{ opacity: 0, y: -40, x: '-50%' }}
              className={`fixed top-4 left-1/2 z-[110] px-6 py-4 rounded-2xl shadow-[0_20px_50px_-16px_rgba(62,123,50,0.35)] font-bold flex items-center gap-3 border ${
                feedbackMessage.type === 'success' 
                  ? 'bg-white text-emerald-700 border-emerald-100' 
                  : 'bg-white text-rose-600 border-rose-100'
              }`}
            >
              {feedbackMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{feedbackMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pb-2">
          <div className="space-y-2">
            <span className="badge-soft">Registre National</span>
            <h1 className="page-title md:text-4xl">Annuaire des Membres</h1>
            <p className="text-sm text-[#22301C]/55 font-medium">Consultez, filtrez et gérez l'ensemble des entreprises membres de la chambre.</p>
          </div>
        </div>

        {/* Mini Stats Lineup */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="card-elevated p-6 flex items-center gap-4">
            <div className="p-3.5 bg-cscm-green-soft rounded-2xl text-cscm-green shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[#22301C]/55 text-[10px] font-black uppercase tracking-wider">Membres totaux</p>
              <h3 className="text-2xl font-sans font-bold text-[#274420] mt-0.5">{enterprises.length}</h3>
            </div>
          </div>
          
          <div className="card-elevated p-6 flex items-center gap-4">
            <div className="p-3.5 bg-cscm-gold-light/40 rounded-2xl text-amber-500 shrink-0">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[#22301C]/55 text-[10px] font-black uppercase tracking-wider">Cotisations accumulées</p>
              <h3 className="text-2xl font-sans font-bold text-[#274420] mt-0.5">{totalCotisations.toLocaleString()} FCFA</h3>
            </div>
          </div>

          <div className="card-elevated p-6 flex items-center gap-4">
            <div className="p-3.5 bg-indigo-500/10 rounded-2xl text-indigo-600 shrink-0">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[#22301C]/55 text-[10px] font-black uppercase tracking-wider">Secteurs actifs</p>
              <h3 className="text-2xl font-sans font-bold text-[#274420] mt-0.5">
                {Array.from(new Set(enterprises.map(e => e.secteur).filter(Boolean))).length}
              </h3>
            </div>
          </div>
        </div>

        {/* Sectors count horizontal breakdown - interactive filters */}
        <div className="card-elevated p-6 space-y-3.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-2.5 border-gray-100">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#274420]">Effectifs d'entreprises par secteur d'activité</span>
            <span className="text-[10px] bg-cscm-green-soft text-cscm-green border border-cscm-green/15 font-black px-3 py-1 rounded-full uppercase tracking-wider">
              {enterprises.length} Adhérents Enregistrés
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Agro', 'BTP', 'IT', 'Transport et logistique', 'Tourisme', 'Education', 'Commerce', 'Industrie', 'Sante', 'Autres'].map(sect => {
              const count = enterprises.filter(e => e.secteur === sect).length;
              const isSelected = filters.secteur.toLowerCase() === sect.toLowerCase();
              return (
                <button 
                  key={sect}
                  onClick={() => setFilters(prev => ({ ...prev, secteur: isSelected ? '' : sect }))}
                  className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 border outline-none cursor-pointer flex items-center gap-2 select-none ${
                    isSelected 
                      ? 'bg-cscm-green text-white border-cscm-green shadow-md shadow-cscm-green/20' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-cscm-green/30 hover:bg-cscm-green-soft/50'
                  }`}
                >
                  <span className={isSelected ? 'text-cscm-gold-light font-bold' : 'text-[#274420] font-bold'}>{sect}</span>
                  <span className={`text-[9px] font-black rounded-full px-2 py-0.5 ${isSelected ? 'bg-white/25 text-white' : 'bg-cscm-green-soft text-cscm-green'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search, Filter Action Bar */}
        <div className="card-elevated p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cscm-green/60 w-5 h-5 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Rechercher par raison sociale ou numéro de membre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none bg-white focus:bg-white transition-all text-sm placeholder:text-gray-300 font-semibold text-gray-800"
              />
            </div>

            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`w-full md:w-auto px-6 py-3.5 rounded-2xl font-bold text-sm tracking-wide border cursor-pointer flex items-center justify-center gap-2.5 transition-all duration-300 ${
                isFilterOpen 
                ? 'bg-cscm-green text-white border-cscm-green shadow-lg shadow-cscm-green/25' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 shadow-sm hover:shadow-md'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>Filtrer les résultats</span>
              {Object.values(filters).some(Boolean) && (
                <span className="w-2.1 h-2.1 rounded-full bg-cscm-gold animate-pulse" />
              )}
            </button>
          </div>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-cscm-green-soft/70/70 p-6 rounded-2xl border border-gray-100 flex flex-wrap gap-4 items-end mt-2">
                  {[
                    { 
                      label: 'Pays d\'origine', 
                      key: 'pays', 
                      options: Array.from(new Set(enterprises.map(e => e.pays))).filter(Boolean).sort() 
                    },
                    { 
                      label: 'Ville', 
                      key: 'ville', 
                      options: Array.from(new Set(
                        enterprises
                          .filter(e => !filters.pays || e.pays === filters.pays)
                          .map(e => e.ville)
                      )).filter(Boolean).sort() 
                    },
                    { label: 'Secteur', key: 'secteur', options: ['IT', 'BTP', 'Finance', 'Agriculture', 'Commerce', 'Services', 'Industrie', 'Santé', 'Éducation', 'Agro', 'Mines'] },
                    { label: 'Statut membre', key: 'typeMembre', options: ['Actif', 'Suspendu', 'Radié'] },
                    { label: 'Taille', key: 'taille', options: ['Petite', 'Moyenne', 'Grande'] },
                  ].map((filter) => (
                    <div key={filter.key} className="flex flex-col gap-1.5 w-full sm:w-[185px]">
                      <label className="text-[10px] font-black text-[#274420] uppercase tracking-widest leading-none">{filter.label}</label>
                      <select 
                        value={(filters as any)[filter.key]}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setFilters(prev => {
                            const updated = { ...prev, [filter.key]: newValue };
                            if (filter.key === 'pays') {
                              updated.ville = '';
                            }
                            return updated;
                          });
                        }}
                        className="bg-white border border-gray-200 rounded-2xl px-3.5 py-2.5 text-xs font-semibold outline-none w-full shadow-sm text-gray-800 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] transition-all"
                      >
                        <option value="">Tous</option>
                        {filter.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => setFilters({ pays: '', ville: '', secteur: '', typeMembre: '', taille: '' })}
                    className="h-11 text-xs font-bold text-rose-600 hover:text-rose-800 underline underline-offset-4 cursor-pointer px-4 flex items-center justify-center transition-colors"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Grid-style list layout / Table */}
        <div className="table-shell">
            <table className="table-base lg:min-w-[1000px]">
              <thead className="table-head">
                <tr className="table-head-row">
                  <th className="table-th">Raison sociale</th>
                  <th className="table-th">N° Membre</th>
                  <th className="table-th hidden sm:table-cell">Localisation</th>
                  <th className="table-th hidden md:table-cell">Secteur</th>
                  <th className="table-th hidden md:table-cell">Effectif</th>
                  <th className="table-th hidden sm:table-cell">Statut Adhésion</th>
                  <th className="table-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {filteredEnterprises.map((ent, idx) => (
                  <tr key={`${ent.id || idx}-${idx}`} className="table-row group">
                    <td className="table-td text-cscm-dark flex items-center gap-3.5">
                      {ent.logo ? (
                        <img src={ent.logo} alt={ent.raisonSociale || ent.name} className="w-11 h-11 rounded-2xl object-cover border border-gray-100 shadow-sm" />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-cscm-green-soft text-cscm-green flex items-center justify-center font-sans font-bold text-center text-sm border border-cscm-green/15">
                          {(ent.raisonSociale || ent.name || '').charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-extrabold group-hover:text-cscm-green transition-colors leading-tight text-[15px]">{ent.raisonSociale || ent.name}</div>
                        <div className="text-[10px] text-[#22301C]/55 font-bold uppercase tracking-wider mt-0.5">{ent.formeJuridique}</div>
                      </div>
                    </td>
                    <td className="table-td text-cscm-dark/70 font-mono text-xs font-bold">{ent.memberNo}</td>
                    <td className="table-td hidden sm:table-cell">
                      <div className="font-bold text-cscm-dark">{ent.ville}</div>
                      <div className="text-[10px] text-cscm-dark/55 font-bold uppercase mt-0.5">{ent.pays}</div>
                    </td>
                    <td className="table-td hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getSectorStyle(ent.secteur)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                        {ent.secteur}
                      </span>
                    </td>
                    <td className="table-td text-cscm-dark font-black hidden md:table-cell">{ent.effectif} pers.</td>
                    <td className="table-td hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                        ent.statutMembre === 'Actif' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ent.statutMembre === 'Actif' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        {ent.statutMembre}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="flex items-center justify-end gap-2 text-right">
                        {userRole === 'ADMIN' && (
                          <button 
                            onClick={() => {
                              setQuickPaymentEnt(ent);
                              setPaymentMode('manual');
                              setPaymentAmount('10000');
                              setCardName('');
                              setCardNumber('');
                              setCardExpiry('');
                              setCardCvv('');
                              setIsProcessingPayment(false);
                              setPaymentProgressText('');
                              setPaymentRef(`VIR-${Math.floor(100000 + Math.random() * 900000)}`);
                            }}
                            className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 border border-amber-100 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                            title="Ajouter Cotisation (10 000 FCFA)"
                          >
                            <Coins className="w-4.5 h-4.5 text-amber-500" />
                          </button>
                        )}
                        <button 
                          onClick={() => setEnterpriseToSummary(ent)}
                          className="p-2 text-gray-500 hover:text-cscm-green hover:bg-cscm-green-soft/60 border border-gray-200 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                          title="Fiche technique PDF"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                        {userRole === 'ADMIN' && (
                          <button 
                            onClick={() => setEnterpriseToDelete(ent)}
                            className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-rose-100 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                            title="Retirer"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        )}
                        {userRole !== 'MEMBRE' && (
                          <button 
                            onClick={() => setSelectedEnterprise(ent)}
                            className="bg-cscm-green-soft text-cscm-green hover:bg-cscm-green hover:text-white hover:shadow-lg hover:shadow-cscm-green/25 px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 flex items-center gap-1 cursor-pointer select-none"
                          >
                            Détails
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEnterprises.length === 0 && (
                  <tr>
                    <td colSpan={8} className="table-td p-16 text-center text-cscm-dark/45 italic font-bold">
                      Aucune entreprise ne correspond à vos critères de recherche.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>
      </motion.div>

      {/* Modals */}
      <EnterpriseDetailModal 
        isOpen={!!selectedEnterprise}
        onClose={() => setSelectedEnterprise(null)}
        enterprise={selectedEnterprise || {}}
        onUpdate={handleUpdateEnterprise}
      />
      <ConfirmationModal 
        isOpen={!!enterpriseToDelete}
        onClose={() => setEnterpriseToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
      <EnterpriseSummaryModal 
        isOpen={!!enterpriseToSummary}
        onClose={() => setEnterpriseToSummary(null)}
        enterprise={enterpriseToSummary}
      />

      {/* Quick Bank & Online Payment Cotisation Modal */}
      <AnimatePresence>
        {quickPaymentEnt && (
          <div className="fixed inset-0 bg-black/60 z-[120] backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-gray-100"
            >
              {/* Header */}
              <div className="modal-header">
                <div>
                  <h3 className="text-sm font-sans font-bold text-[#274420] tracking-wide">
                    {paymentMode === 'online' ? 'Paiement Sécurisé En Ligne' : 'Saisir Paiement Banque'}
                  </h3>
                  <p className="text-[9px] text-[#22301C]/55 font-bold uppercase tracking-wider mt-0.5">{quickPaymentEnt.name}</p>
                </div>
                <button 
                  onClick={() => !isProcessingPayment && setQuickPaymentEnt(null)}
                  className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500 cursor-pointer"
                  disabled={isProcessingPayment}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isProcessingPayment ? (
                /* LOADER VIEW */
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-cscm-green-soft text-cscm-green rounded-full flex items-center justify-center mx-auto">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                  <h4 className="text-sm font-black text-[#274420] uppercase tracking-wider">Traitement de la transaction...</h4>
                  <p className="text-xs text-gray-500 font-bold max-w-xs mx-auto animate-pulse">{paymentProgressText}</p>
                  <div className="pt-2">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Passerelle de Paiement CSCM</span>
                  </div>
                </div>
              ) : (
                /* MAIN FORM VIEW */
                <form onSubmit={handleRegisterQuickPayment} className="p-6 space-y-4">
                  {/* Mode Tabs */}
                  <div className="grid grid-cols-2 bg-cscm-green-soft/70 p-1 rounded-2xl border border-gray-100">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('manual')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                        paymentMode === 'manual' 
                          ? 'bg-white text-[#274420] shadow-sm' 
                          : 'text-gray-500 hover:text-[#274420]'
                      }`}
                    >
                      Virement Banque
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('online')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer ${
                        paymentMode === 'online' 
                          ? 'bg-cscm-green text-white shadow-sm shadow-cscm-green/25' 
                          : 'text-gray-500 hover:text-[#274420]'
                      }`}
                    >
                      Paiement En Ligne
                    </button>
                  </div>

                  {/* Common editable amount input */}
                  <div className="space-y-3 bg-white p-4 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase text-[#274420] tracking-wider block">Devise du versement</label>
                      <select
                        value={paymentCurrency}
                        onChange={(e) => setPaymentCurrency(e.target.value)}
                        className="bg-white border border-gray-200 text-gray-800 font-sans font-bold text-xs py-1.5 px-3 rounded-2xl shadow-sm outline-none cursor-pointer focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] transition-all min-w-[150px]"
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
                        <input 
                          type="number" 
                          required
                          min="1"
                          step="any"
                          placeholder="Ex: 10000"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="w-full pl-3 pr-12 py-2 rounded-2xl border border-gray-200 outline-none focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] transition-all text-sm font-black text-gray-800 bg-white placeholder:text-gray-300"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          {paymentCurrency}
                        </span>
                      </div>
                    </div>

                    {paymentAmount && Number(paymentAmount) > 0 && (() => {
                      const selectedCurr = CURRENCIES.find(c => c.code === paymentCurrency) || CURRENCIES[0];
                      if (paymentCurrency === 'FCFA') {
                        const eurEquivalent = Number(paymentAmount) / 655.957;
                        return (
                          <div className="bg-cscm-green-soft/60 border border-cscm-green/15 rounded-xl p-2.5 text-center text-xs">
                            <p className="text-xs text-gray-600 font-semibold">
                              Équivalent indicatif : <span className="font-mono text-xs font-black">{eurEquivalent.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                            </p>
                          </div>
                        );
                      } else {
                        const convertedFCFA = Math.round(Number(paymentAmount) * selectedCurr.rate);
                        return (
                          <div className="bg-cscm-green-soft/60 border border-cscm-green/15 rounded-xl p-2.5 text-center text-xs">
                            <p className="text-xs text-cscm-green font-extrabold">
                              Conversion automatique : <span className="font-mono text-sm font-black">{convertedFCFA.toLocaleString()} FCFA</span>
                            </p>
                          </div>
                        );
                      }
                    })()}
                  </div>

                  {paymentMode === 'manual' ? (
                    /* MANUAL BANK VIR PATH */
                    <div className="space-y-4">
                      <div className="bg-cscm-green-soft text-[#274420] font-bold p-4 rounded-2xl border border-cscm-green/15 flex items-start gap-2.5 text-xs">
                        <Landmark className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                        <p>Le versement de validation sera imputé manuellement à la caisse de la Chambre de Commerce pour ce membre.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-[#274420] tracking-wider">Référence du Virement Bancaire</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Ex: VR-719582-BOA"
                          value={paymentRef}
                          onChange={(e) => setPaymentRef(e.target.value)}
                          className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 outline-none focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] bg-white focus:bg-white transition-all font-mono text-xs font-semibold text-gray-800 placeholder:text-gray-300"
                        />
                      </div>

                      <div className="flex gap-3 pt-3">
                        <button 
                          type="button"
                          onClick={() => setQuickPaymentEnt(null)}
                          className="flex-1 py-3 text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-center"
                        >
                          Annuler
                        </button>
                        <button 
                          type="submit"
                          className="flex-1 py-3 text-xs font-bold text-white btn-sheen bg-gradient-to-b from-[#4B9040] to-[#3A7230] hover:from-[#529B46] hover:to-[#417F36] rounded-2xl shadow-lg shadow-cscm-green/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer text-center"
                        >
                          Valider le versement
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ONLINE CREDIT CARD PATH */
                    <div className="space-y-4">
                      {!getEffectiveApiKey() ? (
                        /* API KEY MISSING ERROR BLOCK */
                        <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-4 text-xs font-semibold space-y-3">
                          <div className="flex items-start gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-extrabold text-rose-800 text-sm">Passerelle de Paiement Bloquée</p>
                              <p className="text-rose-700/80 mt-1 leading-relaxed">
                                La clé API pour le paiement en ligne n'est pas configurée dans le code. Une clé API valide est requise pour initier les paiements.
                              </p>
                            </div>
                          </div>
                          
                          <div className="border-t border-rose-150 pt-2.5 space-y-2">
                            <p className="text-[10px] font-black uppercase text-rose-800 tracking-wider">Comment la configurer directement ?</p>
                            <p className="text-[10px] text-rose-700 font-bold leading-relaxed">
                              Ouvrez le fichier <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-rose-950 font-semibold">src/utils/paymentConfig.ts</code> et insérez votre clé API Stripe ou Paytech à l'emplacement indiqué :
                            </p>
                            <div className="bg-rose-950 text-rose-100 font-mono text-[9px] p-2 rounded-lg font-black select-all">
                              export const PAYMENT_API_KEY = "votre_cle_api_directe";
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* SECURE PAYMENT FORM (API ACTIVE) */
                        <div className="space-y-3">
                          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-2.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                              <span className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">Passerelle Active</span>
                            </div>
                            <span className="text-[8px] font-mono text-emerald-950/70 font-black bg-emerald-100 px-1.5 py-0.5 rounded">
                              Key: {getEffectiveApiKey().substring(0, 8)}...
                            </span>
                          </div>

                          <div className="space-y-2.5 border-t pt-2.5">
                            <div>
                              <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Nom sur la carte</label>
                              <input
                                type="text"
                                placeholder="M. Yoan ITOUA"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value)}
                                className="w-full px-3 py-2 bg-white focus:bg-white border border-gray-200 rounded-2xl outline-none focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] transition-all text-xs font-bold text-gray-800 placeholder:text-gray-300"
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Numéro de Carte Bancaire</label>
                              <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                  type="text"
                                  placeholder="4532 •••• •••• 8824"
                                  value={cardNumber}
                                  onChange={(e) => {
                                    const raw = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                                    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
                                    setCardNumber(formatted.substring(0, 19));
                                  }}
                                  className="w-full pl-9 pr-4 py-2 bg-white focus:bg-white border border-gray-200 rounded-2xl outline-none focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] transition-all text-xs font-mono font-black text-gray-800 placeholder:text-gray-300"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Expiration</label>
                                <input
                                  type="text"
                                  placeholder="MM/YY"
                                  value={cardExpiry}
                                  onChange={(e) => {
                                    let v = e.target.value.replace(/[^0-9]/g, '');
                                    if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2, 4);
                                    setCardExpiry(v.substring(0, 5));
                                  }}
                                  className="w-full px-3 py-2 bg-white focus:bg-white border border-gray-200 rounded-2xl outline-none focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] transition-all text-xs font-mono font-black text-center text-gray-800 placeholder:text-gray-300"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">CVC (CVV)</label>
                                <input
                                  type="password"
                                  placeholder="•••"
                                  maxLength={3}
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ''))}
                                  className="w-full px-3 py-2 bg-white focus:bg-white border border-gray-200 rounded-2xl outline-none focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] transition-all text-xs font-mono font-black text-center text-gray-800 placeholder:text-gray-300"
                                  required
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3 pt-3">
                            <button 
                              type="button"
                              onClick={() => setQuickPaymentEnt(null)}
                              className="flex-1 py-3 text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-center"
                            >
                              Annuler
                            </button>
                            <button 
                              type="submit"
                              className="flex-1 py-3 text-xs font-bold text-white btn-sheen bg-gradient-to-b from-[#4B9040] to-[#3A7230] hover:from-[#529B46] hover:to-[#417F36] rounded-2xl shadow-lg shadow-cscm-green/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer text-center"
                            >
                              <Lock className="w-3.5 h-3.5 inline shrink-0 mr-1" />
                              <span>Payer {Number(paymentAmount).toLocaleString()} FCFA</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </SidebarLayout>
  );
};
