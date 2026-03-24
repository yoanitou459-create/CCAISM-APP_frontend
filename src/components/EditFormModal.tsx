import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Upload } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

const PencilIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
  </svg>
);

interface EditFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: string | null;
  mode: 'add' | 'edit';
  enterprise: any;
  onSave: (data: any) => void;
  itemIndex?: number | null;
}

export const EditFormModal: React.FC<EditFormModalProps> = ({ isOpen, onClose, type, mode, enterprise, onSave, itemIndex }) => {
  useBodyScrollLock(isOpen);
  const [formData, setFormData] = React.useState<any>({});

  React.useEffect(() => {
    if (isOpen) {
      if (type === 'Cotisations' && mode === 'edit' && itemIndex !== null && enterprise.cotisations) {
        setFormData(enterprise.cotisations[itemIndex] || {});
      } else if (type === 'Cotisations' && mode === 'add') {
        setFormData({ date: new Date().toISOString().split('T')[0], label: '', amount: '' });
      } else if (type === 'Besoins' && mode === 'edit' && itemIndex !== null && enterprise.besoins) {
        setFormData(enterprise.besoins[itemIndex] || {});
      } else if (type === 'Besoins' && mode === 'add') {
        setFormData({ title: '', type: '', description: '', budget: '', priority: 'Moyenne' });
      } else if (type === 'Certifications' && mode === 'edit' && itemIndex !== null && enterprise.certifications) {
        setFormData(enterprise.certifications[itemIndex] || {});
      } else if (type === 'Certifications' && mode === 'add') {
        setFormData({ name: '', code: '', date: '', issuer: '' });
      } else if (type === 'Données financières' && mode === 'edit' && itemIndex !== null && enterprise.financialData) {
        setFormData(enterprise.financialData[itemIndex] || {});
      } else if (type === 'Données financières' && mode === 'add') {
        setFormData({ year: '', ca: '', export: '', resultatNet: '', devise: 'FCFA' });
      } else if (type === 'Contacts' && mode === 'edit' && itemIndex !== null && enterprise.contacts) {
        setFormData(enterprise.contacts[itemIndex] || {});
      } else if (type === 'Contacts' && mode === 'add') {
        setFormData({ name: '', function: '', phone: '', email: '', isPrimary: 'Non' });
      } else {
        setFormData(enterprise || {});
      }
    }
  }, [isOpen, enterprise, type, mode, itemIndex]);

  if (!isOpen || !type) return null;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev: any) => ({ ...prev, logo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const renderForm = () => {
    switch (type) {
      case 'Informations générales':
        return (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-400 overflow-hidden">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-10 h-10 text-gray-500" />
                  )}
                </div>
                <label className="absolute top-2 right-2 bg-white p-1 rounded-full border border-gray-400 cursor-pointer hover:bg-gray-100 transition-colors">
                  <PencilIcon size={16} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                </label>
              </div>
            </div>
            {[
              { label: "Date d'adhésion", key: 'dateAdhesion', placeholder: "Entrer Date d'adhésion" },
              { label: "Statut membre", key: 'statutMembre', type: 'select', options: ['Actif', 'Suspendu', 'Radié'] },
              { label: "Raison sociale", key: 'raisonSociale', placeholder: "Entrer Raison social" },
              { label: "Forme juridique", key: 'formeJuridique', type: 'select', options: ['SARL', 'SA', 'SNC', 'Auto-entrepreneur'] },
              { label: "Numéro RC", key: 'numRC', placeholder: "Entrer Numéro RC" },
              { label: "NINEA / ICE", key: 'ninea', placeholder: "Entrer NINEA/ICE" },
              { label: "Date création", key: 'dateCreation', placeholder: "Entrer date création" },
              { label: "Pays", key: 'pays', placeholder: "Entrer Pays" },
              { label: "Ville", key: 'ville', placeholder: "Entrer Ville" },
              { label: "Adresse", key: 'adresse', placeholder: "Entrer Adresse" },
              { label: "Téléphone", key: 'telephone', placeholder: "Entrer Téléphone" },
              { label: "Email", key: 'email', placeholder: "Entrer Email" },
              { label: "Site web", key: 'siteWeb', placeholder: "Entrer Site Web" },
              { label: "Description", key: 'description', placeholder: "Entrer Description" },
              { label: "Secteur d'activité", key: 'secteur', type: 'select', options: ['IT', 'BTP', 'Finance', 'Agriculture', 'Commerce', 'Services', 'Industrie', 'Santé', 'Éducation', 'Tourisme', 'Autre'] },
            ].map((field: any, i) => (
              <div key={i} className="flex items-center gap-4">
                <label className="w-40 text-sm font-medium text-gray-700">{field.label} :</label>
                {field.type === 'select' ? (
                  <select 
                    value={formData[field.key!] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.value }))}
                    className="flex-1 bg-[#EBEBEB] border border-gray-400 rounded p-2 text-sm outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input 
                    type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'} 
                    value={formData[field.key!] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="flex-1 bg-[#EBEBEB] border border-gray-400 rounded p-2 text-sm outline-none placeholder:text-gray-400"
                  />
                )}
              </div>
            ))}
          </div>
        );
      case 'Métiers & expertises':
        return (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-8 mb-8">
              <div className="w-20 h-20 rounded-full border border-gray-300 flex items-center justify-center text-[8px] font-bold text-center p-1 overflow-hidden bg-gray-50">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <>LOGO<br/>Entreprise</>
                )}
              </div>
              <div className="text-[10px] space-y-0.5">
                <p>Numéro membre : {formData.memberNo}</p>
                <p>Statut membre : {formData.statutMembre}</p>
                <p>Date d'adhésion : {formData.dateAdhesion}</p>
                <p>Nom commercial : {formData.name}</p>
                <p>Raison sociale : {formData.raisonSociale}</p>
                <p>Secteur principal : {formData.secteur}</p>
                <p>Pays + ville : {formData.pays} {formData.ville}</p>
              </div>
            </div>
            {[
              { label: "Secteur d'activité", key: 'secteur', type: 'select', options: ['IT', 'BTP', 'Finance', 'Agriculture', 'Commerce', 'Services', 'Industrie', 'Santé', 'Éducation', 'Tourisme', 'Autre'] },
              { label: "Expertise principale", key: 'expertisePrincipale', placeholder: "Entrer Expertise Principale" },
              { label: "Produits /Services", key: 'produitsServices', placeholder: "Entrer Produits/ Services" },
              { label: "Technologies utilisées", key: 'technologies', placeholder: "Entrer les technologies" },
              { label: "Marchés cibles", key: 'marchesCibles', placeholder: "Entrer Marchés cibles" },
              { label: "Clients références", key: 'clientsReferences', placeholder: "Entrer Clients références" },
              { label: "Niveau expertise", key: 'niveauExpertise', type: 'select', options: ['Débutant', 'Intermédiaire', 'Expert'] },
            ].map((field: any, i) => (
              <div key={i} className="flex items-center gap-4">
                <label className="w-40 text-sm font-medium text-gray-700">{field.label} :</label>
                {field.type === 'select' ? (
                  <select 
                    value={formData[field.key!] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.value }))}
                    className="flex-1 bg-[#EBEBEB] border border-gray-400 rounded p-2 text-sm outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    {field.options?.map((opt: any) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input 
                    type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'} 
                    value={formData[field.key!] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="flex-1 bg-[#EBEBEB] border border-gray-400 rounded p-2 text-sm outline-none placeholder:text-gray-400"
                  />
                )}
              </div>
            ))}
          </div>
        );
      case 'Certifications':
        return (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-8 mb-8">
              <div className="w-20 h-20 rounded-full border border-gray-300 flex items-center justify-center text-[8px] font-bold text-center p-1 overflow-hidden bg-gray-50">
                {enterprise.logo ? (
                  <img src={enterprise.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <>LOGO<br/>Entreprise</>
                )}
              </div>
              <div className="text-[10px] space-y-0.5">
                <p>Numéro membre : {enterprise.memberNo}</p>
                <p>Nom commercial : {enterprise.name}</p>
              </div>
            </div>
            {[
              { label: "Nom certification", key: 'name', placeholder: "Ex: ISO 9001" },
              { label: "Code", key: 'code', placeholder: "Ex: ISO9001" },
              { label: "Date d'obtention", key: 'date', type: 'date' },
              { label: "Organisme", key: 'issuer', placeholder: "Ex: AFNOR" },
            ].map((field: any, i) => (
              <div key={i} className="flex items-center gap-4">
                <label className="w-40 text-sm font-medium text-gray-700">{field.label} :</label>
                {field.type === 'select' ? (
                  <select 
                    value={formData[field.key!] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.value }))}
                    className="flex-1 bg-[#EBEBEB] border border-gray-400 rounded p-2 text-sm outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <input 
                    type="checkbox" 
                    checked={formData[field.key!] || false}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.checked }))}
                    className="w-4 h-4 text-[#1A3F23] focus:ring-[#1A3F23] border-gray-300 rounded"
                  />
                ) : (
                  <input 
                    type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'} 
                    value={formData[field.key!] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="flex-1 bg-[#EBEBEB] border border-gray-400 rounded p-2 text-sm outline-none placeholder:text-gray-400"
                  />
                )}
              </div>
            ))}
          </div>
        );
      case 'Données financières':
        return (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-8 mb-8">
              <div className="w-20 h-20 rounded-full border border-gray-300 flex items-center justify-center text-[8px] font-bold text-center p-1 overflow-hidden bg-gray-50">
                {enterprise.logo ? (
                  <img src={enterprise.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <>LOGO<br/>Entreprise</>
                )}
              </div>
              <div className="text-[10px] space-y-0.5">
                <p>Numéro membre : {enterprise.memberNo}</p>
                <p>Nom commercial : {enterprise.name}</p>
              </div>
            </div>
            {[
              { label: "Année", key: 'year', placeholder: "Ex: 2023", type: 'number' },
              { label: "Chiffre d'affaires", key: 'ca', placeholder: "Entrer CA", type: 'number' },
              { label: "Export", key: 'export', placeholder: "Entrer Export", type: 'number' },
              { label: "Résultat net", key: 'result', placeholder: "Entrer le Résultat net", type: 'number' },
              { label: "Devise", key: 'currency', type: 'select', options: ['FCFA', 'EUR', 'USD', 'MAD'] },
            ].map((field: any, i) => (
              <div key={i} className="flex items-center gap-4">
                <label className="w-40 text-sm font-medium text-gray-700">{field.label} :</label>
                {field.type === 'select' ? (
                  <select 
                    value={formData[field.key!] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.value }))}
                    className="flex-1 bg-[#EBEBEB] border border-gray-400 rounded p-2 text-sm outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <input 
                    type="checkbox" 
                    checked={formData[field.key!] || false}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.checked }))}
                    className="w-4 h-4 text-[#1A3F23] focus:ring-[#1A3F23] border-gray-300 rounded"
                  />
                ) : (
                  <input 
                    type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'} 
                    value={formData[field.key!] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="flex-1 bg-[#EBEBEB] border border-gray-400 rounded p-2 text-sm outline-none placeholder:text-gray-400"
                  />
                )}
              </div>
            ))}
          </div>
        );
      case 'Besoins':
        return (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-8 mb-8">
              <div className="w-20 h-20 rounded-full border border-gray-300 flex items-center justify-center text-[8px] font-bold text-center p-1 overflow-hidden bg-gray-50">
                {enterprise.logo ? (
                  <img src={enterprise.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <>LOGO<br/>Entreprise</>
                )}
              </div>
              <div className="text-[10px] space-y-0.5">
                <p>Numéro membre : {enterprise.memberNo}</p>
                <p>Nom commercial : {enterprise.name}</p>
              </div>
            </div>
            {[
              { label: "Titre du besoin", key: 'title', placeholder: "Entrer le titre" },
              { label: "Type de besoin", key: 'type', type: 'select', options: ['Financement', 'Matériel', 'Formation', 'Recrutement', 'Partenariat', 'Autre'] },
              { label: "Description", key: 'description', placeholder: "Décrire le besoin" },
              { label: "Budget estimé", key: 'budget', placeholder: "Ex: 1 000 000 FCFA" },
              { label: "Priorité", key: 'priority', type: 'select', options: ['Basse', 'Moyenne', 'Haute', 'Critique'] },
            ].map((field: any, i) => (
              <div key={i} className="flex items-center gap-4">
                <label className="w-40 text-sm font-medium text-gray-700">{field.label} :</label>
                {field.type === 'select' ? (
                  <select 
                    value={formData[field.key!] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.value }))}
                    className="flex-1 bg-[#EBEBEB] border border-gray-400 rounded p-2 text-sm outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input 
                    type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'} 
                    value={formData[field.key!] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="flex-1 bg-[#EBEBEB] border border-gray-400 rounded p-2 text-sm outline-none placeholder:text-gray-400"
                  />
                )}
              </div>
            ))}
          </div>
        );
      case 'Contacts':
        return (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-8 mb-8">
              <div className="w-20 h-20 rounded-full border border-gray-300 flex items-center justify-center text-[8px] font-bold text-center p-1 overflow-hidden bg-gray-50">
                {enterprise.logo ? (
                  <img src={enterprise.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <>LOGO<br/>Entreprise</>
                )}
              </div>
              <div className="text-[10px] space-y-0.5">
                <p>Numéro membre : {enterprise.memberNo}</p>
                <p>Nom commercial : {enterprise.name}</p>
              </div>
            </div>
            {[
              { label: "Nom", key: 'name', placeholder: "Entrer le Nom" },
              { label: "Fonction", key: 'function', placeholder: "Entrer la fonction" },
              { label: "Téléphone", key: 'phone', placeholder: "Entrer le Téléphone" },
              { label: "Email", key: 'email', placeholder: "Entrer l'Email" },
              { label: "Principal", key: 'isPrimary', type: 'checkbox' },
            ].map((field: any, i) => (
              <div key={i} className="flex items-center gap-4">
                <label className="w-40 text-sm font-medium text-gray-700">{field.label} :</label>
                {field.type === 'select' ? (
                  <select 
                    value={formData[field.key!] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.value }))}
                    className="flex-1 bg-[#EBEBEB] border border-gray-400 rounded p-2 text-sm outline-none"
                  >
                    <option value="">Sélectionner...</option>
                    {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : field.type === 'checkbox' ? (
                  <input 
                    type="checkbox" 
                    checked={formData[field.key!] || false}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.checked }))}
                    className="w-4 h-4 text-[#1A3F23] focus:ring-[#1A3F23] border-gray-300 rounded"
                  />
                ) : (
                  <input 
                    type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'} 
                    value={formData[field.key!] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="flex-1 bg-[#EBEBEB] border border-gray-400 rounded p-2 text-sm outline-none placeholder:text-gray-400"
                  />
                )}
              </div>
            ))}
          </div>
        );
      case 'Cotisations':
        return (
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-8 mb-8">
              <div className="w-20 h-20 rounded-full border border-gray-300 flex items-center justify-center text-[8px] font-bold text-center p-1 overflow-hidden bg-gray-50">
                {enterprise.logo ? (
                  <img src={enterprise.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <>LOGO<br/>Entreprise</>
                )}
              </div>
              <div className="text-[10px] space-y-0.5">
                <p>Numéro membre : {enterprise.memberNo}</p>
                <p>Nom commercial : {enterprise.name}</p>
              </div>
            </div>
            {[
              { label: "Date", key: 'date', type: 'date' },
              { label: "Libellé / Motif", key: 'label', placeholder: "Ex: Cotisation annuelle 2024" },
              { label: "Montant (FCFA)", key: 'amount', placeholder: "Entrer le montant", type: 'number' },
            ].map((field: any, i) => (
              <div key={i} className="flex items-center gap-4">
                <label className="w-40 text-sm font-medium text-gray-700">{field.label} :</label>
                <input 
                  type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'} 
                  value={formData[field.key!] || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="flex-1 bg-[#EBEBEB] border border-gray-400 rounded p-2 text-sm outline-none placeholder:text-gray-400"
                />
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
          className="bg-white w-full max-w-3xl rounded-sm shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] border border-gray-300"
        >
          <div className="p-6 text-center">
            <h2 className="text-4xl font-serif font-bold text-[#4A3728]">{type}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-8 bg-white">
            {renderForm()}
          </div>

          <div className="p-6 flex justify-end">
            <button 
              onClick={() => {
                onSave(formData);
                onClose();
              }}
              className="bg-[#1A3F23] text-[#D4AF37] px-8 py-2 rounded-full font-bold border border-[#D4AF37] hover:bg-[#14321B] transition-colors shadow-lg"
            >
              {mode === 'add' ? 'Ajouter' : 'Valider'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
