import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Pencil } from 'lucide-react';
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
  const [isDragging, setIsDragging] = React.useState(false);

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
        setFormData({ 
          year: '2026', 
          devise: 'XOF - Franc CFA Ouest Africain', 
          ca: '', 
          export: '', 
          ca_maroc: '', 
          ca_senegal: '', 
          resultatNet: '', 
          totalActif: '', 
          capitauxPropres: '', 
          endettement: '', 
          source: '', 
          visibilite: 'Publique' 
        });
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
          <div className="space-y-5 max-w-2xl mx-auto text-gray-900">
            <div className="flex justify-center mb-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl bg-cscm-green-soft flex items-center justify-center border border-cscm-green/15 overflow-hidden shadow-inner">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-10 h-10 text-cscm-green/40" />
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 bg-cscm-green text-white p-2.5 rounded-xl border border-white cursor-pointer hover:bg-[#4B9040] shadow-lg shadow-cscm-green/25 transition-all duration-300">
                  <PencilIcon size={14} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
                </label>
              </div>
            </div>
            {[
              { label: "Date d'adhésion", key: 'dateAdhesion', type: 'date' },
              { label: "Statut membre", key: 'statutMembre', type: 'select', options: ['Actif', 'Suspendu', 'Radié'] },
              { label: "Raison sociale", key: 'raisonSociale', placeholder: "Ex: SARL Sénégal-Maroc Import" },
              { label: "Forme juridique", key: 'formeJuridique', type: 'select', options: ['SARL', 'SA', 'SNC', 'Auto-entrepreneur'] },
              { label: "Numéro RC", key: 'numRC', placeholder: "Saisir numéro d'inscription RC" },
              { label: "NINEA / ICE", key: 'ninea', placeholder: "Saisir NINEA ou code ICE" },
              { label: "Date création", key: 'dateCreation', type: 'date' },
              { label: "Pays", key: 'pays', placeholder: "Ex: Maroc" },
              { label: "Ville", key: 'ville', placeholder: "Ex: Casablanca" },
              { label: "Adresse complète", key: 'adresse', placeholder: "Ex: 22 Rue de l'Avenir, Mers Sultan" },
              { label: "Téléphone", key: 'telephone', placeholder: "Ex: +212 522 00 00 00" },
              { label: "Email principal", key: 'email', placeholder: "Ex: contact@entreprise.com" },
              { label: "Site web officiel", key: 'siteWeb', placeholder: "Ex: https://www.entreprise.com" },
              { label: "Description activité", key: 'description', placeholder: "Présentez l'activité clé de l'entreprise..." },
              { label: "Secteur d'activité", key: 'secteur', type: 'select', options: ['IT', 'BTP', 'Finance', 'Agriculture', 'Commerce', 'Services', 'Industrie', 'Santé', 'Éducation', 'Tourisme', 'Autre'] },
            ].map((field: any, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pb-2 border-b border-gray-100 last:border-0">
                <label className="sm:w-48 text-[11px] font-bold uppercase tracking-wider text-gray-500 shrink-0">{field.label}</label>
                {field.type === 'select' ? (
                  <select 
                    value={formData[field.key!] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.value }))}
                    className="flex-1 w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green outline-none transition-all focus:ring-4 focus:ring-cscm-green/[0.08]"
                  >
                    <option value="" className="text-gray-400 font-medium">Sélectionner...</option>
                    {field.options?.map((opt: string) => <option key={opt} value={opt} className="text-gray-900 font-semibold">{opt}</option>)}
                  </select>
                ) : (
                  <input 
                    type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'} 
                    value={formData[field.key!] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="flex-1 w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green outline-none transition-all focus:ring-4 focus:ring-cscm-green/[0.08] placeholder:text-gray-300"
                  />
                )}
              </div>
            ))}
          </div>
        );
      case 'Métiers & expertises':
        return (
          <div className="space-y-5 max-w-2xl mx-auto text-gray-900 font-sans">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-600 font-medium leading-relaxed mb-6">
              Saisissez un secteur ou une expertise par ligne. Les lignes de même position seront associées ensemble.
            </div>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5 pb-2 border-b border-gray-100">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Secteurs d'activité :</label>
                <textarea 
                  rows={3}
                  value={formData.secteur || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, secteur: e.target.value }))}
                  placeholder="Tourisme&#10;Agriculture&#10;IT"
                  className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all placeholder:text-gray-300"
                />
              </div>

              <div className="flex flex-col gap-1.5 pb-2 border-b border-gray-100">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Expertises :</label>
                <textarea 
                  rows={3}
                  value={formData.expertisePrincipale || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, expertisePrincipale: e.target.value }))}
                  placeholder="Tourisme&#10;Conseil hôtelier"
                  className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all placeholder:text-gray-300"
                />
              </div>

              <div className="flex flex-col gap-1.5 pb-2 border-b border-gray-100">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Produits / Services :</label>
                <textarea 
                  rows={2}
                  value={formData.produitsServices || formData.produits_services || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, produitsServices: e.target.value }))}
                  placeholder="Lister les produits et services"
                  className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all placeholder:text-gray-300"
                />
              </div>

              <div className="flex flex-col gap-1.5 pb-2 border-b border-gray-100">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Technologies utilisées :</label>
                <textarea 
                  rows={2}
                  value={formData.technologies || formData.technologies_utilisees || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, technologies: e.target.value }))}
                  placeholder="Lister les technologies"
                  className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all placeholder:text-gray-300"
                />
              </div>

              <div className="flex flex-col gap-1.5 pb-2 border-b border-gray-100">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Marchés cibles :</label>
                <input 
                  type="text" 
                  value={formData.marchesCibles || formData.marches_cibles || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, marchesCibles: e.target.value }))}
                  placeholder="Ex: Région UEMOA"
                  className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all placeholder:text-gray-300"
                />
              </div>

              <div className="flex flex-col gap-1.5 pb-2 border-b border-gray-100">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Clients références :</label>
                <textarea 
                  rows={2}
                  value={formData.clientsReferences || formData.clients_references || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, clientsReferences: e.target.value }))}
                  placeholder="Lister les clients importants"
                  className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all placeholder:text-gray-300"
                />
              </div>

              <div className="flex flex-col gap-1.5 pb-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Niveau expertise :</label>
                <select 
                  value={formData.niveauExpertise || formData.niveau_expertise || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, niveauExpertise: e.target.value }))}
                  className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all"
                >
                  <option value="">Sélectionner...</option>
                  <option value="Expert">Expert</option>
                  <option value="Intermédiaire">Intermédiaire</option>
                  <option value="Débutant">Débutant</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 'Certifications':
        return (
          <div className="space-y-5 max-w-2xl mx-auto text-gray-800 font-sans">
            <p className="text-xs text-gray-500 font-medium pb-2 border-b">
              Ajoutez les détails de la certification et versez la pièce justificative (PDF ou PNG).
            </p>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pb-2 border-b border-gray-100">
                <label className="sm:w-48 text-[11px] font-bold uppercase tracking-wider text-gray-500">Nom de la certification :</label>
                <input 
                  type="text" 
                  value={formData.name || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: ISO 9001 - Management de la Qualité"
                  className="flex-1 w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all placeholder:text-gray-300"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pb-2 border-b border-gray-100">
                <label className="sm:w-48 text-[11px] font-bold uppercase tracking-wider text-gray-500">Code de la certification :</label>
                <input 
                  type="text" 
                  value={formData.code || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, code: e.target.value }))}
                  placeholder="Ex: ISO-9001-2015"
                  className="flex-1 w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all placeholder:text-gray-300"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pb-2 border-b border-gray-100">
                <label className="sm:w-48 text-[11px] font-bold uppercase tracking-wider text-gray-500">Date d'obtention :</label>
                <input 
                  type="date"
                  value={formData.date || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, date: e.target.value }))}
                  className="flex-1 w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pb-4 border-b border-gray-100">
                <label className="sm:w-48 text-[11px] font-bold uppercase tracking-wider text-gray-500">Organisme émetteur :</label>
                <input 
                  type="text" 
                  value={formData.issuer || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, issuer: e.target.value }))}
                  placeholder="Ex: AFNOR Certification"
                  className="flex-1 w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all placeholder:text-gray-300"
                />
              </div>

              {/* PDF or PNG Uploader supporting Drag & Drop */}
              <div className="space-y-2 mt-4 text-left">
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">Téléverser le certificat (Format PDF ou PNG) :</label>
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData((prev: any) => ({
                          ...prev,
                          fileData: reader.result,
                          fileName: file.name,
                          fileType: file.type
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${
                    isDragging 
                      ? 'border-cscm-green bg-cscm-green-soft scale-[0.99]' 
                      : formData.fileData 
                        ? 'border-emerald-200 bg-emerald-50/40' 
                        : 'border-gray-200 hover:border-cscm-green bg-white'
                  }`}
                >
                  <input 
                    type="file" 
                    id="cert-file-picker"
                    className="hidden" 
                    accept="application/pdf,image/png,image/jpeg" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData((prev: any) => ({
                            ...prev,
                            fileData: reader.result,
                            fileName: file.name,
                            fileType: file.type
                          }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label htmlFor="cert-file-picker" className="cursor-pointer block space-y-1.5 h-full w-full">
                    <div className="flex justify-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                      </svg>
                    </div>
                    {formData.fileData ? (
                      <div className="space-y-1 text-center">
                        <p className="text-xs font-bold text-emerald-700">✓ Document téléversé avec succès</p>
                        <p className="text-[11px] text-gray-500 font-mono select-all font-semibold truncate max-w-md mx-auto">{formData.fileName}</p>
                        {formData.fileType?.startsWith('image/') && (
                          <div className="mt-3 flex justify-center">
                            <img src={formData.fileData} alt="" className="max-h-24 rounded border object-contain shadow-xs" />
                          </div>
                        )}
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFormData((prev: any) => {
                              const copy = { ...prev };
                              delete copy.fileData;
                              delete copy.fileName;
                              delete copy.fileType;
                              return copy;
                            });
                          }}
                          className="mt-2 text-[10px] font-bold text-rose-600 bg-white px-2 py-1 rounded-full border border-rose-100 hover:bg-rose-50 transition-all duration-300"
                        >
                          Supprimer le fichier
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-gray-600">Glissez-déposez le fichier ici, ou <span className="text-cscm-green underline">cliquez pour choisir</span></p>
                        <p className="text-[10px] text-gray-400 font-medium">Formats autorisés : PDF ou PNG</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Données financières':
        return (
          <div className="space-y-6 max-w-2xl mx-auto text-gray-800 font-sans">
            {/* Header Member Profile Box */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-cscm-green-soft/70 border border-cscm-green/[0.08]">
              <div className="w-16 h-16 rounded-xl border border-gray-200 flex items-center justify-center bg-white overflow-hidden shrink-0">
                {enterprise.logo ? (
                  <img src={enterprise.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-cscm-green-soft flex items-center justify-center font-bold text-cscm-green">
                    {enterprise.name ? enterprise.name.charAt(0) : 'E'}
                  </div>
                )}
              </div>
              <div className="text-xs space-y-1 text-gray-700 font-medium">
                <p className="text-sm font-bold text-[#274420]">{enterprise.name || 'Afrikeys'}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <p><span className="text-gray-400 font-bold">Numéro membre :</span> <span className="font-mono font-bold text-gray-800">{enterprise.memberNo || 'M001'}</span></p>
                  <p><span className="text-gray-400 font-bold">Nom commercial :</span> <span className="font-bold text-gray-800">{enterprise.raisonSociale || enterprise.name || 'Afrikeys'}</span></p>
                </div>
              </div>
            </div>

            {/* Grid structure for groups */}
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Exercice fiscal :</label>
                  <input 
                    type="number"
                    value={formData.year || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, year: e.target.value }))}
                    placeholder="2026"
                    className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Devise :</label>
                  <select 
                    value={formData.devise || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, devise: e.target.value }))}
                    className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all"
                  >
                    <option value="XOF - Franc CFA Ouest Africain">XOF - Franc CFA Ouest Africain</option>
                    <option value="EUR - Euro">EUR - Euro</option>
                    <option value="MAD - Dirham Marocain">MAD - Dirham Marocain</option>
                    <option value="USD - Dollar US">USD - Dollar US</option>
                  </select>
                </div>
              </div>

              {/* CHIFFRE D'AFFAIRES SECTION */}
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase text-cscm-green tracking-wider block border-b border-cscm-green/10 pb-1 mt-4 mb-3">
                  CHIFFRE D'AFFAIRES
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">CA total :</label>
                    <input 
                      type="number"
                      value={formData.ca || ''}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, ca: e.target.value }))}
                      placeholder="CA total"
                      className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">CA Export :</label>
                    <input 
                      type="number"
                      value={formData.export || ''}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, export: e.target.value }))}
                      placeholder="CA Export"
                      className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">CA Maroc :</label>
                    <input 
                      type="number"
                      value={formData.ca_maroc || ''}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, ca_maroc: e.target.value }))}
                      placeholder="CA Maroc"
                      className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">CA Sénégal :</label>
                    <input 
                      type="number"
                      value={formData.ca_senegal || ''}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, ca_senegal: e.target.value }))}
                      placeholder="CA Sénégal"
                      className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* RENTABILITÉ ET RÉSULTATS SECTION */}
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase text-cscm-green tracking-wider block border-b border-cscm-green/10 pb-1 mt-4 mb-3">
                  RENTABILITÉ ET RÉSULTATS
                </span>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Résultat net :</label>
                  <input 
                    type="number"
                    value={formData.resultatNet || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, resultatNet: e.target.value }))}
                    placeholder="Résultat net"
                    className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all"
                  />
                </div>
              </div>

              {/* BILAN SECTION */}
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase text-cscm-green tracking-wider block border-b border-cscm-green/10 pb-1 mt-4 mb-3">
                  BILAN
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Total actif :</label>
                    <input 
                      type="number"
                      value={formData.totalActif || ''}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, totalActif: e.target.value }))}
                      placeholder="Total actif"
                      className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Capitaux propres :</label>
                    <input 
                      type="number"
                      value={formData.capitauxPropres || ''}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, capitauxPropres: e.target.value }))}
                      placeholder="Capitaux propres"
                      className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Endettement :</label>
                    <input 
                      type="number"
                      value={formData.endettement || ''}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, endettement: e.target.value }))}
                      placeholder="Endettement"
                      className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* MÉTADONNÉES SECTION */}
              <div className="text-left">
                <span className="text-[10px] font-bold uppercase text-cscm-green tracking-wider block border-b border-cscm-green/10 pb-1 mt-4 mb-3">
                  MÉTADONNÉES
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Source des données :</label>
                    <input 
                      type="text"
                      value={formData.source || ''}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, source: e.target.value }))}
                      placeholder="Ex: Bilan comptable"
                      className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all placeholder:text-gray-300"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Visibilité :</label>
                    <select 
                      value={formData.visibilite || ''}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, visibilite: e.target.value }))}
                      className="w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green focus:ring-4 focus:ring-cscm-green/[0.08] outline-none transition-all animate-none"
                    >
                      <option value="Publique">Publique</option>
                      <option value="Privée">Privée</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'Besoins':
        return (
          <div className="space-y-5 max-w-2xl mx-auto text-gray-900">
            {[
              { label: "Titre du besoin", key: 'title', placeholder: "Ex: Recherche de distributeur logistique agréé" },
              { label: "Type de besoin", key: 'type', type: 'select', options: ['Financement', 'Matériel', 'Formation', 'Recrutement', 'Partenariat', 'Autre'] },
              { label: "Description", key: 'description', placeholder: "Saisir les modalités et spécificités de ce besoin d'affaires..." },
              { label: "Budget estimé (FCFA)", key: 'budget', placeholder: "Ex: 2 500 000" },
              { label: "Priorité administrative", key: 'priority', type: 'select', options: ['Basse', 'Moyenne', 'Haute', 'Critique'] },
            ].map((field: any, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pb-2 border-b border-gray-100 last:border-0">
                <label className="sm:w-48 text-[11px] font-bold uppercase tracking-wider text-gray-500 shrink-0">{field.label}</label>
                {field.type === 'select' ? (
                  <select 
                    value={formData[field.key!] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.value }))}
                    className="flex-1 w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green outline-none transition-all focus:ring-4 focus:ring-cscm-green/[0.08]"
                  >
                    <option value="" className="text-gray-400 font-medium">Sélectionner...</option>
                    {field.options?.map((opt: string) => <option key={opt} value={opt} className="text-gray-900 font-semibold">{opt}</option>)}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    value={formData[field.key!] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="flex-1 w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green outline-none transition-all focus:ring-4 focus:ring-cscm-green/[0.08] placeholder:text-gray-300"
                  />
                )}
              </div>
            ))}
          </div>
        );
      case 'Contacts':
        return (
          <div className="space-y-5 max-w-2xl mx-auto text-gray-900">
            {[
              { label: "Nom complet du contact", key: 'name', placeholder: "Ex: Moustapha Diop" },
              { label: "Fonction institutionnelle", key: 'function', placeholder: "Ex: Directeur Général" },
              { label: "Téléphone", key: 'phone', placeholder: "Ex: +221 77 000 00 00" },
              { label: "Email de contact", key: 'email', placeholder: "Ex: moustapha@entreprise.com" },
              { label: "Contact principal ?", key: 'isPrimary', type: 'select', options: ['Oui', 'Non'] },
            ].map((field: any, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pb-2 border-b border-gray-100 last:border-0">
                <label className="sm:w-48 text-[11px] font-bold uppercase tracking-wider text-gray-500 shrink-0">{field.label}</label>
                {field.type === 'select' ? (
                  <select 
                    value={formData[field.key!] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.value }))}
                    className="flex-1 w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green outline-none transition-all focus:ring-4 focus:ring-cscm-green/[0.08]"
                  >
                    <option value="" className="text-gray-400 font-medium">Sélectionner...</option>
                    {field.options?.map((opt: string) => <option key={opt} value={opt} className="text-gray-900 font-semibold">{opt}</option>)}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    value={formData[field.key!] || ''}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.value }))}
                    placeholder={field.placeholder}
                    className="flex-1 w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green outline-none transition-all focus:ring-4 focus:ring-cscm-green/[0.08] placeholder:text-gray-300"
                  />
                )}
              </div>
            ))}
          </div>
        );
      case 'Cotisations':
        return (
          <div className="space-y-5 max-w-2xl mx-auto text-gray-900">
            {[
              { label: "Date de versement", key: 'date', type: 'date' },
              { label: "Motif / Libellé de paiement", key: 'label', placeholder: "Ex: Paiement Cotisation Annuelle 2024" },
              { label: "Montant (FCFA)", key: 'amount', placeholder: "Ex: 10000", type: 'number' },
            ].map((field: any, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 pb-2 border-b border-gray-100 last:border-0">
                <label className="sm:w-48 text-[11px] font-bold uppercase tracking-wider text-gray-500 shrink-0">{field.label}</label>
                <input 
                  type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'} 
                  value={formData[field.key!] || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, [field.key!]: e.target.value }))}
                  placeholder={field.placeholder || ''}
                  className="flex-1 w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm text-gray-800 focus:bg-white focus:border-cscm-green outline-none transition-all focus:ring-4 focus:ring-cscm-green/[0.08] placeholder:text-gray-300"
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
        {/* Modal Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        />
        
        {/* Modal Body Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 25 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 25 }}
          className="bg-white w-full max-w-3xl rounded-[2rem] ring-1 ring-black/5 shadow-[0_30px_80px_-24px_rgba(62,123,50,0.3)] relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="modal-header text-center relative flex flex-col items-center justify-center">
            <h2 className="text-xl md:text-2xl font-sans font-bold text-[#274420] tracking-tight leading-snug">
              {type}
            </h2>
            <p className="text-[10px] text-[#22301C]/55 font-bold uppercase tracking-widest mt-1">
              Configuration & Réglage des Propriétés
            </p>
            <button 
              onClick={onClose}
              className="absolute right-4 top-4 p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all duration-300 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form scrollable viewport */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white">
            {renderForm()}
          </div>

          {/* Footer controls */}
          <div className="p-5 bg-cscm-green-soft/70 border-t border-cscm-green/[0.08] flex justify-end gap-3.5">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 text-gray-600 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
            >
              Annuler
            </button>
            <button 
              onClick={() => {
                onSave(formData);
                onClose();
              }}
              className="btn-sheen bg-gradient-to-b from-[#4B9040] to-[#3A7230] hover:from-[#529B46] hover:to-[#417F36] text-white px-8 py-2.5 font-bold text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-cscm-green/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 select-none cursor-pointer"
            >
              {mode === 'add' ? 'Ajouter' : 'Enregistrer'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
