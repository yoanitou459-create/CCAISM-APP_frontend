import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Upload, Plus, Pencil, Check } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface AddEnterpriseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (newEnterprise: any) => void;
}

export const AddEnterpriseModal: React.FC<AddEnterpriseModalProps> = ({ isOpen, onClose, onAdd }) => {
  useBodyScrollLock(isOpen);

  const [logo, setLogo] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    typeMembre: '',
    name: '',
    raisonSociale: '',
    formeJuridique: '',
    statutMembre: 'Actif',
    numRC: '',
    ninea: '',
    dateCreation: '',
    dateAdhesion: '',
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
    if (onAdd) {
      const newEnterprise = {
        ...formData,
        id: Date.now(),
        memberNo: `M${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
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
          className="bg-white w-full max-w-4xl rounded-xl shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-20">
            <h2 className="text-2xl font-serif font-bold text-center flex-1 text-[#4A3728]">
              Formulaire d'ajout d'une entreprise
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-8 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">Type de membre :</label>
                  <select 
                    name="typeMembre"
                    value={formData.typeMembre}
                    onChange={handleInputChange}
                    className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none"
                  >
                    <option value="">Sélectionner</option>
                    <option value="Inscrit">Inscrit</option>
                    <option value="Associé">Associé</option>
                    <option value="Fondateur">Fondateur</option>
                    <option value="Honneur">Honneur</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">Nº Membres :</label>
                  <input type="text" disabled placeholder="Généré auto." className="flex-1 border rounded-md p-2 bg-gray-100 outline-none" />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">Nom commerciale :</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Entrer Nom Comm." 
                    required
                    className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">Raison sociale :</label>
                  <input 
                    type="text" 
                    name="raisonSociale"
                    value={formData.raisonSociale}
                    onChange={handleInputChange}
                    placeholder="Entrer Raison social" 
                    required
                    className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                  />
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">Forme juridique :</label>
                  <select 
                    name="formeJuridique"
                    value={formData.formeJuridique}
                    onChange={handleInputChange}
                    className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none"
                  >
                    <option value="">Sélectionner</option>
                    <option value="SARL">SARL</option>
                    <option value="SA">SA</option>
                    <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">Statut membre :</label>
                  <select 
                    name="statutMembre"
                    value={formData.statutMembre}
                    onChange={handleInputChange}
                    className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none"
                  >
                    <option value="Actif">Actif</option>
                    <option value="Suspendu">Suspendu</option>
                    <option value="Radié">Radié</option>
                  </select>
                </div>
              </div>

              <div className="h-px bg-gray-200 my-4" />

              {/* Row 4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">Numéro RC :</label>
                  <input 
                    type="text" 
                    name="numRC"
                    value={formData.numRC}
                    onChange={handleInputChange}
                    placeholder="Entrer Numéro RC" 
                    className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">NINEA / ICE :</label>
                  <input 
                    type="text" 
                    name="ninea"
                    value={formData.ninea}
                    onChange={handleInputChange}
                    placeholder="Entrer NINEA/ICE" 
                    className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                  />
                </div>
              </div>

              {/* Row 5 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">Date création :</label>
                  <input 
                    type="date" 
                    name="dateCreation"
                    value={formData.dateCreation}
                    onChange={handleInputChange}
                    className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">Date d'adhésion :</label>
                  <input 
                    type="date" 
                    name="dateAdhesion"
                    value={formData.dateAdhesion}
                    onChange={handleInputChange}
                    className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                  />
                </div>
              </div>

              {/* Row 6 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">Statut adhésion :</label>
                  <select 
                    name="statutAdhesion"
                    value={formData.statutAdhesion}
                    onChange={handleInputChange}
                    className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none"
                  >
                    <option value="Actif">Actif</option>
                    <option value="Suspendu">Suspendu</option>
                    <option value="Radié">Radié</option>
                  </select>
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">Secteur d'activité :</label>
                  <select 
                    name="secteur"
                    value={formData.secteur}
                    onChange={handleInputChange}
                    required
                    className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none"
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

              <div className="h-px bg-gray-200 my-4" />

              {/* Row 7 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">Pays :</label>
                  <input 
                    type="text" 
                    name="pays"
                    value={formData.pays}
                    onChange={handleInputChange}
                    placeholder="Entrer Pays" 
                    className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">Ville :</label>
                  <input 
                    type="text" 
                    name="ville"
                    value={formData.ville}
                    onChange={handleInputChange}
                    placeholder="Entrer Ville" 
                    className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                  />
                </div>
              </div>

              {/* Row 8 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">Adresse :</label>
                  <input 
                    type="text" 
                    name="adresse"
                    value={formData.adresse}
                    onChange={handleInputChange}
                    placeholder="Entrer Adresse" 
                    className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">Téléphone :</label>
                  <input 
                    type="text" 
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleInputChange}
                    placeholder="Entrer Téléphone" 
                    className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                  />
                </div>
              </div>

              {/* Row 9 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">Code postal :</label>
                  <input 
                    type="text" 
                    name="codePostal"
                    value={formData.codePostal}
                    onChange={handleInputChange}
                    placeholder="Entrer Code postal" 
                    className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                  />
                </div>
              </div>

              <div className="h-px bg-gray-200 my-4" />

              {/* Row 10 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">Téléphone secondaire :</label>
                  <input 
                    type="text" 
                    name="telephoneSecondaire"
                    value={formData.telephoneSecondaire}
                    onChange={handleInputChange}
                    placeholder="Entrer Téléphone secondaire" 
                    className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">Téléphone primaire :</label>
                  <input 
                    type="text" 
                    name="telephonePrimaire"
                    value={formData.telephonePrimaire}
                    onChange={handleInputChange}
                    placeholder="Entrer Téléphone primaire" 
                    className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                  />
                </div>
              </div>

              {/* Row 11 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">Site web :</label>
                  <input 
                    type="text" 
                    name="siteWeb"
                    value={formData.siteWeb}
                    onChange={handleInputChange}
                    placeholder="Entrer Site web" 
                    className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700">Email :</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Entrer Email" 
                    className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                  />
                </div>
              </div>

              {/* Section: PROFIL ENTREPRISE */}
              <div className="pt-6">
                <h3 className="text-center font-bold text-gray-800 mb-6 uppercase tracking-wider">PROFIL ENTREPRISE</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4">
                    <label className="w-32 text-sm font-medium text-gray-700">Effectif :</label>
                    <input 
                      type="text" 
                      name="effectif"
                      value={formData.effectif}
                      onChange={handleInputChange}
                      placeholder="Entrer Effectif" 
                      className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="w-32 text-sm font-medium text-gray-700">Description activité :</label>
                    <input 
                      type="text" 
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Entrer Description activité" 
                      className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                    />
                  </div>
                </div>
              </div>

              {/* Section: CONTACT PRINCIPAL */}
              <div className="pt-6">
                <h3 className="text-center font-bold text-gray-800 mb-6 uppercase tracking-wider">CONTACT PRINCIPAL</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4">
                    <label className="w-32 text-sm font-medium text-gray-700">Civilité :</label>
                    <select 
                      name="civilite"
                      value={formData.civilite}
                      onChange={handleInputChange}
                      className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none"
                    >
                      <option value="">Sélectionner</option>
                      <option value="M">M</option>
                      <option value="Mme">Mme</option>
                      <option value="Dr">Dr</option>
                      <option value="Pr">Pr</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="w-32 text-sm font-medium text-gray-700">Fonction :</label>
                    <input 
                      type="text" 
                      name="fonction"
                      value={formData.fonction}
                      onChange={handleInputChange}
                      placeholder="Entrer Fonction" 
                      className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="w-32 text-sm font-medium text-gray-700">Nom :</label>
                    <input 
                      type="text" 
                      name="nomContact"
                      value={formData.nomContact}
                      onChange={handleInputChange}
                      placeholder="Entrer Nom" 
                      className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="w-32 text-sm font-medium text-gray-700">Email :</label>
                    <input 
                      type="email" 
                      name="emailContact"
                      value={formData.emailContact}
                      onChange={handleInputChange}
                      placeholder="Entrer Email" 
                      className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="w-32 text-sm font-medium text-gray-700">Prénom :</label>
                    <input 
                      type="text" 
                      name="prenomContact"
                      value={formData.prenomContact}
                      onChange={handleInputChange}
                      placeholder="Entrer Prénom" 
                      className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="w-32 text-sm font-medium text-gray-700">Téléphone mobile :</label>
                    <input 
                      type="text" 
                      name="mobileContact"
                      value={formData.mobileContact}
                      onChange={handleInputChange}
                      placeholder="Entrer Téléphone mobile" 
                      className="flex-1 border rounded-md p-2 bg-gray-50 focus:ring-2 focus:ring-[#1A3F23] outline-none" 
                    />
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-12 flex items-center justify-between">
                <div className="relative group">
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
                    className="w-24 h-24 rounded-full bg-gray-200 flex flex-col items-center justify-center border-2 border-dashed border-gray-400 hover:bg-gray-300 transition-colors overflow-hidden"
                  >
                    {logo ? (
                      <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-gray-500" />
                        <span className="text-[10px] text-gray-500 mt-1">Logo Entreprise</span>
                      </>
                    )}
                  </button>
                  <div className="absolute -top-2 -right-2 bg-[#D4AF37] p-1.5 rounded-full shadow-md">
                    <Pencil className="w-4 h-4 text-[#1A3F23]" />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="bg-[#1A3F23] text-[#D4AF37] px-12 py-3 rounded-xl flex items-center gap-3 hover:bg-[#14321B] transition-all shadow-lg font-bold"
                >
                  <div className="bg-[#D4AF37] p-1 rounded">
                    <Check className="w-5 h-5 text-[#1A3F23]" />
                  </div>
                  Valider
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
