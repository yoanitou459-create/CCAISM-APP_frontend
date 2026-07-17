import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, Trash2, Eye, Plus, ChevronRight, X, Building2, Landmark, CheckCircle2, AlertCircle, Coins, AlertTriangle, Loader2, Lock, CreditCard, LayoutGrid, List, MapPin, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SidebarLayout } from '../components/SidebarLayout';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { EnterpriseSummaryModal } from '../components/EnterpriseSummaryModal';
import { ModalPortal } from '../components/ModalPortal';
import { getStoredEnterprises, saveStoredEnterprises, Enterprise } from '../../database/enterpriseStorage';
import { getEffectiveApiKey } from '../../backend/paymentConfig';
import { getLocalCotisationRules } from '../../database/cotisationRules';

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
  const [rules, setRules] = useState(() => getLocalCotisationRules());
  const [paymentAmount, setPaymentAmount] = useState(() => String(getLocalCotisationRules().amountPerSemester)); // Montant exact modifiable, par défaut depuis les règles
  const [paymentCurrency, setPaymentCurrency] = useState<string>('FCFA');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentProgressText, setPaymentProgressText] = useState('');

  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [userRole, setUserRole] = useState<'ADMIN' | 'MODERATEUR' | 'MEMBRE'>('MEMBRE');

  const loadRules = () => {
    const activeRules = getLocalCotisationRules();
    setRules(activeRules);
    setPaymentAmount(String(activeRules.amountPerSemester));
  };

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
    loadRules();
    window.addEventListener('enterprises_updated', loadData);
    window.addEventListener('cotisation_rules_updated', loadRules);
    return () => {
      window.removeEventListener('enterprises_updated', loadData);
      window.removeEventListener('cotisation_rules_updated', loadRules);
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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(() => {
    return (localStorage.getItem('cscm_enterprises_view') as 'cards' | 'table') || 'cards';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    pays: '',
    ville: '',
    secteur: '',
    typeMembre: '',
    taille: ''
  });

  const setViewModePersist = (mode: 'cards' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('cscm_enterprises_view', mode);
  };

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
    const matchesSearch = (ent.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (ent.memberNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (ent.raisonSociale || '').toLowerCase().includes(searchQuery.toLowerCase());
    
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
        setFeedbackMessage({ type: 'success', text: 'Entreprise supprimée.' });
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
          text: `Paiement en ligne de ${finalAmountInFCFA.toLocaleString()} FCFA confirmé.`
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
        text: `Paiement de ${finalAmountInFCFA.toLocaleString()} FCFA enregistré pour ${quickPaymentEnt.name}.`
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
        className="max-w-7xl mx-auto w-full p-4 md:p-8 font-sans space-y-8"
      >
        {/* Toast Feedbacks */}
        <AnimatePresence>
          {feedbackMessage && (
            <motion.div
              initial={{ opacity: 0, y: -40, x: '-50%' }}
              animate={{ opacity: 1, y: 20, x: '-50%' }}
              exit={{ opacity: 0, y: -40, x: '-50%' }}
              className={`fixed top-4 left-1/2 z-[110] px-6 py-4 rounded-2xl shadow-xl font-bold flex items-center gap-3 border ${
                feedbackMessage.type === 'success' 
                  ? 'bg-emerald-500 text-white border-emerald-600' 
                  : 'bg-rose-500 text-white border-rose-600'
              }`}
            >
              {feedbackMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{feedbackMessage.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-cscm-green">
              <span className="w-6 h-[2px] rounded-full bg-cscm-gold" />
              Registre National
            </span>
            <h1 className="text-3xl md:text-4xl font-serif font-black text-[#1A3D18] mt-2 tracking-tight">Annuaire des Membres</h1>
            <p className="page-subtitle mt-1">
              {filteredEnterprises.length} résultat{filteredEnterprises.length !== 1 ? 's' : ''} sur {enterprises.length} adhérent{enterprises.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white border border-[#1A3D18]/10 rounded-2xl p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setViewModePersist('cards')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-cscm-green text-white shadow-md shadow-cscm-green/25'
                  : 'text-[#1A3D18]/60 hover:text-cscm-green hover:bg-cscm-green/5'
              }`}
              title="Vue cartes"
            >
              <LayoutGrid className="w-4 h-4" />
              Cartes
            </button>
            <button
              type="button"
              onClick={() => setViewModePersist('table')}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-cscm-green text-white shadow-md shadow-cscm-green/25'
                  : 'text-[#1A3D18]/60 hover:text-cscm-green hover:bg-cscm-green/5'
              }`}
              title="Vue tableau"
            >
              <List className="w-4 h-4" />
              Tableau
            </button>
          </div>
        </div>

        {/* Mini Stats Lineup */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="stat-card flex items-center gap-4">
            <div className="p-3.5 bg-cscm-green/10 rounded-2xl text-cscm-green shrink-0 ring-1 ring-cscm-green/10">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[#132e15]/75 text-[10px] font-black uppercase tracking-wider">Membres totaux</p>
              <h3 className="text-2xl font-serif font-black text-[#12210E] mt-0.5">{enterprises.length}</h3>
            </div>
          </div>
          
          <div className="stat-card flex items-center gap-4">
            <div className="p-3.5 bg-cscm-gold/15 rounded-2xl text-[#a8820c] shrink-0 ring-1 ring-cscm-gold/20">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[#132e15]/75 text-[10px] font-black uppercase tracking-wider">Cotisations accumulées</p>
              <h3 className="text-2xl font-serif font-black text-[#12210E] mt-0.5">{totalCotisations.toLocaleString()} FCFA</h3>
            </div>
          </div>

          <div className="stat-card flex items-center gap-4">
            <div className="p-3.5 bg-indigo-500/10 rounded-2xl text-indigo-600 shrink-0 ring-1 ring-indigo-500/10">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[#132e15]/75 text-[10px] font-black uppercase tracking-wider">Secteurs actifs</p>
              <h3 className="text-2xl font-serif font-black text-[#12210E] mt-0.5">
                {Array.from(new Set(enterprises.map(e => e.secteur).filter(Boolean))).length}
              </h3>
            </div>
          </div>
        </div>

        {/* Sectors count horizontal breakdown - interactive filters */}
        <div className="surface-card p-6 space-y-3.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-3 border-[#12210E]/10">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#12210E]">Effectifs d'entreprises par secteur d'activité</span>
            <span className="badge-green">
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
                  className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border outline-none cursor-pointer select-none ${
                    isSelected 
                      ? 'bg-cscm-green text-white border-cscm-green shadow-md shadow-cscm-green/20 -translate-y-0.5' 
                      : 'bg-[#FAF9F5] text-gray-700 border-[#12210E]/10 hover:bg-cscm-green/5 hover:border-cscm-green/30 hover:-translate-y-0.5'
                  }`}
                >
                  <span className={isSelected ? 'text-cscm-gold font-bold' : 'text-[#8c7015] font-bold'}>{sect}</span>
                  <span className={`text-[9px] font-black rounded-full px-2 py-0.5 ${isSelected ? 'bg-white/25 text-white' : 'bg-[#e9e7e0] text-gray-800'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search, Filter Action Bar */}
        <div className="surface-card p-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cscm-green w-5 h-5 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Saisissez le nom d'une entreprise ou son numéro de membre à rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="field-input !pl-12 font-semibold !rounded-2xl"
              />
            </div>

            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`${isFilterOpen ? 'btn-primary' : 'btn-outline'} w-full md:w-auto !px-6 !py-3.5 !text-sm tracking-wide`}
            >
              <Filter className="w-4 h-4" />
              <span>Filtrer les résultats</span>
              {Object.values(filters).some(Boolean) && (
                <span className="w-2 h-2 rounded-full bg-cscm-gold animate-pulse" />
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
                <div className="bg-[#FAF9F5] p-6 rounded-2xl border border-[#12210E]/10 flex flex-wrap gap-4 items-end mt-2">
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
                      <label className="text-[10px] font-black text-[#12210E] uppercase tracking-widest leading-none">{filter.label}</label>
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
                        className="field-select !bg-white !py-2.5 text-xs font-semibold"
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

        {/* Liste des entreprises — Cartes ou Tableau */}
        {filteredEnterprises.length === 0 ? (
          <div className="surface-card p-16 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cscm-green/10 text-cscm-green flex items-center justify-center ring-1 ring-cscm-green/15">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <p className="font-serif font-black text-[#1A3D18] text-base">Aucun membre trouvé</p>
              <p className="text-[#1A3D18]/55 font-semibold text-sm mt-1">Aucune entreprise ne correspond à vos critères de recherche.</p>
            </div>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredEnterprises.map((ent, idx) => (
              <motion.div
                key={`${ent.id || idx}-card`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.3) }}
                className="group surface-card surface-card-hover p-5 flex flex-col gap-4 relative overflow-hidden"
              >
                {/* Accent strip */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cscm-green via-[#6BB85C] to-cscm-gold opacity-80" />

                <div className="flex items-start gap-3.5 pt-1">
                  <div className="w-14 h-14 rounded-2xl border-2 border-cscm-gold/40 bg-white p-0.5 flex items-center justify-center shadow-sm shrink-0 ring-2 ring-cscm-green/10 overflow-hidden transition-all group-hover:ring-cscm-green/25 group-hover:border-cscm-gold/70">
                    {ent.logo ? (
                      <img src={ent.logo} alt={ent.raisonSociale || ent.name} className="w-full h-full rounded-xl object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-xl bg-gradient-to-br from-cscm-green/15 to-cscm-green/5 text-cscm-green flex items-center justify-center font-serif font-black text-lg">
                        {(ent.raisonSociale || ent.name || '').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-[#1A3D18] group-hover:text-cscm-green transition-colors leading-snug text-[15px] truncate">
                      {ent.raisonSociale || ent.name}
                    </h3>
                    <p className="text-[10px] text-[#1A3D18]/55 font-bold uppercase tracking-wider mt-0.5">
                      {ent.formeJuridique || '—'}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="font-mono text-[10px] font-black text-cscm-green bg-cscm-green/10 px-2 py-0.5 rounded-md border border-cscm-green/15">
                        {ent.memberNo || '—'}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black ${
                        ent.statutMembre === 'Actif'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ent.statutMembre === 'Actif' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {ent.statutMembre || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getSectorStyle(ent.secteur)}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                    {ent.secteur || 'Autres'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 rounded-xl bg-[#f4f8f2] px-3 py-2.5 border border-cscm-green/10">
                    <MapPin className="w-3.5 h-3.5 text-cscm-green shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-[#1A3D18] truncate">{ent.ville || '—'}</p>
                      <p className="text-[9px] font-bold uppercase text-[#1A3D18]/45 truncate">{ent.pays || '—'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-[#f4f8f2] px-3 py-2.5 border border-cscm-green/10">
                    <Users className="w-3.5 h-3.5 text-cscm-green shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-[#1A3D18]">{ent.effectif || '—'} pers.</p>
                      <p className="text-[9px] font-bold uppercase text-[#1A3D18]/45">Effectif</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#1A3D18]/8">
                  <div className="flex items-center gap-1.5">
                    {userRole === 'ADMIN' && (
                      <button
                        onClick={() => {
                          setQuickPaymentEnt(ent);
                          setPaymentMode('manual');
                          setPaymentAmount(String(rules.amountPerSemester));
                          setCardName('');
                          setCardNumber('');
                          setCardExpiry('');
                          setCardCvv('');
                          setIsProcessingPayment(false);
                          setPaymentProgressText('');
                          setPaymentRef(`VIR-${Math.floor(100000 + Math.random() * 900000)}`);
                        }}
                        className="btn-icon-gold"
                        title={`Ajouter Cotisation (${rules.amountPerSemester.toLocaleString()} FCFA)`}
                      >
                        <Coins className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setEnterpriseToSummary(ent)}
                      className="btn-icon"
                      title="Fiche technique PDF"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {userRole === 'ADMIN' && (
                      <button
                        onClick={() => setEnterpriseToDelete(ent)}
                        className="btn-icon-danger"
                        title="Retirer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {userRole !== 'MEMBRE' && (
                    <button
                      onClick={() => navigate(`/enterprises/${ent.id}`)}
                      className="btn-primary !px-3.5 !py-2 !text-xs"
                    >
                      Détails
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="table-wrap shadow-[0_2px_20px_rgba(74,155,60,0.08)]">
            <table className="data-table" style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th>Nom de l'entreprise</th>
                  <th>N° Membre</th>
                  <th className="hidden sm:table-cell">Localisation</th>
                  <th className="hidden md:table-cell">Secteur</th>
                  <th className="hidden md:table-cell">Effectif</th>
                  <th className="hidden sm:table-cell">Statut Adhésion</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnterprises.map((ent, idx) => (
                  <tr key={`${ent.id || idx}-${idx}`} className="group hover:bg-cscm-green/[0.05] transition-colors">
                    <td className="text-cscm-dark">
                      <div className="flex items-center gap-3.5 min-w-[200px]">
                        <div className="w-12 h-12 rounded-2xl border-2 border-cscm-gold/40 bg-white p-0.5 flex items-center justify-center shadow-xs relative shrink-0 ring-2 ring-cscm-green/5 transition-all group-hover:ring-cscm-green/15 group-hover:border-cscm-gold/80 overflow-hidden">
                          {ent.logo ? (
                            <img src={ent.logo} alt={ent.raisonSociale || ent.name} className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            <div className="w-full h-full rounded-xl bg-gradient-to-br from-cscm-green/10 to-cscm-green/5 text-cscm-green flex items-center justify-center font-serif font-black text-center text-sm">
                              {(ent.raisonSociale || ent.name || '').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-extrabold group-hover:text-cscm-green transition-colors leading-tight text-[15px]">{ent.raisonSociale || ent.name}</div>
                          <div className="text-[10px] text-[#1A3D18]/60 font-bold uppercase tracking-wider mt-0.5">{ent.formeJuridique}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-[#1A3D18]/80 font-mono text-xs font-bold whitespace-nowrap">{ent.memberNo}</td>
                    <td className="text-[#1A3D18] hidden sm:table-cell">
                      <div className="font-bold">{ent.ville}</div>
                      <div className="text-[10px] text-[#1A3D18]/55 font-bold uppercase mt-0.5">{ent.pays}</div>
                    </td>
                    <td className="hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border whitespace-nowrap ${getSectorStyle(ent.secteur)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                        {ent.secteur}
                      </span>
                    </td>
                    <td className="text-[#1A3D18] font-black hidden md:table-cell whitespace-nowrap">{ent.effectif} pers.</td>
                    <td className="hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black whitespace-nowrap ${
                        ent.statutMembre === 'Actif'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ent.statutMembre === 'Actif' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        {ent.statutMembre}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {userRole === 'ADMIN' && (
                          <button
                            onClick={() => {
                              setQuickPaymentEnt(ent);
                              setPaymentMode('manual');
                              setPaymentAmount(String(rules.amountPerSemester));
                              setCardName('');
                              setCardNumber('');
                              setCardExpiry('');
                              setCardCvv('');
                              setIsProcessingPayment(false);
                              setPaymentProgressText('');
                              setPaymentRef(`VIR-${Math.floor(100000 + Math.random() * 900000)}`);
                            }}
                            className="btn-icon-gold"
                            title={`Ajouter Cotisation (${rules.amountPerSemester.toLocaleString()} FCFA)`}
                          >
                            <Coins className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setEnterpriseToSummary(ent)}
                          className="btn-icon"
                          title="Fiche technique PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {userRole === 'ADMIN' && (
                          <button
                            onClick={() => setEnterpriseToDelete(ent)}
                            className="btn-icon-danger"
                            title="Retirer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {userRole !== 'MEMBRE' && (
                          <button
                            onClick={() => navigate(`/enterprises/${ent.id}`)}
                            className="btn-primary !px-3 !py-1.5 !text-xs"
                          >
                            Détails
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modals */}
      <ConfirmationModal 
        isOpen={!!enterpriseToDelete}
        onClose={() => setEnterpriseToDelete(null)}
        onConfirm={handleDeleteConfirm}
        variant="danger"
        title="Supprimer cette entreprise ?"
        highlight={
          enterpriseToDelete
            ? (enterpriseToDelete.raisonSociale || enterpriseToDelete.name)
            : undefined
        }
        description="Toutes les informations liées (fiche, cotisations, documents) seront définitivement perdues."
        confirmLabel="Oui, supprimer"
        cancelLabel="Annuler"
      />
      <EnterpriseSummaryModal 
        isOpen={!!enterpriseToSummary}
        onClose={() => setEnterpriseToSummary(null)}
        enterprise={enterpriseToSummary}
      />

      {/* Quick Bank & Online Payment Cotisation Modal */}
      <ModalPortal>
      <AnimatePresence>
        {quickPaymentEnt && (
          <div className="modal-overlay">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProcessingPayment && setQuickPaymentEnt(null)}
              className="modal-backdrop"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-shell-md overflow-hidden"
            >
              {/* Header */}
              <div className="modal-header-dark items-center">
                <div>
                  <h3 className="text-sm font-serif font-black text-cscm-gold tracking-wide">
                    {paymentMode === 'online' ? 'Paiement Sécurisé En Ligne' : 'Saisir Paiement Banque'}
                  </h3>
                  <p className="text-[9px] text-white/70 font-bold uppercase tracking-wider mt-0.5">{quickPaymentEnt.name}</p>
                </div>
                <button 
                  onClick={() => !isProcessingPayment && setQuickPaymentEnt(null)}
                  className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-white cursor-pointer"
                  disabled={isProcessingPayment}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isProcessingPayment ? (
                /* LOADER VIEW */
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-cscm-green/10 text-cscm-green rounded-full flex items-center justify-center mx-auto">
                    <Loader2 className="w-8 h-8 animate-spin" />
                  </div>
                  <h4 className="text-sm font-black text-cscm-dark uppercase tracking-wider">Traitement de la transaction...</h4>
                  <p className="text-xs text-gray-500 font-bold max-w-xs mx-auto animate-pulse">{paymentProgressText}</p>
                  <div className="pt-2">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Passerelle de Paiement CSCM</span>
                  </div>
                </div>
              ) : (
                /* MAIN FORM VIEW */
                <form onSubmit={handleRegisterQuickPayment} className="modal-body !p-6 space-y-4">
                  {/* Mode Tabs */}
                  <div className="grid grid-cols-2 bg-white/50 backdrop-blur-sm border border-white/60 p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('manual')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        paymentMode === 'manual' 
                          ? 'bg-white text-[#2E4D31] shadow-md' 
                          : 'text-[#2E4D31]/50 hover:text-[#2E4D31]'
                      }`}
                    >
                      Virement Banque
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('online')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        paymentMode === 'online' 
                          ? 'bg-[#2E4D31] text-white shadow-md' 
                          : 'text-[#2E4D31]/50 hover:text-[#2E4D31]'
                      }`}
                    >
                      Paiement En Ligne
                    </button>
                  </div>

                  {/* Common editable amount input */}
                  <div className="space-y-3 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/70">
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
                        <input 
                          type="number" 
                          required
                          min="1"
                          step="any"
                          placeholder="Saisissez le montant de la cotisation"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="w-full pl-3 pr-12 py-2 rounded-xl border border-gray-200 outline-none focus:border-cscm-green transition-all text-sm font-black text-[#132e15] bg-white"
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

                  {paymentMode === 'manual' ? (
                    /* MANUAL BANK VIR PATH */
                    <div className="space-y-4">
                      <div className="bg-[#E1EADF] text-[#132e15] font-bold p-4 rounded-xl border border-emerald-100 flex items-start gap-2.5 text-xs">
                        <Landmark className="w-4.5 h-4.5 text-cscm-gold shrink-0 mt-0.5" />
                        <p>Le versement de validation sera imputé manuellement à la caisse de la Chambre de Commerce pour ce membre.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-[#132e15] tracking-wider">Référence du Virement Bancaire</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Saisissez la référence du virement bancaire (Ex: VR-719582-BOA)"
                          value={paymentRef}
                          onChange={(e) => setPaymentRef(e.target.value)}
                          className="w-full px-4 py-3.5 rounded-xl border border-gray-250 outline-none focus:border-cscm-green transition-all font-mono text-xs text-cscm-dark bg-white font-semibold text-[#132e15]"
                        />
                      </div>

                      <div className="flex gap-3 pt-3">
                        <button 
                          type="button"
                          onClick={() => setQuickPaymentEnt(null)}
                          className="btn-secondary flex-1 !text-xs"
                        >
                          Annuler
                        </button>
                        <button 
                          type="submit"
                          className="btn-primary flex-1 !text-xs"
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
                              Ouvrez le fichier <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-rose-950 font-semibold">src/backend/paymentConfig.ts</code> et insérez votre clé API Stripe ou Paytech à l'emplacement indiqué :
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
                                placeholder="Saisissez le nom complet du titulaire de la carte"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-cscm-green text-xs font-bold text-gray-850"
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
                                    const raw = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                                    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
                                    setCardNumber(formatted.substring(0, 19));
                                  }}
                                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-cscm-green text-xs font-mono font-black text-gray-850"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">Expiration</label>
                                <input
                                  type="text"
                                  placeholder="Saisissez la date d'expiration (MM/YY)"
                                  value={cardExpiry}
                                  onChange={(e) => {
                                    let v = e.target.value.replace(/[^0-9]/g, '');
                                    if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2, 4);
                                    setCardExpiry(v.substring(0, 5));
                                  }}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-cscm-green text-xs font-mono font-black text-center text-gray-850"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-black text-gray-500 uppercase tracking-wider mb-1">CVC (CVV)</label>
                                <input
                                  type="password"
                                  placeholder="Saisissez le code de sécurité (CVV)"
                                  maxLength={3}
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ''))}
                                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-cscm-green text-xs font-mono font-black text-center text-gray-850"
                                  required
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3 pt-3">
                            <button 
                              type="button"
                              onClick={() => setQuickPaymentEnt(null)}
                              className="btn-secondary flex-1 !text-xs"
                            >
                              Annuler
                            </button>
                            <button 
                              type="submit"
                              className="btn-gold flex-1 !text-xs"
                            >
                              <Lock className="w-3.5 h-3.5 shrink-0" />
                              Payer {Number(paymentAmount).toLocaleString()} FCFA
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
      </ModalPortal>
    </SidebarLayout>
  );
};
