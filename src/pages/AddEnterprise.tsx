import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/SidebarLayout';
import { Camera, Pencil, Check, ArrowLeft, Building2, ShieldCheck, MapPin, Contact, AlertCircle } from 'lucide-react';
import { getStoredEnterprises, saveStoredEnterprises } from '../utils/enterpriseStorage';

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

export const AddEnterprise: React.FC = () => {
  const navigate = useNavigate();
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

    const generatedNo = formData.memberNo.trim() || `M${Math.floor(100 + Math.random() * 900)}`;
    const newEnterprise = {
      ...formData,
      id: Date.now(),
      memberNo: generatedNo,
      logo,
      cotisations: [] // Initialize empty contribution history
    };

    const current = getStoredEnterprises();
    saveStoredEnterprises([...current, newEnterprise]);

    // Store a toast message in sessionStorage for persistent display after route change
    sessionStorage.setItem('cscm_toast_message', "L'entreprise a été ajoutée avec succès !");

    // Trigger update event across components
    window.dispatchEvent(new Event('enterprises_updated'));

    // Navigate to listing page
    navigate('/enterprises');
  };

  return (
    <SidebarLayout>
      <div className="max-w-5xl mx-auto w-full px-4 md:px-8 py-8 md:py-12 space-y-8 text-left pb-24">
        
        {/* Custom Header / Breadcrumbs inside page view */}
<<<<<<< HEAD
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
          <div className="space-y-2">
=======
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
          <div className="space-y-1">
>>>>>>> origin/main
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
              <button 
                type="button" 
                onClick={() => navigate('/enterprises')}
                className="hover:text-cscm-green transition-colors flex items-center gap-1"
              >
                Entreprises
              </button>
              <span>/</span>
              <span className="text-gray-400">Ajout</span>
            </div>
<<<<<<< HEAD
            <span className="badge-soft">Nouveau membre</span>
            <h1 className="page-title">
              Ajouter une Nouvelle Entreprise
            </h1>
            <p className="text-sm text-[#22301C]/55 font-medium max-w-2xl">
=======
            <h1 className="text-2xl md:text-3xl font-serif font-black text-[#132e15]">
              Ajouter une Nouvelle Entreprise
            </h1>
            <p className="text-xs text-gray-500 font-semibold">
>>>>>>> origin/main
              Renseignez les données administratives, de géolocalisation et de contact du nouveau membre.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/enterprises')}
<<<<<<< HEAD
            className="btn-ghost self-start sm:self-center flex items-center gap-2 px-4 py-2 text-xs"
=======
            className="self-start sm:self-center flex items-center gap-2 border border-gray-200 hover:border-[#132e15] hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs"
>>>>>>> origin/main
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {dupError && (
<<<<<<< HEAD
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 text-rose-800 text-sm font-bold shadow-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm text-rose-800">Erreur de Doublon</p>
=======
            <div className="bg-rose-50 border-2 border-rose-100 p-4 rounded-2xl flex items-start gap-3 text-rose-800 text-sm font-bold shadow-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm text-[#132e15]">Erreur de Doublon</p>
>>>>>>> origin/main
                <p className="font-semibold text-xs text-rose-700 mt-1">{dupError}</p>
              </div>
            </div>
          )}

          {/* SECTION 1: IDENTIFICATION & STATUT */}
<<<<<<< HEAD
          <div className="card-elevated p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-cscm-green-soft text-cscm-green rounded-xl border border-cscm-green/15">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-sans font-bold text-[#274420]">Information Membre &amp; Identification</h3>
=======
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-gray-150 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-cscm-green/10 text-[#132e15] rounded-xl border border-cscm-green/10">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-black text-[#132e15]">Information Membre &amp; Identification</h3>
>>>>>>> origin/main
                <p className="text-[10px] text-gray-500 font-medium">Type adhésion, Raison sociale et informations juridiques</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Numéro de membre */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Numéro de membre (Automatique)</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Numéro de membre (Automatique)</label>
>>>>>>> origin/main
                <input 
                  type="text" 
                  name="memberNo"
                  value={formData.memberNo}
                  readOnly
                  disabled
                  placeholder="Généré automatiquement"
<<<<<<< HEAD
                  className="w-full border border-gray-200 text-gray-400 text-sm font-semibold p-3 rounded-2xl bg-gray-50 outline-none cursor-not-allowed select-none transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/10 text-gray-400 text-sm font-extrabold p-3 rounded-2xl bg-gray-100 outline-none cursor-not-allowed select-none transition-all" 
>>>>>>> origin/main
                />
              </div>

              {/* Type membre */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Type de membre *</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Type de membre *</label>
>>>>>>> origin/main
                <select 
                  name="typeMembre"
                  value={formData.typeMembre}
                  onChange={handleInputChange}
                  required
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all"
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all"
>>>>>>> origin/main
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
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Statut membre</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Statut membre</label>
>>>>>>> origin/main
                <select 
                  name="statutMembre"
                  value={formData.statutMembre}
                  onChange={handleInputChange}
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all"
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all"
>>>>>>> origin/main
                >
                  <option value="Actif">Actif</option>
                  <option value="Suspendu">Suspendu</option>
                  <option value="Radié">Radié</option>
                </select>
              </div>

              {/* Nom commercial */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Nom commercial *</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Nom commercial *</label>
>>>>>>> origin/main
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Innov Sénégal" 
                  required
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>

              {/* Raison sociale */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Raison sociale *</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Raison sociale *</label>
>>>>>>> origin/main
                <input 
                  type="text" 
                  name="raisonSociale"
                  value={formData.raisonSociale}
                  onChange={handleInputChange}
                  placeholder="Ex: Innov Sénégal SARL" 
                  required
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>

              {/* Forme juridique */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Forme juridique</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Forme juridique</label>
>>>>>>> origin/main
                <select 
                  name="formeJuridique"
                  value={formData.formeJuridique}
                  onChange={handleInputChange}
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all"
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all"
>>>>>>> origin/main
                >
                  <option value="">Sélectionner</option>
                  <option value="SARL">SARL</option>
                  <option value="SA">SA</option>
                  <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                </select>
              </div>

              {/* Secteur d'activité */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Secteur d'activité *</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Secteur d'activité *</label>
>>>>>>> origin/main
                <select 
                  name="secteur"
                  value={formData.secteur}
                  onChange={handleInputChange}
                  required
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all"
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all"
>>>>>>> origin/main
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
<<<<<<< HEAD
          <div className="card-elevated p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-cscm-green-soft text-cscm-green rounded-xl border border-cscm-green/15">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-sans font-bold text-[#274420]">Enregistrements &amp; Adhésion</h3>
=======
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-gray-150 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-cscm-green/10 text-[#132e15] rounded-xl border border-cscm-green/10">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-black text-[#132e15]">Enregistrements &amp; Adhésion</h3>
>>>>>>> origin/main
                <p className="text-[10px] text-gray-500 font-medium">Informations pour le suivi administratif et de conformité</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Numéro RC */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Numéro RC</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Numéro RC</label>
>>>>>>> origin/main
                <input 
                  type="text" 
                  name="numRC"
                  value={formData.numRC}
                  onChange={handleInputChange}
                  placeholder="Ex: RC-DKR-2021-B-105" 
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>

              {/* NINEA / ICE */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">NINEA / ICE</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">NINEA / ICE</label>
>>>>>>> origin/main
                <input 
                  type="text" 
                  name="ninea"
                  value={formData.ninea}
                  onChange={handleInputChange}
                  placeholder="Ex: 0028192-3G3" 
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>

              {/* Date création */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Date création</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Date création</label>
>>>>>>> origin/main
                <input 
                  type="date" 
                  name="dateCreation"
                  value={formData.dateCreation}
                  onChange={handleInputChange}
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>

              {/* Date d'adhésion */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Date d'adhésion</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Date d'adhésion</label>
>>>>>>> origin/main
                <input 
                  type="date" 
                  name="dateAdhesion"
                  value={formData.dateAdhesion}
                  onChange={handleInputChange}
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>

              {/* Statut adhésion */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Statut adhésion</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Statut adhésion</label>
>>>>>>> origin/main
                <select 
                  name="statutAdhesion"
                  value={formData.statutAdhesion}
                  onChange={handleInputChange}
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all"
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all"
>>>>>>> origin/main
                >
                  <option value="Actif">Actif</option>
                  <option value="Suspendu">Suspendu</option>
                  <option value="Radié">Radié</option>
                </select>
              </div>
            </div>
          </div>


          {/* SECTION 3: LOCALISATION & COORDONNEES */}
<<<<<<< HEAD
          <div className="card-elevated p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-cscm-green-soft text-cscm-green rounded-xl border border-cscm-green/15">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-sans font-bold text-[#274420]">Coordonnées &amp; géographie</h3>
=======
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-gray-150 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-cscm-green/10 text-[#132e15] rounded-xl border border-cscm-green/10">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-black text-[#132e15]">Coordonnées &amp; géographie</h3>
>>>>>>> origin/main
                <p className="text-[10px] text-gray-500 font-medium">Adresses, téléphones et canaux numériques de l'entreprise</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pays */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Pays</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Pays</label>
>>>>>>> origin/main
                <input 
                  type="text" 
                  name="pays"
                  value={formData.pays}
                  onChange={handleInputChange}
                  placeholder="Ex: Sénégal" 
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>

              {/* Ville */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Ville</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Ville</label>
>>>>>>> origin/main
                <input 
                  type="text" 
                  name="ville"
                  value={formData.ville}
                  onChange={handleInputChange}
                  placeholder="Ex: Dakar" 
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>

              {/* Adresse */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Adresse complète</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Adresse complète</label>
>>>>>>> origin/main
                <input 
                  type="text" 
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  placeholder="Ex: Point E, Rue de Diourbel" 
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>

              {/* Code postal */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Code postal</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Code postal</label>
>>>>>>> origin/main
                <input 
                  type="text" 
                  name="codePostal"
                  value={formData.codePostal}
                  onChange={handleInputChange}
                  placeholder="Ex: 11000" 
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>

              {/* Téléphone Principal */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Téléphone principal</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Téléphone principal</label>
>>>>>>> origin/main
                <input 
                  type="text" 
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  placeholder="Ex: +221 33 800 00 00" 
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>

              {/* Téléphone secondaire */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Téléphone secondaire</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Téléphone secondaire</label>
>>>>>>> origin/main
                <input 
                  type="text" 
                  name="telephoneSecondaire"
                  value={formData.telephoneSecondaire}
                  onChange={handleInputChange}
                  placeholder="Ex: +221 77 123 45 67" 
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Email entreprise</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Email entreprise</label>
>>>>>>> origin/main
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Ex: contact@entreprise.sn" 
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>

              {/* Site web */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Site internet</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Site internet</label>
>>>>>>> origin/main
                <input 
                  type="text" 
                  name="siteWeb"
                  value={formData.siteWeb}
                  onChange={handleInputChange}
                  placeholder="Ex: www.entreprise.sn" 
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>
            </div>
          </div>


          {/* SECTION 4: ACTIVITE & DESCRIPTION */}
<<<<<<< HEAD
          <div className="card-elevated p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-cscm-green-soft text-cscm-green rounded-xl border border-cscm-green/15">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-sans font-bold text-[#274420]">Données Opérationnelles</h3>
=======
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-gray-150 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-cscm-green/10 text-[#132e15] rounded-xl border border-cscm-green/10">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-black text-[#132e15]">Données Opérationnelles</h3>
>>>>>>> origin/main
                <p className="text-[10px] text-gray-500 font-medium">Taille de l'entreprise et description thématique</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Effectif */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Effectif d'employés</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Effectif d'employés</label>
>>>>>>> origin/main
                <input 
                  type="text" 
                  name="effectif"
                  value={formData.effectif}
                  onChange={handleInputChange}
                  placeholder="Ex: 50" 
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Description de l'activité</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Description de l'activité</label>
>>>>>>> origin/main
                <input 
                  type="text" 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Services technologiques, logistique portuaire..." 
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>
            </div>
          </div>


          {/* SECTION 5: ADHERENT DE CONTACT */}
<<<<<<< HEAD
          <div className="card-elevated p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-cscm-green-soft text-cscm-green rounded-xl border border-cscm-green/15">
                <Contact className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-sans font-bold text-[#274420]">Contact principal / Représentant</h3>
=======
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-gray-150 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-cscm-green/10 text-[#132e15] rounded-xl border border-cscm-green/10">
                <Contact className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-black text-[#132e15]">Contact principal / Représentant</h3>
>>>>>>> origin/main
                <p className="text-[10px] text-gray-500 font-medium">Personne physique désignée pour représenter le membre</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Civilité */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Civilité</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Civilité</label>
>>>>>>> origin/main
                <select 
                  name="civilite"
                  value={formData.civilite}
                  onChange={handleInputChange}
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all"
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all"
>>>>>>> origin/main
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
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Fonction</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Fonction</label>
>>>>>>> origin/main
                <input 
                  type="text" 
                  name="fonction"
                  value={formData.fonction}
                  onChange={handleInputChange}
                  placeholder="Ex: Directeur Général" 
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>

              {/* Nom */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Nom rep.</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Nom rep.</label>
>>>>>>> origin/main
                <input 
                  type="text" 
                  name="nomContact"
                  value={formData.nomContact}
                  onChange={handleInputChange}
                  placeholder="Ex: Ndiaye" 
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>

              {/* Prénom */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Prénom rep.</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Prénom rep.</label>
>>>>>>> origin/main
                <input 
                  type="text" 
                  name="prenomContact"
                  value={formData.prenomContact}
                  onChange={handleInputChange}
                  placeholder="Ex: Amadou" 
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>

              {/* Email contact */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Email principal rep.</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Email principal rep.</label>
>>>>>>> origin/main
                <input 
                  type="email" 
                  name="emailContact"
                  value={formData.emailContact}
                  onChange={handleInputChange}
                  placeholder="Ex: amadou@innov.sn" 
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>

              {/* Mobile contact */}
              <div className="space-y-2">
<<<<<<< HEAD
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Téléphone portable rep.</label>
=======
                <label className="block text-xs font-black uppercase text-[#132e15] tracking-wider">Téléphone portable rep.</label>
>>>>>>> origin/main
                <input 
                  type="text" 
                  name="mobileContact"
                  value={formData.mobileContact}
                  onChange={handleInputChange}
                  placeholder="Ex: +221 77 600 00 00" 
<<<<<<< HEAD
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
=======
                  className="w-full border-2 border-[#132e15]/15 focus:border-[#132e15] text-[#132e15] text-sm font-extrabold p-3 rounded-2xl bg-white outline-none focus:ring-4 focus:ring-[#132e15]/10 transition-all" 
>>>>>>> origin/main
                />
              </div>
            </div>
          </div>


          {/* SECTION 6: BRANDING & ACTIONS */}
<<<<<<< HEAD
          <div className="card-elevated p-6 md:p-8">
=======
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-gray-150">
>>>>>>> origin/main
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 w-full">
              
              <div className="flex items-center gap-5 w-full lg:w-auto">
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
<<<<<<< HEAD
                    className="w-20 h-20 rounded-2xl bg-white flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-cscm-green hover:bg-cscm-green-soft transition-all duration-300 overflow-hidden cursor-pointer shrink-0"
=======
                    className="w-20 h-20 rounded-2xl bg-white flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-[#132e15] hover:bg-cscm-green/5 transition-all overflow-hidden cursor-pointer shrink-0"
>>>>>>> origin/main
                  >
                    {logo ? (
                      <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <>
<<<<<<< HEAD
                        <Camera className="w-6 h-6 text-cscm-green/50" />
                        <span className="text-[9px] text-[#22301C]/55 mt-1 font-bold">Logo</span>
=======
                        <Camera className="w-6 h-6 text-[#132e15]/40" />
                        <span className="text-[9px] text-[#132e15]/60 mt-1 font-bold">Logo</span>
>>>>>>> origin/main
                      </>
                    )}
                  </button>
                  {logo && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
<<<<<<< HEAD
                      className="absolute -top-1.5 -right-1.5 bg-[#E3C766] p-1.5 rounded-lg border border-white shadow-md cursor-pointer hover:scale-105 transition-all duration-300"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#274420]" />
=======
                      className="absolute -top-1.5 -right-1.5 bg-[#ebd078] p-1.5 rounded-lg border border-[#132e15]/20 shadow-md cursor-pointer hover:scale-105 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#132e15]" />
>>>>>>> origin/main
                    </button>
                  )}
                </div>
                <div className="text-left">
<<<<<<< HEAD
                  <h4 className="text-sm font-sans font-bold text-[#274420]">Emblème Commercial</h4>
=======
                  <h4 className="text-sm font-serif font-black text-[#132e15]">Emblème Commercial</h4>
>>>>>>> origin/main
                  <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                    Chargez l'avatar officiel ou le logo HD de la société (.PNG, .JPG)
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <button 
                  type="button"
                  onClick={() => navigate('/enterprises')}
<<<<<<< HEAD
                  className="w-full sm:w-auto bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 text-gray-600 px-8 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-center select-none"
=======
                  className="w-full sm:w-auto border-2 border-[#132e15]/20 hover:border-[#132e15] text-[#132e15] px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-colors cursor-pointer text-center select-none"
>>>>>>> origin/main
                >
                  Annuler
                </button>
                <button 
                  type="submit"
<<<<<<< HEAD
                  className="w-full sm:w-auto btn-submit px-10 py-3.5 text-xs uppercase tracking-wider flex items-center justify-center gap-2 select-none"
                >
                  <Check className="w-4 h-4 text-white" />
=======
                  className="w-full sm:w-auto bg-[#132e15] text-[#ebd078] hover:bg-[#1f4222] px-10 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer select-none border border-[#ebd078]/20"
                >
                  <Check className="w-4 h-4 text-[#ebd078]" />
>>>>>>> origin/main
                  Enregistrer Membre
                </button>
              </div>

            </div>
          </div>

        </form>
      </div>
    </SidebarLayout>
  );
};
