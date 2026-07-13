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
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'name') {
        updated.raisonSociale = value;
      }
      return updated;
    });
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
    
    const isNameDup = allEnterprises.some(ent => 
      (ent.name || ent.raisonSociale || '').trim().toLowerCase() === cleanName
    );
    
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
      name: formData.name.trim(),
      raisonSociale: formData.name.trim(),
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
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2">
          <div className="space-y-2">
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
            <span className="badge-soft">Nouveau membre</span>
            <h1 className="page-title">
              Ajouter une Nouvelle Entreprise
            </h1>
            <p className="text-sm text-[#22301C]/55 font-medium max-w-2xl">
              Renseignez les données administratives, de géolocalisation et de contact du nouveau membre.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/enterprises')}
            className="btn-ghost self-start sm:self-center flex items-center gap-2 px-4 py-2 text-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {dupError && (
            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 text-rose-800 text-sm font-bold shadow-sm">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm text-rose-800">Erreur de Doublon</p>
                <p className="font-semibold text-xs text-rose-700 mt-1">{dupError}</p>
              </div>
            </div>
          )}

          {/* SECTION 1: IDENTIFICATION & STATUT */}
          <div className="card-elevated p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-cscm-green-soft text-cscm-green rounded-xl border border-cscm-green/15">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-sans font-bold text-[#274420]">Information Membre &amp; Identification</h3>
                <p className="text-[10px] text-gray-500 font-medium">Type adhésion, nom de l'entreprise et informations juridiques</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Numéro de membre */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Numéro de membre (Automatique)</label>
                <input 
                  type="text" 
                  name="memberNo"
                  value={formData.memberNo}
                  readOnly
                  disabled
                  placeholder="Généré automatiquement"
                  className="w-full border border-gray-200 text-gray-400 text-sm font-semibold p-3 rounded-2xl bg-gray-50 outline-none cursor-not-allowed select-none transition-all" 
                />
              </div>

              {/* Type membre */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Type de membre *</label>
                <select 
                  name="typeMembre"
                  value={formData.typeMembre}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all"
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
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Statut membre</label>
                <select 
                  name="statutMembre"
                  value={formData.statutMembre}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all"
                >
                  <option value="Actif">Actif</option>
                  <option value="Suspendu">Suspendu</option>
                  <option value="Radié">Radié</option>
                </select>
              </div>

              {/* Nom de l'entreprise */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Nom de l'entreprise *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Innov Sénégal SARL" 
                  required
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
                />
              </div>

              {/* Forme juridique */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Forme juridique</label>
                <select 
                  name="formeJuridique"
                  value={formData.formeJuridique}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all"
                >
                  <option value="">Sélectionner</option>
                  <option value="SARL">SARL</option>
                  <option value="SA">SA</option>
                  <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                </select>
              </div>

              {/* Secteur d'activité */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Secteur d'activité *</label>
                <select 
                  name="secteur"
                  value={formData.secteur}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all"
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
          <div className="card-elevated p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-cscm-green-soft text-cscm-green rounded-xl border border-cscm-green/15">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-sans font-bold text-[#274420]">Enregistrements &amp; Adhésion</h3>
                <p className="text-[10px] text-gray-500 font-medium">Informations pour le suivi administratif et de conformité</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Numéro RC */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Numéro RC</label>
                <input 
                  type="text" 
                  name="numRC"
                  value={formData.numRC}
                  onChange={handleInputChange}
                  placeholder="Ex: RC-DKR-2021-B-105" 
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
                />
              </div>

              {/* NINEA / ICE */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">NINEA / ICE</label>
                <input 
                  type="text" 
                  name="ninea"
                  value={formData.ninea}
                  onChange={handleInputChange}
                  placeholder="Ex: 0028192-3G3" 
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
                />
              </div>

              {/* Date création */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Date création</label>
                <input 
                  type="date" 
                  name="dateCreation"
                  value={formData.dateCreation}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
                />
              </div>

              {/* Date d'adhésion */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Date d'adhésion</label>
                <input 
                  type="date" 
                  name="dateAdhesion"
                  value={formData.dateAdhesion}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
                />
              </div>

              {/* Statut adhésion */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Statut adhésion</label>
                <select 
                  name="statutAdhesion"
                  value={formData.statutAdhesion}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all"
                >
                  <option value="Actif">Actif</option>
                  <option value="Suspendu">Suspendu</option>
                  <option value="Radié">Radié</option>
                </select>
              </div>
            </div>
          </div>


          {/* SECTION 3: LOCALISATION & COORDONNEES */}
          <div className="card-elevated p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-cscm-green-soft text-cscm-green rounded-xl border border-cscm-green/15">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-sans font-bold text-[#274420]">Coordonnées &amp; géographie</h3>
                <p className="text-[10px] text-gray-500 font-medium">Adresses, téléphones et canaux numériques de l'entreprise</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pays */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Pays</label>
                <input 
                  type="text" 
                  name="pays"
                  value={formData.pays}
                  onChange={handleInputChange}
                  placeholder="Ex: Sénégal" 
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
                />
              </div>

              {/* Ville */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Ville</label>
                <input 
                  type="text" 
                  name="ville"
                  value={formData.ville}
                  onChange={handleInputChange}
                  placeholder="Ex: Dakar" 
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
                />
              </div>

              {/* Adresse */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Adresse complète</label>
                <input 
                  type="text" 
                  name="adresse"
                  value={formData.adresse}
                  onChange={handleInputChange}
                  placeholder="Ex: Point E, Rue de Diourbel" 
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
                />
              </div>

              {/* Code postal */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Code postal</label>
                <input 
                  type="text" 
                  name="codePostal"
                  value={formData.codePostal}
                  onChange={handleInputChange}
                  placeholder="Ex: 11000" 
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
                />
              </div>

              {/* Téléphone Principal */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Téléphone principal</label>
                <input 
                  type="text" 
                  name="telephone"
                  value={formData.telephone}
                  onChange={handleInputChange}
                  placeholder="Ex: +221 33 800 00 00" 
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
                />
              </div>

              {/* Téléphone secondaire */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Téléphone secondaire</label>
                <input 
                  type="text" 
                  name="telephoneSecondaire"
                  value={formData.telephoneSecondaire}
                  onChange={handleInputChange}
                  placeholder="Ex: +221 77 123 45 67" 
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Email entreprise</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Ex: contact@entreprise.sn" 
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
                />
              </div>

              {/* Site web */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Site internet</label>
                <input 
                  type="text" 
                  name="siteWeb"
                  value={formData.siteWeb}
                  onChange={handleInputChange}
                  placeholder="Ex: www.entreprise.sn" 
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
                />
              </div>
            </div>
          </div>


          {/* SECTION 4: ACTIVITE & DESCRIPTION */}
          <div className="card-elevated p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-cscm-green-soft text-cscm-green rounded-xl border border-cscm-green/15">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-sans font-bold text-[#274420]">Données Opérationnelles</h3>
                <p className="text-[10px] text-gray-500 font-medium">Taille de l'entreprise et description thématique</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Effectif */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Effectif d'employés</label>
                <input 
                  type="text" 
                  name="effectif"
                  value={formData.effectif}
                  onChange={handleInputChange}
                  placeholder="Ex: 50" 
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Description de l'activité</label>
                <input 
                  type="text" 
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Services technologiques, logistique portuaire..." 
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
                />
              </div>
            </div>
          </div>


          {/* SECTION 5: ADHERENT DE CONTACT */}
          <div className="card-elevated p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="p-2.5 bg-cscm-green-soft text-cscm-green rounded-xl border border-cscm-green/15">
                <Contact className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-sans font-bold text-[#274420]">Contact principal / Représentant</h3>
                <p className="text-[10px] text-gray-500 font-medium">Personne physique désignée pour représenter le membre</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Civilité */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Civilité</label>
                <select 
                  name="civilite"
                  value={formData.civilite}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all"
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
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Fonction</label>
                <input 
                  type="text" 
                  name="fonction"
                  value={formData.fonction}
                  onChange={handleInputChange}
                  placeholder="Ex: Directeur Général" 
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
                />
              </div>

              {/* Nom */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Nom rep.</label>
                <input 
                  type="text" 
                  name="nomContact"
                  value={formData.nomContact}
                  onChange={handleInputChange}
                  placeholder="Ex: Ndiaye" 
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
                />
              </div>

              {/* Prénom */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Prénom rep.</label>
                <input 
                  type="text" 
                  name="prenomContact"
                  value={formData.prenomContact}
                  onChange={handleInputChange}
                  placeholder="Ex: Amadou" 
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
                />
              </div>

              {/* Email contact */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Email principal rep.</label>
                <input 
                  type="email" 
                  name="emailContact"
                  value={formData.emailContact}
                  onChange={handleInputChange}
                  placeholder="Ex: amadou@innov.sn" 
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
                />
              </div>

              {/* Mobile contact */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase text-gray-500 tracking-wider">Téléphone portable rep.</label>
                <input 
                  type="text" 
                  name="mobileContact"
                  value={formData.mobileContact}
                  onChange={handleInputChange}
                  placeholder="Ex: +221 77 600 00 00" 
                  className="w-full border border-gray-200 focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] text-gray-800 text-sm font-semibold p-3 rounded-2xl bg-white focus:bg-white outline-none placeholder:text-gray-300 transition-all" 
                />
              </div>
            </div>
          </div>


          {/* SECTION 6: BRANDING & ACTIONS */}
          <div className="card-elevated p-6 md:p-8">
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
                    className="w-20 h-20 rounded-2xl bg-white flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-cscm-green hover:bg-cscm-green-soft transition-all duration-300 overflow-hidden cursor-pointer shrink-0"
                  >
                    {logo ? (
                      <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-cscm-green/50" />
                        <span className="text-[9px] text-[#22301C]/55 mt-1 font-bold">Logo</span>
                      </>
                    )}
                  </button>
                  {logo && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -top-1.5 -right-1.5 bg-[#E3C766] p-1.5 rounded-lg border border-white shadow-md cursor-pointer hover:scale-105 transition-all duration-300"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#274420]" />
                    </button>
                  )}
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-sans font-bold text-[#274420]">Emblème Commercial</h4>
                  <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                    Chargez l'avatar officiel ou le logo HD de la société (.PNG, .JPG)
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                <button 
                  type="button"
                  onClick={() => navigate('/enterprises')}
                  className="w-full sm:w-auto bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 text-gray-600 px-8 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer text-center select-none"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="w-full sm:w-auto btn-submit px-10 py-3.5 text-xs uppercase tracking-wider flex items-center justify-center gap-2 select-none"
                >
                  <Check className="w-4 h-4 text-white" />
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
