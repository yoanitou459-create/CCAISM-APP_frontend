import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '../components/SidebarLayout';
import {
  Camera, Pencil, Check, ArrowLeft, Building2, ShieldCheck, MapPin, Contact, AlertCircle,
  Hash, Award, Activity, Building, Scale, Briefcase, FileText, Fingerprint, Calendar,
  CalendarCheck, CircleCheck, Globe, Map, Home, Navigation, Phone, PhoneCall, Mail, Link,
  Users, AlignLeft, User, UserCircle, AtSign, Smartphone
} from 'lucide-react';
import { getStoredEnterprises, saveStoredEnterprises } from '../../database/enterpriseStorage';

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
      if (name === 'raisonSociale') {
        updated.name = value;
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
    const cleanRaisonSociale = formData.raisonSociale.trim().toLowerCase();
    
    const isNameDup = allEnterprises.some(ent => 
      (ent.raisonSociale || ent.name || '').trim().toLowerCase() === cleanRaisonSociale
    );
    
    const inputMemberNo = (formData.memberNo || '').trim().toLowerCase();
    const isMemberDup = inputMemberNo ? allEnterprises.some(ent => (ent.memberNo || '').trim().toLowerCase() === inputMemberNo) : false;
    
    if (isNameDup) {
      setDupError(`L'entreprise "${formData.raisonSociale}" existe déjà dans l'annuaire (Doublon détecté sur la raison sociale).`);
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
      <div className="min-h-full">
        <div className="max-w-5xl mx-auto w-full px-4 md:px-8 py-8 md:py-12 space-y-8 text-left pb-24">

          {/* Custom Header */}
          <div className="glass-panel p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#1A3D18]/50">
                <button 
                  type="button" 
                  onClick={() => navigate('/enterprises')}
                  className="hover:text-cscm-green transition-colors flex items-center gap-1"
                >
                  Entreprises
                </button>
                <span className="text-cscm-gold">/</span>
                <span className="text-[#1A3D18]/40">Ajout</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2E4D31] to-[#1A3D18] text-cscm-gold flex items-center justify-center shadow-lg shadow-[#2E4D31]/25 border border-white/20 shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="page-title">Ajouter une Nouvelle Entreprise</h1>
                  <p className="page-subtitle">
                    Renseignez les données administratives, de géolocalisation et de contact du nouveau membre.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/enterprises')}
              className="btn-outline self-start sm:self-center px-4 py-2.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">

            {dupError && (
              <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-3 text-rose-800 text-sm font-bold shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-extrabold text-sm text-rose-900">Erreur de Doublon</p>
                  <p className="font-semibold text-xs text-rose-700 mt-1">{dupError}</p>
                </div>
              </div>
            )}

            {/* SECTION 1: IDENTIFICATION & STATUT */}
            <div className="surface-card surface-card-hover p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-4 border-b border-cscm-green/10 pb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cscm-green to-[#1b381c] text-cscm-gold flex items-center justify-center shadow-md shadow-cscm-green/20 border border-cscm-gold/20 shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-serif font-black text-[#12210E]">Information Membre &amp; Identification</h3>
                  <p className="text-[11px] text-[#12210E]/45 font-semibold">Type adhésion, Raison sociale et informations juridiques</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Numéro de membre */}
                <div>
                  <label className="field-label"><Hash />Numéro de membre (Automatique)</label>
                  <input 
                    type="text" 
                    name="memberNo"
                    value={formData.memberNo}
                    readOnly
                    disabled
                    placeholder="Généré automatiquement"
                    className="field-input font-bold text-cscm-green bg-cscm-green/5 border-cscm-green/15 cursor-not-allowed select-none" 
                  />
                </div>

                {/* Type membre */}
                <div>
                  <label className="field-label"><Award />Type de membre *</label>
                  <select 
                    name="typeMembre"
                    value={formData.typeMembre}
                    onChange={handleInputChange}
                    required
                    className="field-select"
                  >
                    <option value="">Sélectionner</option>
                    <option value="Inscrit">Inscrit</option>
                    <option value="Associé">Associé</option>
                    <option value="Fondateur">Fondateur</option>
                    <option value="Honneur">Honneur</option>
                  </select>
                </div>

                {/* Statut membre */}
                <div>
                  <label className="field-label"><Activity />Statut membre</label>
                  <select 
                    name="statutMembre"
                    value={formData.statutMembre}
                    onChange={handleInputChange}
                    className="field-select"
                  >
                    <option value="Actif">Actif</option>
                    <option value="Suspendu">Suspendu</option>
                    <option value="Radié">Radié</option>
                  </select>
                </div>

                {/* Raison sociale */}
                <div>
                  <label className="field-label"><Building />Raison sociale *</label>
                  <input 
                    type="text" 
                    name="raisonSociale"
                    value={formData.raisonSociale}
                    onChange={handleInputChange}
                    placeholder="Saisissez la raison sociale (Ex: Innov Sénégal SARL)" 
                    required
                    className="field-input" 
                  />
                </div>

                {/* Forme juridique */}
                <div>
                  <label className="field-label"><Scale />Forme juridique</label>
                  <select 
                    name="formeJuridique"
                    value={formData.formeJuridique}
                    onChange={handleInputChange}
                    className="field-select"
                  >
                    <option value="">Sélectionner</option>
                    <option value="SARL">SARL</option>
                    <option value="SA">SA</option>
                    <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                  </select>
                </div>

                {/* Secteur d'activité */}
                <div>
                  <label className="field-label"><Briefcase />Secteur d'activité *</label>
                  <select 
                    name="secteur"
                    value={formData.secteur}
                    onChange={handleInputChange}
                    required
                    className="field-select"
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
            <div className="surface-card surface-card-hover p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-4 border-b border-cscm-green/10 pb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cscm-green to-[#1b381c] text-cscm-gold flex items-center justify-center shadow-md shadow-cscm-green/20 border border-cscm-gold/20 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-serif font-black text-[#12210E]">Enregistrements &amp; Adhésion</h3>
                  <p className="text-[11px] text-[#12210E]/45 font-semibold">Informations pour le suivi administratif et de conformité</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Numéro RC */}
                <div>
                  <label className="field-label"><FileText />Numéro RC</label>
                  <input 
                    type="text" 
                    name="numRC"
                    value={formData.numRC}
                    onChange={handleInputChange}
                    placeholder="Saisissez le numéro de Registre de Commerce (Ex: RC-DKR-2021-B-105)" 
                    className="field-input" 
                  />
                </div>

                {/* NINEA / ICE */}
                <div>
                  <label className="field-label"><Fingerprint />NINEA / ICE</label>
                  <input 
                    type="text" 
                    name="ninea"
                    value={formData.ninea}
                    onChange={handleInputChange}
                    placeholder="Saisissez le numéro NINEA (Ex: 0028192-3G3)" 
                    className="field-input" 
                  />
                </div>

                {/* Date création */}
                <div>
                  <label className="field-label"><Calendar />Date création</label>
                  <input 
                    type="date" 
                    name="dateCreation"
                    value={formData.dateCreation}
                    onChange={handleInputChange}
                    className="field-input" 
                  />
                </div>

                {/* Date d'adhésion */}
                <div>
                  <label className="field-label"><CalendarCheck />Date d'adhésion</label>
                  <input 
                    type="date" 
                    name="dateAdhesion"
                    value={formData.dateAdhesion}
                    onChange={handleInputChange}
                    className="field-input" 
                  />
                </div>

                {/* Statut adhésion */}
                <div>
                  <label className="field-label"><CircleCheck />Statut adhésion</label>
                  <select 
                    name="statutAdhesion"
                    value={formData.statutAdhesion}
                    onChange={handleInputChange}
                    className="field-select"
                  >
                    <option value="Actif">Actif</option>
                    <option value="Suspendu">Suspendu</option>
                    <option value="Radié">Radié</option>
                  </select>
                </div>
              </div>
            </div>


            {/* SECTION 3: LOCALISATION & COORDONNEES */}
            <div className="surface-card surface-card-hover p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-4 border-b border-cscm-green/10 pb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cscm-green to-[#1b381c] text-cscm-gold flex items-center justify-center shadow-md shadow-cscm-green/20 border border-cscm-gold/20 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-serif font-black text-[#12210E]">Coordonnées &amp; géographie</h3>
                  <p className="text-[11px] text-[#12210E]/45 font-semibold">Adresses, téléphones et canaux numériques de l'entreprise</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pays */}
                <div>
                  <label className="field-label"><Globe />Pays</label>
                  <input 
                    type="text" 
                    name="pays"
                    value={formData.pays}
                    onChange={handleInputChange}
                    placeholder="Saisissez le pays (Ex: Sénégal)" 
                    className="field-input" 
                  />
                </div>

                {/* Ville */}
                <div>
                  <label className="field-label"><Map />Ville</label>
                  <input 
                    type="text" 
                    name="ville"
                    value={formData.ville}
                    onChange={handleInputChange}
                    placeholder="Saisissez la ville (Ex: Dakar)" 
                    className="field-input" 
                  />
                </div>

                {/* Adresse */}
                <div>
                  <label className="field-label"><Home />Adresse complète</label>
                  <input 
                    type="text" 
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleInputChange}
                    placeholder="Saisissez l'adresse complète (Ex: Point E, Rue de Diourbel)" 
                    className="field-input" 
                  />
                </div>

                {/* Code postal */}
                <div>
                  <label className="field-label"><Navigation />Code postal</label>
                  <input 
                    type="text" 
                    name="codePostal"
                    value={formData.codePostal}
                    onChange={handleInputChange}
                    placeholder="Saisissez le code postal (Ex: 11000)" 
                    className="field-input" 
                  />
                </div>

                {/* Téléphone Principal */}
                <div>
                  <label className="field-label"><Phone />Téléphone principal</label>
                  <input 
                    type="text" 
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    placeholder="Saisissez le téléphone principal (Ex: +221 33 800 00 00)" 
                    className="field-input" 
                  />
                </div>

                {/* Téléphone secondaire */}
                <div>
                  <label className="field-label"><PhoneCall />Téléphone secondaire</label>
                  <input 
                    type="text" 
                    name="telephoneSecondaire"
                    value={formData.telephoneSecondaire}
                    onChange={handleInputChange}
                    placeholder="Saisissez le téléphone secondaire (Ex: +221 77 123 45 67)" 
                    className="field-input" 
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="field-label"><Mail />Email entreprise</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Saisissez l'adresse email de l'entreprise" 
                    className="field-input" 
                  />
                </div>

                {/* Site web */}
                <div>
                  <label className="field-label"><Link />Site internet</label>
                  <input 
                    type="text" 
                    name="siteWeb"
                    value={formData.siteWeb}
                    onChange={handleInputChange}
                    placeholder="Saisissez le site internet de l'entreprise (Ex: www.entreprise.sn)" 
                    className="field-input" 
                  />
                </div>
              </div>
            </div>


            {/* SECTION 4: ACTIVITE & DESCRIPTION */}
            <div className="surface-card surface-card-hover p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-4 border-b border-cscm-green/10 pb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cscm-green to-[#1b381c] text-cscm-gold flex items-center justify-center shadow-md shadow-cscm-green/20 border border-cscm-gold/20 shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-serif font-black text-[#12210E]">Données Opérationnelles</h3>
                  <p className="text-[11px] text-[#12210E]/45 font-semibold">Taille de l'entreprise et description thématique</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Effectif */}
                <div>
                  <label className="field-label"><Users />Effectif d'employés</label>
                  <input 
                    type="text" 
                    name="effectif"
                    value={formData.effectif}
                    onChange={handleInputChange}
                    placeholder="Saisissez l'effectif d'employés (Ex: 50)" 
                    className="field-input" 
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="field-label"><AlignLeft />Description de l'activité</label>
                  <input 
                    type="text" 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Saisissez la description des activités principales" 
                    className="field-input" 
                  />
                </div>
              </div>
            </div>


            {/* SECTION 5: ADHERENT DE CONTACT */}
            <div className="surface-card surface-card-hover p-6 md:p-8 space-y-6">
              <div className="flex items-center gap-4 border-b border-cscm-green/10 pb-5">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cscm-green to-[#1b381c] text-cscm-gold flex items-center justify-center shadow-md shadow-cscm-green/20 border border-cscm-gold/20 shrink-0">
                  <Contact className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-serif font-black text-[#12210E]">Contact principal / Représentant</h3>
                  <p className="text-[11px] text-[#12210E]/45 font-semibold">Personne physique désignée pour représenter le membre</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Civilité */}
                <div>
                  <label className="field-label"><User />Civilité</label>
                  <select 
                    name="civilite"
                    value={formData.civilite}
                    onChange={handleInputChange}
                    className="field-select"
                  >
                    <option value="">Sélectionner</option>
                    <option value="M">M</option>
                    <option value="Mme">Mme</option>
                    <option value="Dr">Dr</option>
                    <option value="Pr">Pr</option>
                  </select>
                </div>

                {/* Fonction */}
                <div>
                  <label className="field-label"><Briefcase />Fonction</label>
                  <input 
                    type="text" 
                    name="fonction"
                    value={formData.fonction}
                    onChange={handleInputChange}
                    placeholder="Saisissez la fonction (Ex: Directeur Général)" 
                    className="field-input" 
                  />
                </div>

                {/* Nom */}
                <div>
                  <label className="field-label"><User />Nom rep.</label>
                  <input 
                    type="text" 
                    name="nomContact"
                    value={formData.nomContact}
                    onChange={handleInputChange}
                    placeholder="Saisissez le nom du représentant (Ex: Ndiaye)" 
                    className="field-input" 
                  />
                </div>

                {/* Prénom */}
                <div>
                  <label className="field-label"><UserCircle />Prénom rep.</label>
                  <input 
                    type="text" 
                    name="prenomContact"
                    value={formData.prenomContact}
                    onChange={handleInputChange}
                    placeholder="Saisissez le prénom du représentant (Ex: Amadou)" 
                    className="field-input" 
                  />
                </div>

                {/* Email contact */}
                <div>
                  <label className="field-label"><AtSign />Email principal rep.</label>
                  <input 
                    type="email" 
                    name="emailContact"
                    value={formData.emailContact}
                    onChange={handleInputChange}
                    placeholder="Saisissez l'adresse email du représentant (Ex: amadou@innov.sn)" 
                    className="field-input" 
                  />
                </div>

                {/* Mobile contact */}
                <div>
                  <label className="field-label"><Smartphone />Téléphone portable rep.</label>
                  <input 
                    type="text" 
                    name="mobileContact"
                    value={formData.mobileContact}
                    onChange={handleInputChange}
                    placeholder="Saisissez le téléphone portable du représentant (Ex: +221 77 600 00 00)" 
                    className="field-input" 
                  />
                </div>
              </div>
            </div>


            {/* SECTION 6: BRANDING & ACTIONS */}
            <div className="surface-card p-6 md:p-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 w-full">
                
                <div className="flex items-center gap-5 w-full lg:w-auto">
                  <div className="relative group shrink-0">
                    <input 
                      type="file" 
                      id="add-ent-logo"
                      onChange={handleLogoChange} 
                      className="hidden" 
                      accept="image/*"
                    />
                    <label 
                      htmlFor="add-ent-logo"
                      className="w-20 h-20 rounded-2xl bg-[#f6f7fa] flex flex-col items-center justify-center border-2 border-dashed border-cscm-green/20 hover:border-cscm-green hover:bg-cscm-green/5 transition-all overflow-hidden cursor-pointer shrink-0"
                    >
                      {logo ? (
                        <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-cscm-green/50" />
                          <span className="text-[9px] text-cscm-green/70 mt-1 font-bold">Logo</span>
                        </>
                      )}
                    </label>
                    {logo && (
                      <label
                        htmlFor="add-ent-logo"
                        className="absolute -top-1.5 -right-1.5 bg-cscm-gold p-1.5 rounded-lg border border-cscm-green/20 shadow-md cursor-pointer hover:scale-105 transition-all flex items-center justify-center"
                      >
                        <Pencil className="w-3.5 h-3.5 text-[#12210E]" />
                      </label>
                    )}
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-serif font-black text-[#12210E]">Emblème Commercial</h4>
                    <p className="text-[11px] text-[#12210E]/45 font-medium leading-relaxed">
                      Chargez l'avatar officiel ou le logo HD de la société (.PNG, .JPG)
                    </p>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                  <button 
                    type="button"
                    onClick={() => navigate('/enterprises')}
                    className="w-full sm:w-auto border border-[#12210E]/15 hover:border-cscm-green hover:bg-[#FAF9F5] text-[#12210E] px-8 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer text-center select-none"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className="btn-cta w-full sm:w-auto px-10"
                  >
                    <Check className="w-4 h-4" />
                    Enregistrer Membre
                  </button>
                </div>

              </div>
            </div>

          </form>
        </div>
      </div>
    </SidebarLayout>
  );
};
