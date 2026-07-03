import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Pencil, Check, ArrowLeft, Building2, UserCheck, ShieldCheck, MapPin, Contact, AlertCircle } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { getStoredEnterprises } from '../utils/enterpriseStorage';

// Automatic member number generator
const generateMemberNo = () => {
  const allEnterprises = getStoredEnterprises();
  let maxNum = 100;
  allEnterprises.forEach(ent => {
    const m = ent.memberNo && ent.memberNo.match(/^M(\d+)$/i);
    if (m) {
      const num = parseInt(m[1], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  });
  return `M${maxNum + 1}`;
};

interface AddEnterpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (newEnterprise: any) => void;
}

export const AddEnterpriseModal: React.FC<AddEnterpriseModalProps> = ({ isOpen, onClose, onAdd }) => {
  useBodyScrollLock(isOpen);

  const [logo, setLogo] = useState<string | null>(null);
  const [dupError, setDupError] = useState('');
  const [formData, setFormData] = useState(() => ({
    memberNo: generateMemberNo(),
    typeMembre: '',
    name: '',
    raisonSociale: '',
    formeJuridique: '',
    statutMembre: 'Actif',
    numRC: '',
    ninea: '',
    dateCreation: '',
    dateAdhesion: new Date().toISOString().split('T')[0],
    statutAdhesion: 'Actif',
    pays: '',
    ville: '',
    adresse: '',
    telephone: '',
    codePostal: '',
    telephoneSecondaire: '',
    telephonePrimaire: '',
    siteWeb: '',
    email: '',
    effectif: '',
    description: '',
    secteur: '',
    civilite: '',
    fonction: '',
    nomContact: '',
    prenomContact: '',
    emailContact: '',
    mobileContact: '',
  }));

  useEffect(() => {
    if (isOpen) {
      setFormData({
        memberNo: generateMemberNo(),
        typeMembre: '',
        name: '',
        raisonSociale: '',
        formeJuridique: '',
        statutMembre: 'Actif',
        numRC: '',
        ninea: '',
        dateCreation: '',
        dateAdhesion: new Date().toISOString().split('T')[0],
        statutAdhesion: 'Actif',
        pays: '',
        ville: '',
        adresse: '',
        telephone: '',
        codePostal: '',
        telephoneSecondaire: '',
        telephonePrimaire: '',
        siteWeb: '',
        email: '',
        effectif: '',
        description: '',
        secteur: '',
        civilite: '',
        fonction: '',
        nomContact: '',
        prenomContact: '',
        emailContact: '',
        mobileContact: '',
      });
      setLogo(null);
      setDupError('');
    }
  }, [isOpen]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check duplicates
    const allEnterprises = getStoredEnterprises();
    const cleanName = formData.name.trim().toLowerCase();
    
    const isNameDup = allEnterprises.some(ent => (ent.name || '').trim().toLowerCase() === cleanName);
    
    const inputMemberNo = (formData.memberNo || '').trim().toLowerCase();
    const isMemberDup = inputMemberNo ? allEnterprises.some(ent => (ent.memberNo || '').trim().toLowerCase() === inputMemberNo) : false;
    
    if (isNameDup) {
      setDupError(`L'entreprise "${formData.name}" existe déjà dans l'annuaire (Doublon détecté sur le nom).`);
      return;
    }
    
    if (isMemberDup) {
      setDupError(`Le numéro de membre "${formData.memberNo}" est déjà attribué (Doublon détecté).`);
      return;
    }
    
    setDupError('');

    if (onAdd) {
      const generatedNo = formData.memberNo.trim() || `M${Math.floor(100 + Math.random() * 900)}`;
      const newEnterprise = {
        ...formData,
        id: Date.now(),
        memberNo: generatedNo,
        logo,
        cotisations: [] // Initialize empty contribution history
      };
      onAdd(newEnterprise);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] bg-[#FAF9F5] flex flex-col h-screen min-h-screen overflow-hidden">
        
        {/* Full Page Slide-up container */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ type: 'spring', damping: 30, stiffness: 180 }}
          className="flex-1 flex flex-col h-full bg-[#FAF9F5] overflow-y-auto"
        >
          {/* Top Premium Sticky Header */}
          <header className="bg-[#132e15] border-b border-[#1f4021]/80 text-white sticky top-0 z-30 shadow-md">
            <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  type="button"
                  onClick={onClose} 
                  className="p-2.5 bg-white/10 hover:bg-white/20 text-[#ebd078] rounded-xl transition-all cursor-pointer flex items-center justify-center border border-white/5 active:scale-95"
                  title="Retour à l'annuaire"
                >
                  <ArrowLeft className="w-5 h-5 shrink-0" />
                </button>
                <div>
                  <span className="text-[10px] font-black uppercase text-[#ebd078] tracking-widest block leading-none">Formulaire de Saisie</span>
                  <h1 className="text-xl md:text-2xl font-serif font-black text-white mt-1">
                    Ajouter une Nouvelle Entreprise
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/10 text-[#ebd078] border border-white/5">
                  <UserCheck className="w-3.5 h-3.5 text-[#ebd078]" />
                  Admin
                </span>
                <button 
                  type="button"
                  onClick={onClose} 
                  className="p-2.5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-5xl mx-auto w-full px-4 md:px-8 py-8 md:py-12 flex-1 pb-24">
            <form onSubmit={handleSubmit} className="space-y-10">
              
              {dupError && (
                <div className="bg-rose-50 border-2 border-rose-100 p-4 rounded-2xl flex items-start gap-3 text-rose-800 text-sm font-bold shadow-sm">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-extrabold text-sm text-[#132e15]">Erreur de Doublon</p>
                    <p className="font-semibold text-xs text-rose-700 mt-1">{dupError}</p>
                  </div>
                </div>
              )}

              {/* SECTION 1: IDENTIFICATION & STATUT */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#132e15]/10 space-y-6">
                <div className="flex items-center gap-3 border-b border-[#132e15]/5 pb-4">
                  <div className="p-2.5 bg-cscm-green/10 text-[#132e15] rounded-xl border border-cscm-green/10">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-black text-[#132e15]">Information Membre & Identification</h3>
                    <p className="text-[10px] text-[#132e15]/60 font-medium">Type adhésion, Raison sociale et informations juridiques</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Numéro de membre */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Numéro de membre (Automatique)</label>
                    <input 
                      type="text" 
                      name="memberNo"
                      value={formData.memberNo}
                      readOnly
                      disabled
                      placeholder="Généré automatiquement"
                      className="w-full border-2 border-[#132e15]/10 text-gray-400 text-sm font-extrabold p-3 rounded-2xl bg-gray-100 outline-none cursor-not-allowed select-none transition-all" 
                    />
                  </div>

                  {/* Type membre */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Type de membre *</label>
                    <select 
                      name="typeMembre"
                      value={formData.typeMembre}
                      onChange={handleInputChange}
                      required
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all"
                    >
                      <option value="">Sélectionner</option>
                      <option value="Inscrit">Inscrit</option>
                      <option value="Associé">Associé</option>
                      <option value="Fondateur">Fondateur</option>
                      <option value="Honneur">Honneur</option>
                    </select>
                  </div>

                  {/* Statut membre */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Statut membre</label>
                    <select 
                      name="statutMembre"
                      value={formData.statutMembre}
                      onChange={handleInputChange}
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all"
                    >
                      <option value="Actif">Actif</option>
                      <option value="Suspendu">Suspendu</option>
                      <option value="Radié">Radié</option>
                    </select>
                  </div>

                  {/* Nom commercial */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Nom commercial *</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Ex: Innov Sénégal" 
                      required
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>

                  {/* Raison sociale */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Raison sociale *</label>
                    <input 
                      type="text" 
                      name="raisonSociale"
                      value={formData.raisonSociale}
                      onChange={handleInputChange}
                      placeholder="Ex: Innov Sénégal SARL" 
                      required
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>

                  {/* Forme juridique */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Forme juridique</label>
                    <select 
                      name="formeJuridique"
                      value={formData.formeJuridique}
                      onChange={handleInputChange}
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all"
                    >
                      <option value="">Sélectionner</option>
                      <option value="SARL">SARL</option>
                      <option value="SA">SA</option>
                      <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                    </select>
                  </div>

                  {/* Secteur d'activité */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Secteur d'activité *</label>
                    <select 
                      name="secteur"
                      value={formData.secteur}
                      onChange={handleInputChange}
                      required
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all"
                    >
                      <option value="">Sélectionner</option>
                      <option value="IT">IT</option>
                      <option value="BTP">BTP</option>
                      <option value="Finance">Finance</option>
                      <option value="Agriculture">Agriculture</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Services">Services</option>
                      <option value="Industrie">Industrie</option>
                      <option value="Santé">Santé</option>
                      <option value="Éducation">Éducation</option>
                      <option value="Tourisme">Tourisme</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                </div>
              </div>


              {/* SECTION 2: DOCUMENTS JURIDIQUES & ADHESION */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#132e15]/10 space-y-6">
                <div className="flex items-center gap-3 border-b border-[#132e15]/5 pb-4">
                  <div className="p-2.5 bg-cscm-green/10 text-[#132e15] rounded-xl border border-cscm-green/10">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-black text-[#132e15]">Enregistrements & Adhésion</h3>
                    <p className="text-[10px] text-[#132e15]/60 font-medium">Informations pour le suivi administratif et de conformité</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Numéro RC */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Numéro RC</label>
                    <input 
                      type="text" 
                      name="numRC"
                      value={formData.numRC}
                      onChange={handleInputChange}
                      placeholder="Ex: RC-DKR-2021-B-105" 
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>

                  {/* NINEA / ICE */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">NINEA / ICE</label>
                    <input 
                      type="text" 
                      name="ninea"
                      value={formData.ninea}
                      onChange={handleInputChange}
                      placeholder="Ex: 0028192-3G3" 
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>

                  {/* Date création */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Date création</label>
                    <input 
                      type="date" 
                      name="dateCreation"
                      value={formData.dateCreation}
                      onChange={handleInputChange}
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>

                  {/* Date d'adhésion */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Date d'adhésion</label>
                    <input 
                      type="date" 
                      name="dateAdhesion"
                      value={formData.dateAdhesion}
                      onChange={handleInputChange}
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>

                  {/* Statut adhésion */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Statut adhésion</label>
                    <select 
                      name="statutAdhesion"
                      value={formData.statutAdhesion}
                      onChange={handleInputChange}
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all"
                    >
                      <option value="Actif">Actif</option>
                      <option value="Suspendu">Suspendu</option>
                      <option value="Radié">Radié</option>
                    </select>
                  </div>
                </div>
              </div>


              {/* SECTION 3: LOCALISATION & COORDONNEES */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#132e15]/10 space-y-6">
                <div className="flex items-center gap-3 border-b border-[#132e15]/5 pb-4">
                  <div className="p-2.5 bg-cscm-green/10 text-[#132e15] rounded-xl border border-cscm-green/10">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-black text-[#132e15]">Coordonnées & géographie</h3>
                    <p className="text-[10px] text-[#132e15]/60 font-medium">Adresses, téléphones et canaux numériques de l'entreprise</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pays */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Pays</label>
                    <input 
                      type="text" 
                      name="pays"
                      value={formData.pays}
                      onChange={handleInputChange}
                      placeholder="Ex: Sénégal" 
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>

                  {/* Ville */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Ville</label>
                    <input 
                      type="text" 
                      name="ville"
                      value={formData.ville}
                      onChange={handleInputChange}
                      placeholder="Ex: Dakar" 
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>

                  {/* Adresse */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Adresse complète</label>
                    <input 
                      type="text" 
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleInputChange}
                      placeholder="Ex: Point E, Rue de Diourbel" 
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>

                  {/* Code postal */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Code postal</label>
                    <input 
                      type="text" 
                      name="codePostal"
                      value={formData.codePostal}
                      onChange={handleInputChange}
                      placeholder="Ex: 11000" 
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>

                  {/* Téléphone Principal */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Téléphone principal</label>
                    <input 
                      type="text" 
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleInputChange}
                      placeholder="Ex: +221 33 800 00 00" 
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>

                  {/* Téléphone secondaire */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Téléphone secondaire</label>
                    <input 
                      type="text" 
                      name="telephoneSecondaire"
                      value={formData.telephoneSecondaire}
                      onChange={handleInputChange}
                      placeholder="Ex: +221 77 123 45 67" 
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Email entreprise</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Ex: contact@entreprise.sn" 
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>

                  {/* Site web */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Site internet</label>
                    <input 
                      type="text" 
                      name="siteWeb"
                      value={formData.siteWeb}
                      onChange={handleInputChange}
                      placeholder="Ex: www.entreprise.sn" 
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>
                </div>
              </div>


              {/* SECTION 4: ACTIVITE & DESCRIPTION */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#132e15]/10 space-y-6">
                <div className="flex items-center gap-3 border-b border-[#132e15]/5 pb-4">
                  <div className="p-2.5 bg-cscm-green/10 text-[#132e15] rounded-xl border border-cscm-green/10">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-black text-[#132e15]">Données Opérationnelles</h3>
                    <p className="text-[10px] text-[#132e15]/60 font-medium">Taille de l'entreprise et description thématique</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Effectif */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Effectif d'employés</label>
                    <input 
                      type="text" 
                      name="effectif"
                      value={formData.effectif}
                      onChange={handleInputChange}
                      placeholder="Ex: 50" 
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Description de l'activité</label>
                    <input 
                      type="text" 
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Services technologiques, logistique portuaire..." 
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>
                </div>
              </div>


              {/* SECTION 5: ADHERENT DE CONTACT */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#132e15]/10 space-y-6">
                <div className="flex items-center gap-3 border-b border-[#132e15]/5 pb-4">
                  <div className="p-2.5 bg-cscm-green/10 text-[#132e15] rounded-xl border border-cscm-green/10">
                    <Contact className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-black text-[#132e15]">Contact principal / Représentant</h3>
                    <p className="text-[10px] text-[#132e15]/60 font-medium">Personne physique désignée pour repésenter le membre</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Civilité */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Civilité</label>
                    <select 
                      name="civilite"
                      value={formData.civilite}
                      onChange={handleInputChange}
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all"
                    >
                      <option value="">Sélectionner</option>
                      <option value="M">M</option>
                      <option value="Mme">Mme</option>
                      <option value="Dr">Dr</option>
                      <option value="Pr">Pr</option>
                    </select>
                  </div>

                  {/* Fonction */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Fonction</label>
                    <input 
                      type="text" 
                      name="fonction"
                      value={formData.fonction}
                      onChange={handleInputChange}
                      placeholder="Ex: Directeur Général" 
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>

                  {/* Nom */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Nom rep.</label>
                    <input 
                      type="text" 
                      name="nomContact"
                      value={formData.nomContact}
                      onChange={handleInputChange}
                      placeholder="Ex: Ndiaye" 
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>

                  {/* Prénom */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Prénom rep.</label>
                    <input 
                      type="text" 
                      name="prenomContact"
                      value={formData.prenomContact}
                      onChange={handleInputChange}
                      placeholder="Ex: Amadou" 
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>

                  {/* Email contact */}
                  <div className="space-y-2 border-none">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Email principal rep.</label>
                    <input 
                      type="email" 
                      name="emailContact"
                      value={formData.emailContact}
                      onChange={handleInputChange}
                      placeholder="Ex: amadou@innov.sn" 
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>

                  {/* Mobile contact */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Téléphone portable rep.</label>
                    <input 
                      type="text" 
                      name="mobileContact"
                      value={formData.mobileContact}
                      onChange={handleInputChange}
                      placeholder="Ex: +221 77 600 00 00" 
                      className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
                    />
                  </div>
                </div>
              </div>


              {/* FOOTER ACTIONS AND BRANDING LOGO */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-[#132e15]/10">
                <div className="flex items-center gap-5">
                  <div className="relative group shrink-0">
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleLogoChange} 
                      className="hidden" 
                      accept="image/*"
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-2xl bg-white flex flex-col items-center justify-center border-2 border-dashed border-[#132e15]/20 hover:border-[#132e15] hover:bg-cscm-green/5 transition-all overflow-hidden cursor-pointer"
                    >
                      {logo ? (
                        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-[#132e15]/40" />
                          <span className="text-[9px] text-[#132e15]/60 mt-1 font-bold">Logo</span>
                        </>
                      )}
                    </button>
                    <div className="absolute -top-1.5 -right-1.5 bg-[#ebd078] p-1.5 rounded-lg border border-[#132e15]/20 shadow-md">
                      <Pencil className="w-3.5 h-3.5 text-[#132e15]" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-serif font-black text-[#132e15]">Emblème Commercial</h4>
                    <p className="text-[10px] text-[#132e15]/60 font-medium">Chargez l'avatar officiel ou le logo HD de la société (.PNG, .JPG)</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none border-2 border-[#132e15]/20 hover:border-[#132e15] text-[#132e15] px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer select-none"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 sm:flex-none bg-[#132e15] text-[#ebd078] hover:bg-[#1f4222] px-10 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer select-none border border-[#ebd078]/20"
                  >
                    <Check className="w-4 h-4 text-[#ebd078]" />
                    Enregistrer Membre
                  </button>
                </div>
              </div>

            </form>
          </main>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
