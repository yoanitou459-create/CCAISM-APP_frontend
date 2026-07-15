import { Enterprise } from '../database/enterpriseStorage';

export const exportEnterprisesToCSV = (enterprises: Enterprise[]) => {
  if (enterprises.length === 0) return;

  // CSV headers (french headers matching standard business terminology)
  const headers = [
    'Numéro Membre',
    'Nom',
    'Raison Sociale',
    'Forme Juridique',
    'Statut',
    'Secteur d\'activité',
    'Employés',
    'Pays',
    'Ville',
    'Adresse',
    'Téléphone',
    'Email',
    'Site Web',
    'RC',
    'NINEA',
    'Date de Création',
    'Date d\'Adhésion'
  ];

  // Map each enterprise to row array, escaping quotes appropriately
  const rows = enterprises.map(ent => [
    ent.memberNo || '',
    ent.name || '',
    ent.raisonSociale || '',
    ent.formeJuridique || '',
    ent.statutMembre || '',
    ent.secteur || '',
    ent.effectif || '',
    ent.pays || '',
    ent.ville || '',
    ent.adresse || '',
    ent.telephone || '',
    ent.email || '',
    ent.siteWeb || '',
    ent.numRC || '',
    ent.ninea || '',
    ent.dateCreation || '',
    ent.dateAdhesion || ''
  ].map(field => {
    const escaped = String(field).replace(/"/g, '""');
    return `"${escaped}"`;
  }));

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
