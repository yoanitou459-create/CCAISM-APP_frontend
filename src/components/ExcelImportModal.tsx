import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, CheckCircle2, FileSpreadsheet, ShieldAlert, ArrowRight, Table, AlertTriangle } from 'lucide-react';
import { getStoredEnterprises, saveStoredEnterprises } from '../utils/enterpriseStorage';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({ isOpen, onClose, onImportSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Drop, 2: Preview & Mapping, 3: Success
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [validationReport, setValidationReport] = useState<{
    errors: string[];
    warnings: string[];
    duplicatesInFile: string[];
    duplicatesWithStored: string[];
  }>({ errors: [], warnings: [], duplicatesInFile: [], duplicatesWithStored: [] });
  const [cleanParsedData, setCleanParsedData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processText = (text: string) => {
    try {
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
      if (lines.length < 2) {
        throw new Error("Le fichier doit contenir une ligne d'en-tête et au moins une ligne de données.");
      }

      // Detect separator (comma or semicolon)
      const headerLine = lines[0];
      const separator = headerLine.includes(';') ? ';' : ',';
      
      const headers = headerLine.split(separator).map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
      
      // Structural check
      const errors: string[] = [];
      const warnings: string[] = [];
      const duplicatesInFile: string[] = [];
      const duplicatesWithStored: string[] = [];

      const required = ['numero_membre', 'raison_sociale'];
      const missingRequired = required.filter(r => !headers.includes(r) && (r !== 'raison_sociale' || !headers.includes('nom_commercial')));
      
      if (missingRequired.length > 0) {
        errors.push(`Erreur de structure : Les colonnes requises ne sont pas présentes : ${missingRequired.join(', ')}`);
      }

      const knownHeaders = [
        'numero_membre', 'raison_sociale', 'nom_commercial', 'type_membre', 'statut_adhesion',
        'date_adhesion', 'date_creation', 'numero_rc', 'ninea', 'ice', 'secteur', 'forme_juridique',
        'pays', 'ville', 'adresse_complete', 'code_postal', 'telephone_principale', 'telephone_secondaire',
        'email_principal', 'site_web', 'effectif', 'description_activite', 'nom_adherent', 'prenom_adherent',
        'cotisation_2023', 'cotisation_2024', 'cotisation_2025', 'chiffre_affaires_2023', 'chiffre_affaires_2024',
        'ca_export_2023', 'ca_export_2024', 'ca_maroc_2023', 'ca_maroc_2024', 'ca_senegal_2023', 'ca_senegal_2024',
        'resultat_net_2023', 'resultat_net_2024', 'total_actif_2023', 'total_actif_2024', 'capitaux_propres_2023',
        'capitaux_propres_2024', 'endettement_2023', 'endettement_2024', 'produits_services', 'technologies_utilisees',
        'marches_cibles', 'clients_references', 'niveau_expertise', 'capacite_production'
      ];

      headers.forEach(h => {
        if (!knownHeaders.includes(h)) {
          warnings.push(`Colonne insolite : "${h}" ne correspond à aucun champ connu (elle sera importée en tant que métadonnées libres).`);
        }
      });

      const rows = lines.slice(1).map((line) => {
        // Simple but safe quote-aware splitter or custom split
        let values: string[] = [];
        if (line.includes('"')) {
          let currentVal = '';
          let insideQuotes = false;
          for (let k = 0; k < line.length; k++) {
            const char = line[k];
            if (char === '"') {
              insideQuotes = !insideQuotes;
            } else if (char === separator && !insideQuotes) {
              values.push(currentVal.trim());
              currentVal = '';
            } else {
              currentVal += char;
            }
          }
          values.push(currentVal.trim());
        } else {
          values = line.split(separator).map(v => v.trim());
        }
        
        const rowData: any = {};
        headers.forEach((header, index) => {
          rowData[header] = (values[index] || '').replace(/^["']|["']$/g, '').trim();
        });
        return rowData;
      });

      const stored = getStoredEnterprises();
      const seenFileNames = new Set<string>();
      const seenFileMembers = new Set<string>();

      const mappedEnterprises: any[] = [];
      const cleanMapped: any[] = [];

      rows.forEach((row, i) => {
        const rowNum = i + 2;
        const name = row.nom_commercial || row.raison_sociale || `Entreprise Importée ${i + 1}`;
        const raisonSociale = row.raison_sociale || name;
        const memberNo = row.numero_membre || `M${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
        
        // Handle standard sector merging
        const appSectors = ['IT', 'BTP', 'Finance', 'Agriculture', 'Commerce', 'Services', 'Industrie', 'Santé', 'Éducation', 'Tourisme', 'Autre'];
        let rawSecteur = (row.secteur || '').trim();
        let parsedSecteur = rawSecteur;
        const matchingSec = appSectors.find(s => s.toLowerCase() === rawSecteur.toLowerCase());
        if (matchingSec) {
          parsedSecteur = matchingSec;
        } else {
          parsedSecteur = 'Autre';
          if (rawSecteur) {
            warnings.push(`Ligne ${rowNum} : Secteur "${rawSecteur}" non répertorié - classé automatiquement dans "Autre"`);
          }
        }

        const enterpriseObj = {
          id: Date.now() + i,
          name,
          memberNo,
          statutMembre: row.statut_adhesion || 'Actif',
          dateAdhesion: row.date_adhesion || new Date().toISOString().split('T')[0],
          raisonSociale,
          pays: row.pays || 'Sénégal',
          ville: row.ville || 'Dakar',
          secteur: parsedSecteur,
          effectif: row.effectif || 'N/A',
          formeJuridique: row.forme_juridique || 'SARL',
          numRC: row.numero_rc || 'N/A',
          ninea: row.ninea || 'N/A',
          ice: row.ice || 'N/A',
          dateCreation: row.date_creation || '2022-01-01',
          adresse: row.adresse_complete || 'N/A',
          telephone: row.telephone_principale || row.telephone_secondaire || 'N/A',
          email: row.email_principal || `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          siteWeb: row.site_web || '',
          description: row.description_activite || 'Importé par fichier CSV/Excel.',
          logo: null,
          cotisations: [],

          // Store the specific required fields for the application
          type_membre: row.type_membre || 'Inscrit',
          statut_adhesion: row.statut_adhesion || 'Actif',
          code_postal: row.code_postal || '',
          telephone_principale: row.telephone_principale || '',
          telephone_secondaire: row.telephone_secondaire || '',
          email_principal: row.email_principal || '',
          description_activite: row.description_activite || '',
          nom_adherent: row.nom_adherent || '',
          prenom_adherent: row.prenom_adherent || '',
          
          // Contribution years stored as explicit fields to count on totals
          cotisation_2023: row.cotisation_2023 || '',
          cotisation_2024: row.cotisation_2024 || '',
          cotisation_2025: row.cotisation_2025 || '',

          // Financial Indicators
          chiffre_affaires_2023: row.chiffre_affaires_2023 || '',
          chiffre_affaires_2024: row.chiffre_affaires_2024 || '',
          ca_export_2023: row.ca_export_2023 || '',
          ca_export_2024: row.ca_export_2024 || '',
          ca_maroc_2023: row.ca_maroc_2023 || '',
          ca_maroc_2024: row.ca_maroc_2024 || '',
          ca_senegal_2023: row.ca_senegal_2023 || '',
          ca_senegal_2024: row.ca_senegal_2024 || '',
          resultat_net_2023: row.resultat_net_2023 || '',
          resultat_net_2024: row.resultat_net_2024 || '',
          total_actif_2023: row.total_actif_2023 || '',
          total_actif_2024: row.total_actif_2024 || '',
          capitaux_propres_2023: row.capitaux_propres_2023 || '',
          capitaux_propres_2024: row.capitaux_propres_2024 || '',
          endettement_2023: row.endettement_2023 || '',
          endettement_2024: row.endettement_2024 || '',

          // Production/Capabilities Indicators
          produits_services: row.produits_services || '',
          technologies_utilisees: row.technologies_utilisees || '',
          marches_cibles: row.marches_cibles || '',
          clients_references: row.clients_references || '',
          niveau_expertise: row.niveau_expertise || '',
          capacite_production: row.capacite_production || ''
        };

        const nameLower = raisonSociale.trim().toLowerCase();
        const memberLower = memberNo.trim().toLowerCase();

        let isDup = false;

        // Dynamic checks for Sector consistency are now handled in the parsing phase upper in the code

        // Dynamic checks for Expertise Level consistency
        const currentExpertise = row.niveau_expertise || '';
        if (currentExpertise && !['Débutant', 'Intermédiaire', 'Expert'].includes(currentExpertise)) {
          warnings.push(`Ligne ${rowNum} : Niveau expertise '${currentExpertise}' non reconnu - valeur ignorée`);
        }

        // Check internal duplicates
        if (seenFileNames.has(nameLower)) {
          duplicatesInFile.push(`Ligne ${rowNum} : Doublon de nom d'entreprise "${name}" dans le fichier.`);
          warnings.push(`Ligne ${rowNum} : Entreprise "${name}" existe déjà - non mise à jour`);
          isDup = true;
        } else if (seenFileMembers.has(memberLower)) {
          duplicatesInFile.push(`Ligne ${rowNum} : Doublon de numéro de membre "${memberNo}" dans le fichier.`);
          warnings.push(`Ligne ${rowNum} : Entreprise avec numéro ${memberNo} existe déjà - non mise à jour`);
          isDup = true;
        }

        // Check stored duplicates
        const alreadyStoredByName = stored.some(s => (s.raisonSociale || s.name || '').trim().toLowerCase() === nameLower);
        if (alreadyStoredByName) {
          duplicatesWithStored.push(`Ligne ${rowNum} : "${name}" existe déjà dans l'annuaire actuel.`);
          warnings.push(`Ligne ${rowNum} : Entreprise "${name}" existe déjà - non mise à jour`);
          isDup = true;
        } else {
          const alreadyStoredByNo = stored.some(s => (s.memberNo || '').trim().toLowerCase() === memberLower);
          if (alreadyStoredByNo) {
            duplicatesWithStored.push(`Ligne ${rowNum} : Numéro de membre "${memberNo}" déjà attribué.`);
            warnings.push(`Ligne ${rowNum} : Entreprise avec numéro ${memberNo} existe déjà - non mise à jour`);
            isDup = true;
          }
        }

        seenFileNames.add(nameLower);
        seenFileMembers.add(memberLower);

        mappedEnterprises.push(enterpriseObj);
        if (!isDup) {
          cleanMapped.push(enterpriseObj);
        }
      });

      if (errors.length > 0) {
        throw new Error(errors.join(' | '));
      }

      setValidationReport({
        errors,
        warnings,
        duplicatesInFile,
        duplicatesWithStored
      });

      setParsedData(mappedEnterprises);
      setCleanParsedData(cleanMapped);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la lecture du fichier.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      const ext = selectedFile.name.split('.').pop()?.toLowerCase();
      if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
        setFile(selectedFile);
        const reader = new FileReader();
        reader.onload = (evt) => {
          const text = evt.target?.result as string;
          processText(text);
        };
        reader.readAsText(selectedFile);
      } else {
        setErrorMsg('Veuillez déposer un fichier CSV ou Excel (.xlsx, .xls)');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (evt) => {
        const text = evt.target?.result as string;
        processText(text);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleImportConfirm = () => {
    const current = getStoredEnterprises();
    const updated = [...current, ...cleanParsedData];
    saveStoredEnterprises(updated);
    setStep(3);
    if (onImportSuccess) {
      onImportSuccess();
    }
  };

  const handleClose = () => {
    setFile(null);
    setStep(1);
    setParsedData([]);
    setCleanParsedData([]);
    setValidationReport({ errors: [], warnings: [], duplicatesInFile: [], duplicatesWithStored: [] });
    setErrorMsg('');
    onClose();
  };

  const downloadTemplate = () => {
    // Exact list of csv columns as requested by the user
    const headers = "numero_membre,raison_sociale,nom_commercial,type_membre,statut_adhesion,date_adhesion,date_creation,numero_rc,ninea,ice,secteur,forme_juridique,pays,ville,adresse_complete,code_postal,telephone_principale,telephone_secondaire,email_principal,site_web,effectif,description_activite,nom_adherent,prenom_adherent,cotisation_2023,cotisation_2024,cotisation_2025,chiffre_affaires_2023,chiffre_affaires_2024,ca_export_2023,ca_export_2024,ca_maroc_2023,ca_maroc_2024,ca_senegal_2023,ca_senegal_2024,resultat_net_2023,resultat_net_2024,total_actif_2023,total_actif_2024,capitaux_propres_2023,capitaux_propres_2024,endettement_2023,endettement_2024,produits_services,technologies_utilisees,marches_cibles,clients_references,niveau_expertise,capacite_production\n";
    const sample = "M305,Innov Senegal SARL,Innov Senegal,Fondateur,Actif,2023-01-15,2022-01-01,RC-DKR-303,NINEA-309,ICE-409,IT,SARL,Sénégal,Dakar,Point E Rue 14,11000,+221338123456,+221776543210,contact@innov.sn,www.innov.sn,35,Développement informatique,Ndiaye,Amadou,250000,250000,250000,50000000,65000000,10000000,15000000,40000000,50000000,10000000,15000000,5000000,7500000,25000000,32000000,15000000,22500000,3000000,2000000,Logiciels ERP,React Node PostgreSQL,Sénégal FMCG,Orange Sonatel,Expert,Haute\n";
    const blob = new Blob([headers + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "gabarit_importation_cscm.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal body */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white text-[#22301C] w-full max-w-2xl rounded-[2rem] ring-1 ring-black/5 shadow-[0_30px_80px_-24px_rgba(62,123,50,0.3)] relative z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="modal-header">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cscm-green-soft text-cscm-green flex items-center justify-center border border-cscm-green/15">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-sans font-bold text-lg text-[#274420]">Importation de Fichiers Excel / CSV</h3>
                <p className="text-xs text-[#22301C]/55">Ajoutez plusieurs entreprises en quelques clics</p>
              </div>
            </div>
            <button onClick={handleClose} className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors duration-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 max-h-[85vh] overflow-y-auto">
            {step === 1 && (
              <div className="space-y-6">
                <div className="bg-cscm-green-soft/60 border border-cscm-green/15 p-4 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-white text-cscm-green rounded-xl shrink-0 ring-1 ring-cscm-green/15">
                    <Table className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#274420] uppercase tracking-wider mb-1">Gabarit d'importation personnalisé</h4>
                    <p className="text-xs text-[#22301C]/55 leading-relaxed">
                      Le gabarit d'importation inclut l'ensemble de la structure de vos colonnes requises : <strong>numero_membre, raison_sociale, cotisation_2023, cotisation_2024, ca_maroc, ca_senegal</strong>...
                    </p>
                    <button 
                      onClick={downloadTemplate}
                      className="text-xs font-bold text-cscm-green hover:underline mt-2 flex items-center gap-1 cursor-pointer"
                    >
                      Télécharger le gabarit d'exemple (.csv) <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Dropzone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
                    dragActive 
                      ? 'border-cscm-green bg-cscm-green-soft/70 scale-[0.99]' 
                      : 'border-cscm-green/30 bg-cscm-green-soft/40 hover:bg-cscm-green-soft/70'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".csv, .xlsx, .xls"
                    onChange={handleFileChange}
                  />
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-cscm-green/15 shadow-sm transition-transform duration-300">
                    <Upload className="w-8 h-8 text-cscm-green" />
                  </div>
                  <h4 className="font-bold text-base text-[#274420] mb-1">Glissez-déposez votre fichier Excel ou CSV</h4>
                  <p className="text-xs text-[#22301C]/55 mb-2">ou</p>
                  
                  {/* Browse button */}
                  <div className="inline-block my-2">
                    <span className="btn-sheen bg-gradient-to-b from-[#4B9040] to-[#3A7230] hover:from-[#529B46] hover:to-[#417F36] text-white font-bold px-6 py-2 rounded-2xl text-xs uppercase tracking-wider block shadow-lg shadow-cscm-green/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
                      Parcourir
                    </span>
                  </div>

                  <p className="text-xs text-[#22301C]/55 max-w-sm mx-auto mb-2 mt-1">
                    Formats acceptés: .xlsx, .xls, .csv • Taille max: 50 MB
                  </p>
                  <p className="text-[11px] text-cscm-green font-semibold flex items-center justify-center gap-1">
                    <span>💡</span>
                    <span>Les fichiers CSV sont parfaits pour un import simple et rapide.</span>
                  </p>
                </div>

                {errorMsg && (
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-start gap-2.5 text-rose-700 text-sm">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-emerald-600 text-sm flex items-start gap-2.5 shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold text-[#065f46]">Fichier validé avec succès !</h5>
                    <p className="text-xs text-[#047857] mt-1 leading-relaxed">
                      Le fichier comporte {parsedData.length} ligne(s). Après analyse, <strong>{cleanParsedData.length} entreprise(s) saine(s)</strong> vont être ajoutées à l'annuaire.
                      {parsedData.length - cleanParsedData.length > 0 && (
                        <span> <strong>{parsedData.length - cleanParsedData.length} doublon(s)</strong> ont été détectés et seront automatiquement écartés lors de la validation.</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Duplicates Report Card */}
                {(validationReport.duplicatesInFile.length > 0 || validationReport.duplicatesWithStored.length > 0) && (
                  <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-2xl space-y-2.5 shadow-sm">
                    <div className="flex items-center gap-2 text-amber-900">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-amber-700 font-black animate-pulse" />
                      <h4 className="font-bold text-xs uppercase tracking-wider">Doublons d'entreprises détectés</h4>
                    </div>
                    <p className="text-xs text-amber-800">
                      Voici les lignes qui posent problème (doublon de nom d'entreprise ou de numéro de membre). Elles seront filtrées :
                    </p>
                    <div className="bg-white/80 border border-amber-200/30 rounded-xl p-2.5 max-h-[140px] overflow-y-auto space-y-1 font-mono text-[10px] text-amber-800">
                      {validationReport.duplicatesInFile.map((item, idx) => (
                        <div key={`file-dup-${idx}`} className="flex items-start gap-1 pb-1 border-b border-amber-100 last:border-0 last:pb-0">
                          <span className="font-bold shrink-0">[Fichier]</span>
                          <span>{item}</span>
                        </div>
                      ))}
                      {validationReport.duplicatesWithStored.map((item, idx) => (
                        <div key={`db-dup-${idx}`} className="flex items-start gap-1 pb-1 border-b border-amber-100 last:border-0 last:pb-0 text-amber-700">
                          <span className="font-bold shrink-0">[Annuaire Actuel]</span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Structural Warnings Report Card */}
                {validationReport.warnings.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2.5 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-800">
                      <Table className="w-4 h-4 text-slate-500 shrink-0" />
                      <h4 className="font-bold text-xs uppercase tracking-wider">Mise en garde sur la structure du fichier</h4>
                    </div>
                    <p className="text-xs text-slate-600">
                      Des colonnes non conformes par rapport au modèle officiel de la Chambre ont été relevées :
                    </p>
                    <div className="bg-white/90 border border-slate-200/50 rounded-xl p-2.5 max-h-[100px] overflow-y-auto space-y-1 font-mono text-[10px] text-slate-600">
                      {validationReport.warnings.map((item, idx) => (
                        <div key={`warning-${idx}`} className="pb-1 border-b border-slate-100 last:border-0 last:pb-0">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview Table */}
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm max-h-[200px] overflow-y-auto">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead className="bg-cscm-green-soft/70 font-bold uppercase tracking-wider text-[#274420] sticky top-0">
                      <tr>
                        <th className="p-3">Numéro</th>
                        <th className="p-3">Raison sociale</th>
                        <th className="p-3">Secteur</th>
                        <th className="p-3">Cotisation 2024</th>
                        <th className="p-3">Ville</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {cleanParsedData.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-cscm-green-soft/60">
                          <td className="p-3 font-mono text-cscm-green font-bold">{row.memberNo}</td>
                          <td className="p-3 font-semibold text-[#274420]">{row.raisonSociale || row.name}</td>
                          <td className="p-3">
                            <span className="bg-cscm-green-soft text-cscm-green border border-cscm-green/15 px-2 py-0.5 rounded-full uppercase text-[9px] font-bold">
                              {row.secteur}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-emerald-700">
                            {row.cotisation_2024 ? `${Number(row.cotisation_2024).toLocaleString()} FCFA` : '0 FCFA'}
                          </td>
                          <td className="p-3">{row.ville}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {cleanParsedData.length > 5 && (
                    <div className="p-3 text-center text-xs text-gray-400 border-t border-gray-100 bg-gray-50/30 italic">
                      Et {cleanParsedData.length - 5} autres lignes uniques...
                    </div>
                  )}
                  {cleanParsedData.length === 0 && (
                    <div className="p-6 text-center text-rose-600 font-bold bg-rose-50/20 italic">
                      Aucune nouvelle entreprise unique à importer dans ce fichier !
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end pt-1">
                  <button 
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 rounded-2xl text-sm font-semibold bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 text-gray-600 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    Retour
                  </button>
                  <button 
                    onClick={handleImportConfirm}
                    disabled={cleanParsedData.length === 0}
                    className="btn-sheen bg-gradient-to-b from-[#4B9040] to-[#3A7230] hover:from-[#529B46] hover:to-[#417F36] disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-cscm-green/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center gap-2"
                  >
                    Confirmer l'importation ({cleanParsedData.length})
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-sans font-bold text-[#274420] border-b border-gray-100 pb-2">
                    Résultats de l'import
                  </h4>
                </div>

                {/* 3 bento cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Card 1: Importées */}
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl shadow-xs transition-colors duration-300">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Importées</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1.5">{cleanParsedData.length}</p>
                  </div>

                  {/* Card 2: Ignorées */}
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl shadow-xs transition-colors duration-300">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Ignorées</p>
                    <p className="text-3xl font-bold text-amber-500 mt-1.5">{parsedData.length - cleanParsedData.length}</p>
                  </div>

                  {/* Card 3: Doublons */}
                  <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl shadow-xs transition-colors duration-300">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Doublons</p>
                    <p className="text-3xl font-bold text-rose-500 mt-1.5">{parsedData.length - cleanParsedData.length}</p>
                  </div>
                </div>

                {/* success banner notification */}
                <div className="bg-cscm-green-soft border border-cscm-green/15 text-cscm-green py-3.5 px-5 rounded-2xl text-xs font-semibold leading-relaxed shadow-xs flex items-center justify-between">
                  <span>{cleanParsedData.length} entreprise(s) importée(s) avec succès</span>
                </div>

                {/* Warnings Collapsible or dynamic warnings reporting */}
                {validationReport.warnings.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-amber-800 font-extrabold text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-[#d97706]" />
                      <span>Avertissements ({validationReport.warnings.length})</span>
                    </div>

                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 max-h-[180px] overflow-y-auto space-y-1.5 font-mono text-[11px] text-amber-900 leading-relaxed">
                      {validationReport.warnings.map((warn, index) => (
                        <div key={index} className="flex gap-2">
                          <span className="text-amber-500 font-bold shrink-0">•</span>
                          <span>{warn}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer block CTA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-4 border-t border-gray-100/90">
                  <button 
                    onClick={handleClose}
                    className="btn-sheen bg-gradient-to-b from-[#4B9040] to-[#3A7230] hover:from-[#529B46] hover:to-[#417F36] text-white py-3 px-6 text-xs font-bold uppercase tracking-widest rounded-2xl shadow-lg shadow-cscm-green/25 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-center cursor-pointer"
                  >
                    Voir la liste des entreprises
                  </button>
                  <button 
                    onClick={() => {
                      setStep(1);
                      setFile(null);
                      setParsedData([]);
                      setCleanParsedData([]);
                      setValidationReport({ errors: [], warnings: [], duplicatesInFile: [], duplicatesWithStored: [] });
                    }}
                    className="bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 text-gray-600 py-3 px-6 text-xs font-bold uppercase tracking-widest rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 text-center cursor-pointer"
                  >
                    Nouvel import
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
