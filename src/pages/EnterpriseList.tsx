import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Filter, Search, Trash2, Eye, Plus, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from '../components/Navbar';
import { AddEnterpriseModal } from '../components/AddEnterpriseModal';
import { EnterpriseDetailModal } from '../components/EnterpriseDetailModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { EnterpriseSummaryModal } from '../components/EnterpriseSummaryModal';

export const EnterpriseList = () => {
  const navigate = useNavigate();
  const [isAddEnterpriseOpen, setIsAddEnterpriseOpen] = useState(false);
  const [selectedEnterprise, setSelectedEnterprise] = useState<any>(null);
  const [enterpriseToSummary, setEnterpriseToSummary] = useState<any>(null);
  const [enterpriseToDelete, setEnterpriseToDelete] = useState<any>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const sectors = [
    { name: 'AGRICULTURE', value: 'XX' },
    { name: 'AGRO', value: 'XX' },
    { name: 'BTP', value: 'XX' },
    { name: 'ENERGIE', value: 'XX' },
    { name: 'FINANCE', value: 'XX' },
    { name: 'IT', value: 'XX' },
    { name: 'TRANSPORT', value: 'XX' },
    { name: 'TOURISME', value: 'XX' },
    { name: 'EDUCATION', value: 'XX' },
  ];

  const [enterprises, setEnterprises] = useState([
    { id: 1, name: 'Entreprise A', memberNo: 'M001', statutMembre: 'Actif', dateAdhesion: '12/01/2024', raisonSociale: 'SARL A', pays: 'Sénégal', ville: 'Dakar', secteur: 'IT', effectif: '50', formeJuridique: 'SARL', numRC: 'RC-123', ninea: 'N-456', dateCreation: '01/01/2020', adresse: 'Rue 123', telephone: '+221...', email: 'contact@a.com', siteWeb: 'www.a.com', description: 'Services IT spécialisés dans le développement web et mobile.', logo: null, cotisations: [{ date: '2024-01-15', label: 'Cotisation 2024', amount: 50000 }] },
    { id: 2, name: 'Entreprise B', memberNo: 'M002', statutMembre: 'Actif', dateAdhesion: '15/01/2024', raisonSociale: 'SA B', pays: 'Maroc', ville: 'Casablanca', secteur: 'BTP', effectif: '120', formeJuridique: 'SA', numRC: 'RC-789', ninea: 'N-012', dateCreation: '01/01/2015', adresse: 'Av. Hassan II', telephone: '+212...', email: 'info@b.ma', siteWeb: 'www.b.ma', description: 'Leader dans la construction d\'infrastructures routières et bâtiments.', logo: null, cotisations: [] },
    { id: 3, name: 'Entreprise C', memberNo: 'M003', statutMembre: 'Suspendu', dateAdhesion: '20/01/2024', raisonSociale: 'SARL C', pays: 'France', ville: 'Paris', secteur: 'Finance', effectif: '15', formeJuridique: 'SARL', numRC: 'RC-345', ninea: 'N-678', dateCreation: '01/01/2022', adresse: 'Rue de Rivoli', telephone: '+33...', email: 'hello@c.fr', siteWeb: 'www.c.fr', description: 'Cabinet de conseil en stratégie financière pour PME.', logo: null, cotisations: [] },
  ]);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    pays: '',
    ville: '',
    secteur: '',
    typeMembre: '',
    taille: ''
  });

  const handleAddEnterprise = (newEnterprise: any) => {
    setEnterprises(prev => [...prev, newEnterprise]);
    setIsAddEnterpriseOpen(false);
    setFeedbackMessage({ type: 'success', text: 'L\'entreprise a été ajoutée avec succès.' });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleUpdateEnterprise = (updatedEnterprise: any) => {
    setEnterprises(prev => prev.map(e => e.id === updatedEnterprise.id ? updatedEnterprise : e));
    if (selectedEnterprise?.id === updatedEnterprise.id) {
      setSelectedEnterprise(updatedEnterprise);
    }
  };

  const totalCotisations = enterprises.reduce((total, ent) => {
    const enterpriseTotal = (ent.cotisations || []).reduce((sum, cot) => sum + (Number(cot.amount) || 0), 0);
    return total + enterpriseTotal;
  }, 0);

  const filteredEnterprises = enterprises.filter(ent => {
    const matchesSearch = (ent.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (ent.memberNo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (ent.raisonSociale || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPays = !filters.pays || ent.pays === filters.pays;
    const matchesVille = !filters.ville || ent.ville === filters.ville;
    const matchesSecteur = !filters.secteur || ent.secteur === filters.secteur;
    const matchesStatut = !filters.typeMembre || ent.statutMembre === filters.typeMembre;
    
    // Simple size logic for demo
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
        // Mock successful deletion
        setEnterprises(prev => prev.filter(e => e.id !== enterpriseToDelete.id));
        setFeedbackMessage({ type: 'success', text: 'L\'entreprise a été supprimée avec succès.' });
        setEnterpriseToDelete(null);
        
        // Clear feedback after 3 seconds
        setTimeout(() => setFeedbackMessage(null), 3000);
      } catch (error) {
        setFeedbackMessage({ type: 'error', text: 'Une erreur est survenue lors de la suppression.' });
        setTimeout(() => setFeedbackMessage(null), 3000);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#4A3728] font-serif">
      <Navbar />

      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-0 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl font-bold border-2 ${
              feedbackMessage.type === 'success' 
                ? 'bg-green-100 text-green-800 border-green-500' 
                : 'bg-red-100 text-red-800 border-red-500'
            }`}
          >
            {feedbackMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1400px] mx-auto p-4 md:p-8">
        {/* Navigation & Add Button */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-3 bg-white rounded-xl shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
          >
            <Home className="w-8 h-8 text-[#4A3728]" />
          </button>

          <button 
            onClick={() => setIsAddEnterpriseOpen(true)}
            className="bg-[#1A3F23] text-[#D4AF37] px-6 py-3 rounded-xl flex items-center gap-3 hover:bg-[#14321B] transition-all shadow-lg font-bold border border-[#D4AF37]"
          >
            <div className="bg-[#D4AF37] p-1 rounded">
              <Plus className="w-5 h-5 text-[#1A3F23]" />
            </div>
            Ajouter une entreprise
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-3 rounded-lg shadow-inner border transition-colors ${isFilterOpen ? 'bg-[#1A3F23] text-[#D4AF37] border-[#D4AF37]' : 'bg-[#D1D5DB] text-[#4A3728] border-gray-300'}`}
            >
              <Filter className="w-6 h-6" />
            </button>
            <div className="relative flex-1 w-full">
              <input 
                type="text" 
                placeholder="Recherche entreprise"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full p-4 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-[#1A3F23] outline-none text-lg italic"
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
            </div>
          </div>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-[#C4B7A6] p-6 rounded-xl shadow-lg border border-[#4A3728]/20 flex flex-wrap gap-6 justify-center">
                  {[
                    { 
                      label: 'Pays', 
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
                    { label: 'Secteur', key: 'secteur', options: ['IT', 'BTP', 'Finance', 'Agriculture', 'Commerce', 'Services', 'Industrie', 'Santé', 'Éducation', 'Tourisme', 'Autre'] },
                    { label: 'Type membre', key: 'typeMembre', options: ['Actif', 'Suspendu', 'Radié'] },
                    { label: 'Taille entreprise', key: 'taille', options: ['Petite', 'Moyenne', 'Grande'] },
                  ].map((filter) => (
                    <div key={filter.key} className="flex flex-col gap-1">
                      <label className="text-sm font-bold text-[#4A3728] text-center">{filter.label}</label>
                      <select 
                        value={(filters as any)[filter.key]}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setFilters(prev => {
                            const updated = { ...prev, [filter.key]: newValue };
                            // Reset city if country changes
                            if (filter.key === 'pays') {
                              updated.ville = '';
                            }
                            return updated;
                          });
                        }}
                        className="bg-white border border-gray-400 rounded px-3 py-1 text-sm outline-none min-w-[150px]"
                      >
                        <option value="">Tous</option>
                        {filter.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  ))}
                  <div className="flex items-end">
                    <button 
                      onClick={() => setFilters({ pays: '', ville: '', secteur: '', typeMembre: '', taille: '' })}
                      className="text-xs font-bold text-[#1A3F23] underline hover:text-[#14321B]"
                    >
                      Réinitialiser
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-8">
          <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-md border border-gray-200 flex flex-col justify-center items-center text-center">
            <p className="text-sm font-bold mb-2">Entreprises membres :</p>
            <span className="text-3xl font-bold text-[#D4AF37]">{enterprises.length}</span>
          </div>
          <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-md border border-gray-200 flex flex-col justify-center items-center text-center">
            <p className="text-sm font-bold mb-2">Montants des cotisations :</p>
            <span className="text-xl font-bold text-[#D4AF37]">{totalCotisations.toLocaleString()} FCFA</span>
          </div>
          <div className="lg:col-span-8 bg-white p-4 rounded-xl shadow-md border border-gray-200">
            <p className="text-center font-bold mb-4 text-sm">Entreprises membres par secteurs :</p>
            <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
              {sectors.map((sector) => (
                <div key={sector.name} className="flex flex-col items-center text-center">
                  <span className="text-[10px] font-bold leading-tight mb-1">{sector.name}</span>
                  <span className="text-xl font-bold text-[#D4AF37]">
                    {enterprises.filter(e => (e.secteur || '').toUpperCase() === sector.name).length || '0'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-sm font-bold">
                  <th className="p-4 border-b border-r">Nom de l'entreprise</th>
                  <th className="p-4 border-b border-r">N° Membre</th>
                  <th className="p-4 border-b border-r">Raison sociale</th>
                  <th className="p-4 border-b border-r">Pays</th>
                  <th className="p-4 border-b border-r">Ville</th>
                  <th className="p-4 border-b border-r">Secteur d'activité</th>
                  <th className="p-4 border-b border-r">Effectif</th>
                  <th className="p-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnterprises.map((ent) => (
                  <tr key={ent.id} className="bg-[#C1D3C6] hover:bg-[#B1C3B6] transition-colors border-b border-white">
                    <td className="p-4 border-r border-white font-medium flex items-center gap-3">
                      {ent.logo ? (
                        <img src={ent.logo} alt={ent.name} className="w-8 h-8 rounded-full object-cover border border-gray-300" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-[8px] font-bold text-center p-0.5 border border-gray-400">
                          LOGO
                        </div>
                      )}
                      {ent.name}
                    </td>
                    <td className="p-4 border-r border-white">{ent.memberNo}</td>
                    <td className="p-4 border-r border-white">{ent.raisonSociale}</td>
                    <td className="p-4 border-r border-white">{ent.pays}</td>
                    <td className="p-4 border-r border-white">{ent.ville}</td>
                    <td className="p-4 border-r border-white">{ent.secteur}</td>
                    <td className="p-4 border-r border-white">{ent.effectif}</td>
                    <td className="p-4 flex items-center gap-3">
                      <button 
                        onClick={() => setEnterpriseToDelete(ent)}
                        className="p-1 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setEnterpriseToSummary(ent)}
                        className="p-1 hover:text-blue-600 transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => setSelectedEnterprise(ent)}
                        className="bg-[#1A3F23] text-[#D4AF37] px-4 py-1 rounded-lg text-sm font-bold hover:bg-[#14321B] transition-colors flex items-center gap-2 border border-[#D4AF37]"
                      >
                        Détails <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEnterprises.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500 italic">
                      Aucune entreprise ne correspond à vos critères.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddEnterpriseModal 
        isOpen={isAddEnterpriseOpen} 
        onClose={() => setIsAddEnterpriseOpen(false)} 
        onAdd={handleAddEnterprise}
      />
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
    </div>
  );
};
