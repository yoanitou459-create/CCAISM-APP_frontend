import { Enterprise } from '../database/enterpriseStorage';

const getFiscal = (ent: any): string => {
  if (!ent) return '';
  const candidates = [
    ent.ninea,
    ent.ice,
    ent.ice_ninea,
    ent.identifiantFiscal,
    ent.numero_ice,
    ent.numero_ninea,
    ent.code_ice,
    ent.code_ninea
  ];
  for (const c of candidates) {
    if (c && typeof c === 'string' && c.trim() && c.trim().toUpperCase() !== 'N/A' && c.trim() !== '—' && c.trim() !== '-') {
      return c.trim();
    }
  }
  return '';
};

const getResponsable = (ent: any) => {
  let prenom = ent.prenomContact || ent.prenom_adherent || ent.prenom_responsable || ent.prenom_dirigeant || ent.prenomRep || '';
  let nom = ent.nomContact || ent.nom_adherent || ent.nom_responsable || ent.nom_dirigeant || ent.nomRep || ent.dirigeant || ent.responsable || '';
  let fullName = '';
  
  if (prenom && nom) {
    fullName = `${prenom} ${nom}`.trim();
  } else if (nom) {
    fullName = nom.trim();
  } else if (prenom) {
    fullName = prenom.trim();
  }

  let fonction = ent.fonction || ent.fonction_adherent || ent.fonction_responsable || ent.fonctionResponsable || ent.poste || '';
  let phone = ent.mobileContact || ent.telephoneSecondaire || '';
  let email = ent.emailContact || '';

  if ((!fullName || fullName === 'Non spécifié') && ent.contacts && Array.isArray(ent.contacts) && ent.contacts.length > 0) {
    const primary = ent.contacts.find((c: any) => c.isPrimary === 'Oui') || ent.contacts[0];
    if (primary) {
      if (!fullName) fullName = primary.name || '';
      if (!nom) nom = primary.name || '';
      if (!fonction) fonction = primary.function || '';
      if (!phone) phone = primary.phone || '';
      if (!email) email = primary.email || '';
    }
  }

  return { nom, prenom, fullName, fonction, phone, email };
};

export const exportEnterprisesToCSV = (enterprises: Enterprise[]) => {
  if (enterprises.length === 0) return;

  // CSV headers (french headers matching standard business terminology)
  const headers = [
    'Numéro Membre',
    'Raison Sociale',
    'Nom Commercial',
    'Responsable / Dirigeant',
    'Nom Responsable',
    'Prénom Responsable',
    'Fonction Responsable',
    'ICE / NINEA',
    'Forme Juridique',
    'Statut Membre',
    'Secteur d\'activité',
    'Employés',
    'Pays',
    'Ville',
    'Adresse',
    'Téléphone Principal',
    'Téléphone Responsable / Mobile',
    'Email Principal',
    'Email Responsable',
    'Site Web',
    'RC',
    'Date de Création',
    'Date d\'Adhésion'
  ];

  // Map each enterprise to row array, escaping quotes appropriately
  const rows = enterprises.map(ent => {
    const resp = getResponsable(ent);
    const fiscalId = getFiscal(ent);

    return [
      ent.memberNo || '',
      ent.raisonSociale || ent.name || '',
      ent.nomCommercial || ent.name || '',
      resp.fullName || '',
      resp.nom || '',
      resp.prenom || '',
      resp.fonction || '',
      fiscalId || '',
      ent.formeJuridique || '',
      ent.statutMembre || '',
      ent.secteur || '',
      ent.effectif || '',
      ent.pays || '',
      ent.ville || '',
      ent.adresse || '',
      ent.telephone || '',
      resp.phone || ent.telephoneSecondaire || '',
      ent.email || '',
      resp.email || '',
      ent.siteWeb || '',
      ent.numRC || '',
      ent.dateCreation || '',
      ent.dateAdhesion || ''
    ].map(field => {
      const escaped = String(field).replace(/"/g, '""');
      return `"${escaped}"`;
    });
  });

  // Join headers and rows with standard semicolon separator for Excel French settings
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n');

  // Convert to Blob with UTF-8 BOM to prevent excel encoding issues
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Set up download element
  const link = document.createElement("a");
  const dateFormatted = new Date().toISOString().split('T')[0];
  link.setAttribute("href", url);
  link.setAttribute("download", `annuaire_membres_cscm_${dateFormatted}.csv`);
  document.body.appendChild(link);
  
  // Trigger click
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
