import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, Pencil, Plus, Eye } from 'lucide-react';
import { EditFormModal } from './EditFormModal';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

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

  if (!isOpen) return null;

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
    if (!enterprise.cotisations) return 0;
    return enterprise.cotisations.reduce((sum: number, cot: any) => sum + (Number(cot.amount) || 0), 0);
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
              <h3 className="text-3xl font-serif font-bold text-[#4A3728]">Informations générales</h3>
              <button 
                onClick={() => handleEdit('Informations générales')}
                className="bg-[#1A3F23] text-[#D4AF37] px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold border border-[#D4AF37] hover:bg-[#14321B] transition-colors"
              >
                <Pencil className="w-4 h-4" /> Modifier
              </button>
            </div>
            <div className="bg-[#D9D9D9] p-8 rounded-lg border border-gray-400 max-w-2xl mx-auto space-y-4">
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
                <div key={item.label} className="flex gap-4">
                  <span className="font-bold min-w-[150px]">{item.label} :</span>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Métiers & expertises':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-8 max-w-2xl mx-auto">
              <h3 className="text-3xl font-serif font-bold text-[#4A3728]">Métiers & expertises</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleEdit('Métiers & expertises', 'edit')}
                  className="bg-[#1A3F23] text-[#D4AF37] px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold border border-[#D4AF37] hover:bg-[#14321B] transition-colors"
                >
                  <Pencil className="w-4 h-4" /> Modifier
                </button>
              </div>
            </div>
            <div className="bg-[#D9D9D9] p-8 rounded-lg border border-gray-400 max-w-2xl mx-auto space-y-4">
              {[
                { label: "Secteur d'activité", value: enterprise.secteur || '' },
                { label: "Expertise principale", value: enterprise.expertisePrincipale || '' },
                { label: "Produits / Services", value: enterprise.produitsServices || '' },
                { label: "Technologies utilisées", value: enterprise.technologies || '' },
                { label: "Marchés cibles", value: enterprise.marchesCibles || '' },
                { label: "Clients références", value: enterprise.clientsReferences || '' },
                { label: "Niveau expertise", value: enterprise.niveauExpertise || '' },
              ].map((item) => (
                <div key={item.label} className="flex gap-4">
                  <span className="font-bold min-w-[180px]">{item.label} :</span>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      case 'Certifications':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-8 max-w-3xl mx-auto">
              <h3 className="text-3xl font-serif font-bold text-[#4A3728]">Certifications</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleEdit('Certifications', 'add')}
                  className="bg-[#1A3F23] text-[#D4AF37] px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold border border-[#D4AF37] hover:bg-[#14321B] transition-colors"
                >
                  <div className="bg-[#D4AF37] rounded p-0.5"><Plus className="w-3 h-3 text-[#1A3F23]" /></div> Ajouter une certifications
                </button>
                <button 
                  onClick={() => handleEdit('Certifications', 'edit', selectedItemIndex)}
                  className="bg-[#1A3F23] text-[#D4AF37] px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold border border-[#D4AF37] hover:bg-[#14321B] transition-colors"
                >
                  <Pencil className="w-4 h-4" /> Modifier
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-w-3xl mx-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#C4B7A6] text-sm">
                    <th className="border border-gray-400 p-2">Certification (s)</th>
                    <th className="border border-gray-400 p-2">Code (s)</th>
                    <th className="border border-gray-400 p-2">Date</th>
                    <th className="border border-gray-400 p-2">Organisme</th>
                  </tr>
                </thead>
                <tbody className="bg-[#D9D9D9]">
                  {enterprise.certifications && enterprise.certifications.length > 0 ? (
                    enterprise.certifications.map((cert: any, i: number) => (
                      <tr 
                        key={i} 
                        onClick={() => setSelectedItemIndex(i)}
                        className={`cursor-pointer transition-colors ${selectedItemIndex === i ? 'bg-[#D4AF37]/20' : 'hover:bg-gray-200'}`}
                      >
                        <td className="border border-gray-400 p-2 h-8">{cert.name}</td>
                        <td className="border border-gray-400 p-2 h-8">{cert.code}</td>
                        <td className="border border-gray-400 p-2 h-8">{cert.date}</td>
                        <td className="border border-gray-400 p-2 h-8">{cert.issuer}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="border border-gray-400 p-4 text-center text-gray-500 italic">
                        Aucune certification enregistrée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'Données financières':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-8 max-w-3xl mx-auto">
              <h3 className="text-3xl font-serif font-bold text-[#4A3728]">Données Financières</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleEdit('Données financières', 'add')}
                  className="bg-[#1A3F23] text-[#D4AF37] px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold border border-[#D4AF37] hover:bg-[#14321B] transition-colors"
                >
                  <div className="bg-[#D4AF37] rounded p-0.5"><Plus className="w-3 h-3 text-[#1A3F23]" /></div> Ajouter donnée
                </button>
                <button 
                  onClick={() => handleEdit('Données financières', 'edit', selectedItemIndex)}
                  className="bg-[#1A3F23] text-[#D4AF37] px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold border border-[#D4AF37] hover:bg-[#14321B] transition-colors"
                >
                  <Pencil className="w-4 h-4" /> Modifier
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-w-3xl mx-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#C4B7A6] text-sm">
                    <th className="border border-gray-400 p-2">Année</th>
                    <th className="border border-gray-400 p-2">CA</th>
                    <th className="border border-gray-400 p-2">Export</th>
                    <th className="border border-gray-400 p-2">Résultat net</th>
                    <th className="border border-gray-400 p-2">Devise</th>
                  </tr>
                </thead>
                <tbody className="bg-[#D9D9D9]">
                  {enterprise.financialData && enterprise.financialData.length > 0 ? (
                    enterprise.financialData.map((fin: any, i: number) => (
                      <tr 
                        key={i}
                        onClick={() => setSelectedItemIndex(i)}
                        className={`cursor-pointer transition-colors ${selectedItemIndex === i ? 'bg-[#D4AF37]/20' : 'hover:bg-gray-200'}`}
                      >
                        <td className="border border-gray-400 p-2 h-8">{fin.year}</td>
                        <td className="border border-gray-400 p-2 h-8 text-right">{Number(fin.ca).toLocaleString()}</td>
                        <td className="border border-gray-400 p-2 h-8 text-right">{Number(fin.export).toLocaleString()}</td>
                        <td className="border border-gray-400 p-2 h-8 text-right">{Number(fin.resultatNet).toLocaleString()}</td>
                        <td className="border border-gray-400 p-2 h-8 text-center">{fin.devise}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="border border-gray-400 p-4 text-center text-gray-500 italic">
                        Aucune donnée financière enregistrée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'Besoins':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-8 max-w-3xl mx-auto">
              <h3 className="text-3xl font-serif font-bold text-[#4A3728]">Besoins</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleEdit('Besoins', 'add')}
                  className="bg-[#1A3F23] text-[#D4AF37] px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold border border-[#D4AF37] hover:bg-[#14321B] transition-colors"
                >
                  <div className="bg-[#D4AF37] rounded p-0.5"><Plus className="w-3 h-3 text-[#1A3F23]" /></div> Ajouter Besoin
                </button>
                <button 
                  onClick={() => handleEdit('Besoins', 'edit', selectedItemIndex)}
                  className="bg-[#1A3F23] text-[#D4AF37] px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold border border-[#D4AF37] hover:bg-[#14321B] transition-colors"
                >
                  <Pencil className="w-4 h-4" /> Modifier
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-w-3xl mx-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#C4B7A6] text-sm">
                    <th className="border border-gray-400 p-2">Titre</th>
                    <th className="border border-gray-400 p-2">Type</th>
                    <th className="border border-gray-400 p-2">Budget</th>
                    <th className="border border-gray-400 p-2">Priorité</th>
                  </tr>
                </thead>
                <tbody className="bg-[#D9D9D9]">
                  {enterprise.besoins && enterprise.besoins.length > 0 ? (
                    enterprise.besoins.map((besoin: any, i: number) => (
                      <tr 
                        key={i}
                        onClick={() => setSelectedItemIndex(i)}
                        className={`cursor-pointer transition-colors ${selectedItemIndex === i ? 'bg-[#D4AF37]/20' : 'hover:bg-gray-200'}`}
                      >
                        <td className="border border-gray-400 p-2 h-8">{besoin.title}</td>
                        <td className="border border-gray-400 p-2 h-8">{besoin.type}</td>
                        <td className="border border-gray-400 p-2 h-8">{besoin.budget}</td>
                        <td className="border border-gray-400 p-2 h-8">{besoin.priority}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="border border-gray-400 p-4 text-center text-gray-500 italic">
                        Aucun besoin enregistré
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'Contacts':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-8 max-w-4xl mx-auto">
              <h3 className="text-3xl font-serif font-bold text-[#4A3728]">Contacts</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleEdit('Contacts', 'add')}
                  className="bg-[#1A3F23] text-[#D4AF37] px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold border border-[#D4AF37] hover:bg-[#14321B] transition-colors"
                >
                  <div className="bg-[#D4AF37] rounded p-0.5"><Plus className="w-3 h-3 text-[#1A3F23]" /></div> Ajouter Contact
                </button>
                <button 
                  onClick={() => handleEdit('Contacts', 'edit', selectedItemIndex)}
                  className="bg-[#1A3F23] text-[#D4AF37] px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold border border-[#D4AF37] hover:bg-[#14321B] transition-colors"
                >
                  <Pencil className="w-4 h-4" /> Modifier
                </button>
              </div>
            </div>
            <div className="overflow-x-auto max-w-4xl mx-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#C4B7A6] text-sm">
                    <th className="border border-gray-400 p-2">Nom</th>
                    <th className="border border-gray-400 p-2">Fonction</th>
                    <th className="border border-gray-400 p-2">Téléphone</th>
                    <th className="border border-gray-400 p-2">Email</th>
                    <th className="border border-gray-400 p-2">Principal</th>
                  </tr>
                </thead>
                <tbody className="bg-[#D9D9D9]">
                  {enterprise.contacts && enterprise.contacts.length > 0 ? (
                    enterprise.contacts.map((contact: any, i: number) => (
                      <tr 
                        key={i}
                        onClick={() => setSelectedItemIndex(i)}
                        className={`cursor-pointer transition-colors ${selectedItemIndex === i ? 'bg-[#D4AF37]/20' : 'hover:bg-gray-200'}`}
                      >
                        <td className="border border-gray-400 p-2 h-8">{contact.name}</td>
                        <td className="border border-gray-400 p-2 h-8">{contact.function}</td>
                        <td className="border border-gray-400 p-2 h-8">{contact.phone}</td>
                        <td className="border border-gray-400 p-2 h-8">{contact.email}</td>
                        <td className="border border-gray-400 p-2 h-8 text-center">{contact.isPrimary}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="border border-gray-400 p-4 text-center text-gray-500 italic">
                        Aucun contact enregistré
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'Cotisations':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-8 max-w-3xl mx-auto">
              <h3 className="text-3xl font-serif font-bold text-[#4A3728]">Historique des cotisations</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleEdit('Cotisations', 'add')}
                  className="bg-[#1A3F23] text-[#D4AF37] px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold border border-[#D4AF37] hover:bg-[#14321B] transition-colors"
                >
                  <div className="bg-[#D4AF37] rounded p-0.5"><Plus className="w-3 h-3 text-[#1A3F23]" /></div> Ajouter Cotisation
                </button>
                <button 
                  onClick={() => handleEdit('Cotisations', 'edit', selectedItemIndex)}
                  className="bg-[#1A3F23] text-[#D4AF37] px-4 py-1.5 rounded-full flex items-center gap-2 text-sm font-bold border border-[#D4AF37] hover:bg-[#14321B] transition-colors"
                >
                  <Pencil className="w-4 h-4" /> Modifier
                </button>
              </div>
            </div>

            <div className="max-w-3xl mx-auto mb-6">
              <div className="bg-[#1A3F23] text-[#D4AF37] p-4 rounded-lg border border-[#D4AF37] flex justify-between items-center">
                <span className="text-lg font-bold">Montant total en caisse :</span>
                <span className="text-2xl font-serif font-bold">{calculateTotalTreasury().toLocaleString()} FCFA</span>
              </div>
            </div>

            <div className="overflow-x-auto max-w-3xl mx-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#C4B7A6] text-sm">
                    <th className="border border-gray-400 p-2">Date</th>
                    <th className="border border-gray-400 p-2">Libellé / Motif</th>
                    <th className="border border-gray-400 p-2">Montant (FCFA)</th>
                  </tr>
                </thead>
                <tbody className="bg-[#D9D9D9]">
                  {enterprise.cotisations && enterprise.cotisations.length > 0 ? (
                    enterprise.cotisations.map((cot: any, i: number) => (
                      <tr 
                        key={i}
                        onClick={() => setSelectedItemIndex(i)}
                        className={`cursor-pointer transition-colors ${selectedItemIndex === i ? 'bg-[#D4AF37]/20' : 'hover:bg-gray-200'}`}
                      >
                        <td className="border border-gray-400 p-2 h-8">{cot.date}</td>
                        <td className="border border-gray-400 p-2 h-8">{cot.label}</td>
                        <td className="border border-gray-400 p-2 h-8 text-right font-mono">{Number(cot.amount).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="border border-gray-400 p-4 text-center text-gray-500 italic">
                        Aucune cotisation enregistrée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white w-full max-w-6xl rounded-xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[95vh]"
        >
          {/* Header Section */}
          <div className="p-8 border-b relative">
            <button onClick={onClose} className="absolute top-8 left-8 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft className="w-8 h-8 text-black" />
            </button>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8 mt-4">
              <div className="w-32 h-32 rounded-full border border-gray-300 flex items-center justify-center text-center p-2 text-[10px] font-bold overflow-hidden bg-gray-50">
                {enterprise.logo ? (
                  <img src={enterprise.logo} alt={enterprise.name} className="w-full h-full object-cover" />
                ) : (
                  <>LOGO<br/>Entreprise</>
                )}
              </div>
              <div className="text-sm space-y-1">
                <p>Numéro membre : {enterprise.memberNo}</p>
                <p>Statut membre : {enterprise.statutMembre}</p>
                <p>Date d'adhésion : {enterprise.dateAdhesion}</p>
                <p>Nom commercial : {enterprise.name}</p>
                <p>Raison sociale : {enterprise.raisonSociale}</p>
                <p>Secteur principal : {enterprise.secteur}</p>
                <p>Pays + ville : {enterprise.pays} {enterprise.ville}</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 py-4 border-b bg-white sticky top-0 z-20 px-8">
            {tabs.map((tab, index) => (
              <React.Fragment key={tab}>
                <button
                  onClick={() => {
                    setActiveTab(tab);
                    setSelectedItemIndex(null);
                  }}
                  className={`text-sm transition-colors ${
                    activeTab === tab 
                      ? 'text-[#1A3F23] font-bold underline underline-offset-8 decoration-2' 
                      : 'text-gray-600 hover:text-[#1A3F23]'
                  }`}
                >
                  {tab}
                </button>
                {index < tabs.length - 1 && (
                  <span className="text-gray-300 font-light">|</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8 bg-white relative">
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
    </AnimatePresence>
  );
};
