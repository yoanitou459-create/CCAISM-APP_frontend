import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, Search, Trash2, Eye, Plus, ChevronRight, X, Building2, Landmark, CheckCircle2, AlertCircle, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SidebarLayout } from '../components/SidebarLayout';
import { EnterpriseDetailModal } from '../components/EnterpriseDetailModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { EnterpriseSummaryModal } from '../components/EnterpriseSummaryModal';
import { getStoredEnterprises, saveStoredEnterprises, Enterprise } from '../utils/enterpriseStorage';

export const EnterpriseList = () => {
  const navigate = useNavigate();
  const [selectedEnterprise, setSelectedEnterprise] = useState<any>(null);
  const [enterpriseToSummary, setEnterpriseToSummary] = useState<any>(null);
  const [enterpriseToDelete, setEnterpriseToDelete] = useState<any>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Quick payment setup state
  const [quickPaymentEnt, setQuickPaymentEnt] = useState<any>(null);
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentAmount] = useState('10000'); // Fixed at 10000 FCFA

  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [userRole, setUserRole] = useState<'ADMIN' | 'MODERATEUR' | 'MEMBRE'>('MEMBRE');

  const loadData = () => {
    setEnterprises(getStoredEnterprises());
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
                {filteredEnterprises.map((ent) => (
                  <tr key={ent.id} className="hover:bg-gray-50/50 transition-all group">
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
                            onClick={() => setQuickPaymentEnt(ent)}
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

      {/* Quick Bank Payment Cotisation Modal */}
      <AnimatePresence>
        {quickPaymentEnt && (
          <div className="fixed inset-0 bg-black/60 z-[120] backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-gray-150"
            >
              <div className="p-6 bg-[#0a1208] text-white flex justify-between items-center border-b border-[#112310]">
                <div>
                  <h3 className="text-sm font-serif font-black text-cscm-gold tracking-wide">Saisir Paiement Banque</h3>
                  <p className="text-[9px] text-white/70 font-bold uppercase tracking-wider mt-0.5">{quickPaymentEnt.name}</p>
                </div>
                <button 
                  onClick={() => setQuickPaymentEnt(null)}
                  className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const payment = {
                  date: new Date().toISOString().split('T')[0],
                  label: 'Cotisation Annuelle Fixe',
                  amount: 10000,
                  reference: paymentRef || 'Virement Bancaire Standard'
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
                  text: `Paiement de 10 000 FCFA validé pour ${quickPaymentEnt.name} !` 
                });
                // Alert listeners
                window.dispatchEvent(new Event('enterprises_updated'));
                setTimeout(() => setFeedbackMessage(null), 3500);
              }} className="p-6 space-y-4">
                <div className="bg-[#E1EADF] text-[#132e15] font-bold p-4 rounded-xl border border-emerald-100 flex items-start gap-2.5 text-xs">
                  <Landmark className="w-4.5 h-4.5 text-cscm-gold shrink-0 mt-0.5" />
                  <p>Montant fixé par la charte: <b>10 000 FCFA</b>. Le versement sera imputé à la caisse de la Chambre de Commerce.</p>
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
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </SidebarLayout>
  );
};
