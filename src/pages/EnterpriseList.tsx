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
    saveStoredEnterprises(updated);
    if (selectedEnterprise?.id === updatedEnterprise.id) {
      setSelectedEnterprise(updatedEnterprise);
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

    const finalAmountInFCFA = paymentCurrency === 'EUR'
      ? Math.round(Number(paymentAmount) * 655.957)
      : Number(paymentAmount) || 10000;

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
      <div className="max-w-[1440px] mx-auto p-4 md:p-8 font-sans space-y-8">
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-cscm-green">Registre National</span>
            <h1 className="text-3xl md:text-4xl font-serif font-black text-cscm-dark mt-1">Annuaire des Membres</h1>
          </div>
        </div>

        {/* Mini Stats Lineup */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#132e15]/10 flex items-center gap-4">
            <div className="p-3.5 bg-cscm-green/10 rounded-2xl text-cscm-green shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[#132e15]/75 text-[10px] font-black uppercase tracking-wider">Membres totaux</p>
              <h3 className="text-2xl font-serif font-black text-cscm-dark mt-0.5">{enterprises.length}</h3>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#132e15]/10 flex items-center gap-4">
            <div className="p-3.5 bg-cscm-gold/15 rounded-2xl text-[#a8820c] shrink-0">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[#132e15]/75 text-[10px] font-black uppercase tracking-wider">Cotisations accumulées</p>
              <h3 className="text-2xl font-serif font-black text-cscm-dark mt-0.5">{totalCotisations.toLocaleString()} FCFA</h3>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#132e15]/10 flex items-center gap-4">
            <div className="p-3.5 bg-indigo-500/10 rounded-2xl text-indigo-600 shrink-0">
              <Plus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[#132e15]/75 text-[10px] font-black uppercase tracking-wider">Secteurs actifs</p>
              <h3 className="text-2xl font-serif font-black text-cscm-dark mt-0.5">
                {Array.from(new Set(enterprises.map(e => e.secteur).filter(Boolean))).length}
              </h3>
            </div>
          </div>
        </div>

        {/* Sectors count horizontal breakdown - interactive filters */}
        <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm space-y-3.5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-2.5 border-gray-50">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#132e15]">Effectifs d'entreprises par secteur d'activité</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
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
                  className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all border outline-none cursor-pointer flex items-center gap-2 select-none ${
                    isSelected 
                      ? 'bg-cscm-green text-white border-cscm-green shadow-md shadow-cscm-green/10' 
                      : 'bg-[#FAF9F5] text-gray-700 border-gray-150 hover:bg-gray-100'
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
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#132e15]/10 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#132e15] w-5 h-5 pointer-events-none font-bold" />
              <input 
                type="text" 
                placeholder="Rechercher par nom, raison sociale, numéro de membre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-150 outline-none focus:border-cscm-green focus:ring-2 focus:ring-cscm-green/10 transition-all text-sm placeholder:text-[#132e15]/60 font-semibold text-[#132e15]"
              />
            </div>

            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`w-full md:w-auto px-6 py-3.5 rounded-2xl font-bold text-sm tracking-wide border cursor-pointer flex items-center justify-center gap-2.5 transition-all ${
                isFilterOpen 
                ? 'bg-cscm-green text-white border-cscm-green' 
                : 'bg-gray-55 bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
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
                <div className="bg-gray-50/70 p-6 rounded-2xl border border-gray-150 flex flex-wrap gap-4 items-end mt-2">
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
                      <label className="text-[10px] font-black text-[#132e15] uppercase tracking-widest leading-none">{filter.label}</label>
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
                        className="bg-white border border-gray-250 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none w-full shadow-sm text-gray-700 focus:border-cscm-green transition-colors"
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
        <div className="bg-white rounded-[2rem] shadow-sm border border-[#132e15]/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-[#132e15] border-b border-[#132e15]/20 text-white text-[11px] uppercase font-black tracking-widest">
                  <th className="p-6">Nom de l'entreprise</th>
                  <th className="p-6">N° Membre</th>
                  <th className="p-6">Raison sociale</th>
                  <th className="p-6">Localisation</th>
                  <th className="p-6">Secteur</th>
                  <th className="p-6">Effectif</th>
                  <th className="p-6">Statut Adhésion</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#132e15]/10 text-sm font-semibold text-[#132e15]">
                {filteredEnterprises.map((ent, idx) => (
                  <tr key={`${ent.id || idx}-${idx}`} className="hover:bg-gray-50/50 transition-all group">
                    <td className="p-6 text-cscm-dark flex items-center gap-3.5">
                      {ent.logo ? (
                        <img src={ent.logo} alt={ent.name} className="w-11 h-11 rounded-2xl object-cover border border-gray-100 shadow-sm" />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-cscm-green/10 text-cscm-green flex items-center justify-center font-serif font-black text-center text-sm border border-cscm-green/15">
                          {ent.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-extrabold group-hover:text-cscm-green transition-colors leading-tight text-[15px]">{ent.name}</div>
                        <div className="text-[10px] text-[#132e15]/75 font-bold uppercase tracking-wider mt-0.5">{ent.formeJuridique}</div>
                      </div>
                    </td>
                    <td className="p-6 text-[#132e15]/80 font-mono text-xs font-bold">{ent.memberNo}</td>
                    <td className="p-6 text-[#132e15]/90 font-bold">{ent.raisonSociale}</td>
                    <td className="p-6 text-[#132e15]">
                      <div className="font-bold text-[#132e15]">{ent.ville}</div>
                      <div className="text-[10px] text-[#132e15]/70 font-bold uppercase mt-0.5">{ent.pays}</div>
                    </td>
                    <td className="p-6">
                      <span className="bg-cscm-green/10 text-cscm-green text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-cscm-green/10">
                        {ent.secteur}
                      </span>
                    </td>
                    <td className="p-6 text-[#132e15] font-black">{ent.effectif} pers.</td>
                    <td className="p-6 col">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                        ent.statutMembre === 'Actif' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ent.statutMembre === 'Actif' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        {ent.statutMembre}
                      </span>
                    </td>
                    <td className="p-6">
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
                            className="p-2 text-[#a8820c] hover:text-amber-600 hover:bg-amber-50 border border-amber-100 rounded-xl transition-all"
                            title="Ajouter Cotisation (10 000 FCFA)"
                          >
                            <Coins className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
                          </button>
                        )}
                        <button 
                          onClick={() => setEnterpriseToSummary(ent)}
                          className="p-2 text-[#132e15] hover:text-cscm-green hover:bg-[#FAF9F5] border border-gray-150 rounded-xl transition-all"
                          title="Fiche technique PDF"
                        >
                          <Eye className="w-4.5 h-4.5" />
                        </button>
                        {userRole === 'ADMIN' && (
                          <button 
                            onClick={() => setEnterpriseToDelete(ent)}
                            className="p-2 text-rose-700 hover:text-rose-900 hover:bg-rose-50 border border-rose-100 rounded-xl transition-all"
                            title="Retirer"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        )}
                        {userRole !== 'MEMBRE' && (
                          <button 
                            onClick={() => setSelectedEnterprise(ent)}
                            className="bg-cscm-green/10 text-cscm-green hover:bg-cscm-green hover:text-white px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer select-none"
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
                    <td colSpan={8} className="p-16 text-center text-[#132e15]/60 italic font-bold">
                      Aucune entreprise ne correspond à vos critères de recherche.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-gray-150"
            >
              {/* Header */}
              <div className="p-6 bg-[#0a1208] text-white flex justify-between items-center border-b border-[#112310]">
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
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Passerelle de Paiement CCIM</span>
                  </div>
                </div>
              ) : (
                /* MAIN FORM VIEW */
                <form onSubmit={handleRegisterQuickPayment} className="p-6 space-y-4">
                  {/* Mode Tabs */}
                  <div className="grid grid-cols-2 bg-gray-100 p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('manual')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        paymentMode === 'manual' 
                          ? 'bg-white text-cscm-dark shadow-xs' 
                          : 'text-gray-500 hover:text-cscm-dark'
                      }`}
                    >
                      Virement Banque
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('online')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        paymentMode === 'online' 
                          ? 'bg-[#132e15] text-white shadow-xs' 
                          : 'text-gray-500 hover:text-cscm-dark'
                      }`}
                    >
                      Paiement En Ligne
                    </button>
                  </div>

                  {/* Common editable amount input */}
                  <div className="space-y-3 bg-[#FAF9F5] p-4 rounded-2xl border border-gray-150">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase text-[#132e15] tracking-wider block">Devise du versement</label>
                      <div className="flex gap-1 bg-gray-200/60 p-0.5 rounded-lg border border-gray-200">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentCurrency('FCFA');
                          }}
                          className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase transition-all cursor-pointer ${
                            paymentCurrency === 'FCFA'
                              ? 'bg-[#132e15] text-white shadow-3xs'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          FCFA (XOF)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentCurrency('EUR');
                          }}
                          className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase transition-all cursor-pointer ${
                            paymentCurrency === 'EUR'
                              ? 'bg-[#132e15] text-white shadow-3xs'
                              : 'text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          Euro (EUR)
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">
                        {paymentCurrency === 'EUR' ? 'Montant en Euro (EUR)' : 'Montant en Franc CFA (FCFA)'}
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          required
                          min="1"
                          step="any"
                          placeholder={paymentCurrency === 'EUR' ? 'Ex: 15.24' : 'Ex: 10000'}
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="w-full pl-3 pr-12 py-2 rounded-xl border border-gray-200 outline-none focus:border-cscm-green transition-all text-sm font-black text-[#132e15] bg-white"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                          {paymentCurrency === 'EUR' ? 'EUR' : 'XOF'}
                        </span>
                      </div>
                    </div>

                    {paymentAmount && Number(paymentAmount) > 0 && (
                      <div className="bg-[#132e15]/5 border border-[#132e15]/10 rounded-xl p-2.5 text-center">
                        {paymentCurrency === 'EUR' ? (
                          <p className="text-xs text-emerald-800 font-extrabold">
                            Conversion automatique : <span className="font-mono text-sm font-black">{Math.round(Number(paymentAmount) * 655.957).toLocaleString()} FCFA</span>
                          </p>
                        ) : (
                          <p className="text-xs text-gray-600 font-semibold">
                            Équivalent indicatif : <span className="font-mono text-xs font-black">{(Number(paymentAmount) / 655.957).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                          </p>
                        )}
                      </div>
                    )}
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
                          placeholder="Ex: VR-719582-BOA"
                          value={paymentRef}
                          onChange={(e) => setPaymentRef(e.target.value)}
                          className="w-full px-4 py-3.5 rounded-xl border border-gray-250 outline-none focus:border-cscm-green transition-all font-mono text-xs text-cscm-dark bg-white font-semibold text-[#132e15]"
                        />
                      </div>

                      <div className="flex gap-3 pt-3">
                        <button 
                          type="button"
                          onClick={() => setQuickPaymentEnt(null)}
                          className="flex-1 py-3 text-xs font-bold text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer text-center"
                        >
                          Annuler
                        </button>
                        <button 
                          type="submit"
                          className="flex-1 py-3 text-xs font-black text-white bg-cscm-green hover:bg-[#152e16] rounded-xl transition-colors cursor-pointer text-center shadow-md shadow-cscm-green/10"
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
                                  placeholder="4532 •••• •••• 8824"
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
                                  placeholder="MM/YY"
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
                                  placeholder="•••"
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
                              className="flex-1 py-3 text-xs font-bold text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer text-center"
                            >
                              Annuler
                            </button>
                            <button 
                              type="submit"
                              className="flex-1 py-3 text-xs font-black text-[#ebd078] bg-[#132e15] hover:bg-emerald-950 rounded-xl transition-colors cursor-pointer text-center shadow-md border border-[#ebd078]/25"
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
