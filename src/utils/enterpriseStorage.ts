import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

export interface Enterprise {
  id: number;
  name: string;
  memberNo: string;
  statutMembre: string;
  dateAdhesion: string;
  raisonSociale: string;
  pays: string;
  ville: string;
  secteur: string;
  effectif: string;
  formeJuridique: string;
  numRC: string;
  ninea: string;
  dateCreation: string;
  adresse: string;
  telephone: string;
  email: string;
  siteWeb: string;
  description: string;
  logo: string | null;
  cotisations: Array<{
    date: string;
    label: string;
    amount: number;
    reference?: string;
    method?: string;
  }>;
  [key: string]: any;
}

// Generate pre-seeded cotisations list to sum to 1,010,000 FCFA
// 10 companies pay 50k (5 payments of 10k) = 500,000 FCFA
// 15 companies pay 30k (3 payments of 10k) = 450,000 FCFA
// 6 companies pay 10k (1 payment of 10k) = 60,000 FCFA
// 2 companies pay 0k = 0 FCFA
// Total members = 33, Total Treasury = 1,010,000 FCFA.

const cot_50k = [
  { date: '2024-01-10', label: 'Cotisation Q1 2024', amount: 10000, reference: 'VIR-715781' },
  { date: '2024-04-12', label: 'Cotisation Q2 2024', amount: 10000, reference: 'VIR-812495' },
  { date: '2024-07-15', label: 'Cotisation Q3 2024', amount: 10000, reference: 'CHQ-823901' },
  { date: '2024-10-05', label: 'Cotisation Q4 2024', amount: 10000, reference: 'VIR-901248' },
  { date: '2025-01-15', label: 'Cotisation Q1 2025', amount: 10000, reference: 'VIR-012948' }
];

const cot_30k = [
  { date: '2024-01-15', label: 'Cotisation Q1 2024', amount: 10000, reference: 'VIR-562915' },
  { date: '2024-04-20', label: 'Cotisation Q2 2024', amount: 10000, reference: 'VIR-192518' },
  { date: '2024-07-22', label: 'Cotisation Q3 2024', amount: 10000, reference: 'CHQ-301284' }
];

const cot_10k = [
  { date: '2025-02-10', label: 'Cotisation Q1 2025', amount: 10000, reference: 'VIR-482159' }
];

const INITIAL_ENTERPRISES: Enterprise[] = [
  // 2 Agro
  {
    id: 1,
    name: 'SeneAgro Sahel',
    memberNo: 'M001',
    statutMembre: 'Actif',
    dateAdhesion: '2024-01-11',
    raisonSociale: 'SARL SeneAgro',
    pays: 'Sénégal',
    ville: 'Dakar',
    secteur: 'Agro',
    effectif: '45',
    formeJuridique: 'SARL',
    numRC: 'RC-DKR-2021-B-105',
    ninea: '0028192-3G3',
    dateCreation: '2021-03-12',
    adresse: 'Zone Industrielle de Hann, Dakar',
    telephone: '+221 33 824 10 10',
    email: 'contact@seneagro.sn',
    siteWeb: 'www.seneagro.sn',
    description: 'Transformation de mangues et arachides pour l\'export au Maroc.',
    logo: null,
    cotisations: [...cot_50k]
  },
  {
    id: 2,
    name: 'Fruits de l\'Atlas & Sahel',
    memberNo: 'M002',
    statutMembre: 'Actif',
    dateAdhesion: '2024-01-18',
    raisonSociale: 'SA Fruits Atlas',
    pays: 'Maroc',
    ville: 'Marrakech',
    secteur: 'Agro',
    effectif: '130',
    formeJuridique: 'SA',
    numRC: 'RC-RAK-81204',
    ninea: '91823901-ICE',
    dateCreation: '2019-06-20',
    adresse: 'Quartier Industriel Sidi Ghanem, Marrakech',
    telephone: '+212 524 44 88 00',
    email: 'agro@fruitsatlas.ma',
    siteWeb: 'www.fruitsatlas.ma',
    description: 'Chambre froide et commercialisation de dattes et agrumes marocains vers l\'Afrique de l\'Ouest.',
    logo: null,
    cotisations: [...cot_30k]
  },

  // 2 BTP
  {
    id: 3,
    name: 'Atlas Sénégal BTP',
    memberNo: 'M003',
    statutMembre: 'Actif',
    dateAdhesion: '2024-02-05',
    raisonSociale: 'SA Atlas Sénégal BTP',
    pays: 'Sénégal',
    ville: 'Thiès',
    secteur: 'BTP',
    effectif: '250',
    formeJuridique: 'SA',
    numRC: 'RC-THS-2018-A-54',
    ninea: '4718293-2G2',
    dateCreation: '2018-02-15',
    adresse: 'Avenue Léopold Sédar Senghor, Thiès',
    telephone: '+221 33 951 40 40',
    email: 'contact@atlassene-btp.sn',
    siteWeb: 'www.atlassene-btp.sn',
    description: 'Travaux publics, routes nationales et construction d\'immeubles de bureaux.',
    logo: null,
    cotisations: [...cot_50k]
  },
  {
    id: 4,
    name: 'BatiMaroc-Sénégal',
    memberNo: 'M004',
    statutMembre: 'Actif',
    dateAdhesion: '2024-02-15',
    raisonSociale: 'SARL BatiMaroc-Sénégal',
    pays: 'Maroc',
    ville: 'Casablanca',
    secteur: 'BTP',
    effectif: '85',
    formeJuridique: 'SARL',
    numRC: 'RC-CAS-481920',
    ninea: '28192019201-ICE',
    dateCreation: '2016-10-01',
    adresse: 'Boulevard Ghandi, Casablanca',
    telephone: '+212 522 36 78 90',
    email: 'info@batimaroc.ma',
    siteWeb: 'www.batimaroc.ma',
    description: 'Ingénierie du bâtiment, études de sols et structures de génie civil.',
    logo: null,
    cotisations: [...cot_30k]
  },

  // 2 IT
  {
    id: 5,
    name: 'Tech-Innov Partners',
    memberNo: 'M005',
    statutMembre: 'Actif',
    dateAdhesion: '2024-03-01',
    raisonSociale: 'SARL AU Tech-Innov',
    pays: 'Maroc',
    ville: 'Rabat',
    secteur: 'IT',
    effectif: '25',
    formeJuridique: 'SARL',
    numRC: 'RC-RAB-19251',
    ninea: '012948192-ICE',
    dateCreation: '2021-11-01',
    adresse: 'Technopolis Rabat-Salé, Rabat',
    telephone: '+212 537 99 22 11',
    email: 'contact@techinnov.sn',
    siteWeb: 'www.techinnov.ma',
    description: 'Conseil en transformation digitale et solutions cloud pour entreprises subsahariennes.',
    logo: null,
    cotisations: [...cot_50k]
  },
  {
    id: 6,
    name: 'Sahel solutions & Cloud',
    memberNo: 'M006',
    statutMembre: 'Actif',
    dateAdhesion: '2024-03-05',
    raisonSociale: 'SARL Sahel Cloud',
    pays: 'Sénégal',
    ville: 'Dakar',
    secteur: 'IT',
    effectif: '12',
    formeJuridique: 'SARL',
    numRC: 'RC-DKR-2022-A-89',
    ninea: '1029481-2B1',
    dateCreation: '2022-04-18',
    adresse: 'Rond-point Point E, Dakar',
    telephone: '+221 77 621 90 90',
    email: 'info@sahelcloud.sn',
    siteWeb: 'www.sahelcloud.sn',
    description: 'Développement d\'applications SaaS pour la logistique portuaire.',
    logo: null,
    cotisations: [...cot_30k]
  },

  // 3 Transport et logistique
  {
    id: 7,
    name: 'Dakar-Express Fret',
    memberNo: 'M007',
    statutMembre: 'Actif',
    dateAdhesion: '2024-03-12',
    raisonSociale: 'SARL Dakar-Express',
    pays: 'Sénégal',
    ville: 'Dakar',
    secteur: 'Transport et logistique',
    effectif: '60',
    formeJuridique: 'SARL',
    numRC: 'RC-DKR-2015-B-914',
    ninea: '4821594-3C1',
    dateCreation: '2015-05-12',
    adresse: 'Port Autonome de Dakar, Môle 3',
    telephone: '+221 33 849 55 55',
    email: 'transit@dakarexpress.sn',
    siteWeb: 'www.dakarexpress.sn',
    description: 'Commissionnaire agréé en douane, fret maritime international.',
    logo: null,
    cotisations: [...cot_50k]
  },
  {
    id: 8,
    name: 'Royal Logistics subsaharienne',
    memberNo: 'M008',
    statutMembre: 'Actif',
    dateAdhesion: '2024-03-18',
    raisonSociale: 'SA Royal Logistics',
    pays: 'Maroc',
    ville: 'Tanger',
    secteur: 'Transport et logistique',
    effectif: '180',
    formeJuridique: 'SA',
    numRC: 'RC-TNG-929141',
    ninea: '104829104-ICE',
    dateCreation: '2010-02-10',
    adresse: 'Tanger Med Zone Logistique, Tanger',
    telephone: '+212 539 98 12 34',
    email: 'hub@royallogistics.com',
    siteWeb: 'www.royallogistics.com',
    description: 'Transport routier international (TIR) reliant le Maroc au Sénégal par Nouakchott.',
    logo: null,
    cotisations: [...cot_30k]
  },
  {
    id: 9,
    name: 'Sénégal-Maroc Transit SAS',
    memberNo: 'M009',
    statutMembre: 'Actif',
    dateAdhesion: '2024-04-02',
    raisonSociale: 'SAS SM Transit',
    pays: 'Sénégal',
    ville: 'Saint-Louis',
    secteur: 'Transport et logistique',
    effectif: '18',
    formeJuridique: 'SAS',
    numRC: 'RC-STL-2023-B-083',
    ninea: '0124819-2D3',
    dateCreation: '2023-01-10',
    adresse: 'Quai Roume, Saint-Louis',
    telephone: '+221 78 120 40 40',
    email: 'saintlouis@smtransit.com',
    siteWeb: 'www.smtransit.com',
    description: 'Transit transfrontalier et logistique fluviale.',
    logo: null,
    cotisations: [...cot_50k]
  },

  // 4 Tourisme
  {
    id: 10,
    name: 'Atlas-Sénégal Voyages',
    memberNo: 'M010',
    statutMembre: 'Actif',
    dateAdhesion: '2024-04-10',
    raisonSociale: 'SARL Atlas Voyages Sénégal',
    pays: 'Sénégal',
    ville: 'Dakar',
    secteur: 'Tourisme',
    effectif: '14',
    formeJuridique: 'SARL',
    numRC: 'RC-DKR-2020-B-2900',
    ninea: '9120489-1A2',
    dateCreation: '2020-08-15',
    adresse: 'Avenue de la République, Dakar',
    telephone: '+221 33 860 11 22',
    email: 'resa@atlasvoyagessene.sn',
    siteWeb: 'www.atlasvoyagessene.sn',
    description: 'Agence de voyages organisant des séjours de tourisme d\'affaires pour cadres sénégalais au Maroc.',
    logo: null,
    cotisations: [...cot_30k]
  },
  {
    id: 11,
    name: 'Teranga Tours Marrakech',
    memberNo: 'M011',
    statutMembre: 'Actif',
    dateAdhesion: '2024-04-12',
    raisonSociale: 'SARL Teranga Marrakech',
    pays: 'Maroc',
    ville: 'Marrakech',
    secteur: 'Tourisme',
    effectif: '8',
    formeJuridique: 'SARL',
    numRC: 'RC-RAK-712850',
    ninea: '0281920-ICE',
    dateCreation: '2022-02-12',
    adresse: 'Gueliz, Rue de la Liberté, Marrakech',
    telephone: '+212 661 22 33 44',
    email: 'bonjour@terangatours.ma',
    siteWeb: 'www.terangatours.ma',
    description: 'Maisons d\'hôtes orientées Teranga-hospitalité pour événements subsahariens.',
    logo: null,
    cotisations: [...cot_50k]
  },
  {
    id: 12,
    name: 'Horizon Hotel Saly',
    memberNo: 'M012',
    statutMembre: 'Actif',
    dateAdhesion: '2024-04-15',
    raisonSociale: 'SA Horizon Saly',
    pays: 'Sénégal',
    ville: 'Mbour',
    secteur: 'Tourisme',
    effectif: '90',
    formeJuridique: 'SA',
    numRC: 'RC-MBR-2016-B-201',
    ninea: '19204892-2T1',
    dateCreation: '2016-04-14',
    adresse: 'Station Balnéaire de Saly Portudal, Mbour',
    telephone: '+221 33 957 20 20',
    email: 'frontdesk@horizonsaly.com',
    siteWeb: 'www.horizonsaly.com',
    description: 'Hôtel balnéaire haut de gamme de 120 clés avec centre de conférence international.',
    logo: null,
    cotisations: [...cot_30k]
  },
  {
    id: 13,
    name: 'Casa-Dakar Evénements',
    memberNo: 'M013',
    statutMembre: 'Actif',
    dateAdhesion: '2024-05-02',
    raisonSociale: 'SARL Casa-Dakar Event',
    pays: 'Maroc',
    ville: 'Casablanca',
    secteur: 'Tourisme',
    effectif: '10',
    formeJuridique: 'SARL',
    numRC: 'RC-CAS-391204',
    ninea: '28192048-ICE',
    dateCreation: '2018-12-01',
    adresse: 'Maarif, Rue Jaber Ibn Hayane, Casablanca',
    telephone: '+212 522 90 40 10',
    email: 'event@casadakar.ma',
    siteWeb: 'www.casadakar.ma',
    description: 'Organisation de salons professionnels et pitch d\'affaires Maroc-Sénégal.',
    logo: null,
    cotisations: [...cot_50k]
  },

  // 2 Education
  {
    id: 14,
    name: 'Institut Polytech Maroc-Sénégal',
    memberNo: 'M014',
    statutMembre: 'Actif',
    dateAdhesion: '2024-05-08',
    raisonSociale: 'SARL Polytech MS',
    pays: 'Sénégal',
    ville: 'Dakar',
    secteur: 'Education',
    effectif: '35',
    formeJuridique: 'SARL',
    numRC: 'RC-DKR-2019-B-851',
    ninea: '2019481-4C1',
    dateCreation: '2019-11-20',
    adresse: 'Liberté 6 Extension, Dakar',
    telephone: '+221 33 867 80 80',
    email: 'direction@polytechms.sn',
    siteWeb: 'www.polytechms.sn',
    description: 'Établissement d\'enseignement supérieur et de MBA préparant aux métiers technologiques d\'Afrique.',
    logo: null,
    cotisations: [...cot_30k]
  },
  {
    id: 15,
    name: 'École Internationale du Futur',
    memberNo: 'M015',
    statutMembre: 'Actif',
    dateAdhesion: '2024-05-15',
    raisonSociale: 'SARL Ecole Futur',
    pays: 'Maroc',
    ville: 'Fès',
    secteur: 'Education',
    effectif: '20',
    formeJuridique: 'SARL',
    numRC: 'RC-FES-482109',
    ninea: '9102495-ICE',
    dateCreation: '2021-01-15',
    adresse: 'Boulevard de la Mecque, Fès',
    telephone: '+212 535 60 70 80',
    email: 'info@ecolefutur.ma',
    siteWeb: 'www.ecolefutur.ma',
    description: 'Académie de formation continue pour professionnels marocains et sénégalais.',
    logo: null,
    cotisations: [...cot_30k]
  },

  // 2 Commerce
  {
    id: 16,
    name: 'Global Trade Sénégal SA',
    memberNo: 'M016',
    statutMembre: 'Actif',
    dateAdhesion: '2024-05-20',
    raisonSociale: 'SA Global Trade',
    pays: 'Sénégal',
    ville: 'Dakar',
    secteur: 'Commerce',
    effectif: '32',
    formeJuridique: 'SA',
    numRC: 'RC-DKR-2018-B-3104',
    ninea: '4819245-1G1',
    dateCreation: '2018-04-01',
    adresse: 'Avenue Peytavin, Dakar',
    telephone: '+221 33 821 33 33',
    email: 'import@globaltrade.sn',
    siteWeb: 'www.globaltrade.sn',
    description: 'Importation de denrées maraîchères, riz brisé et produits manufacturés.',
    logo: null,
    cotisations: [...cot_50k]
  },
  {
    id: 17,
    name: 'Marché d\'Afrique & Épices',
    memberNo: 'M017',
    statutMembre: 'Actif',
    dateAdhesion: '2024-05-25',
    raisonSociale: 'SARL Marché d\'Afrique',
    pays: 'Maroc',
    ville: 'Agadir',
    secteur: 'Commerce',
    effectif: '5',
    formeJuridique: 'SARL',
    numRC: 'RC-AGD-491204',
    ninea: '91204859-ICE',
    dateCreation: '2020-03-10',
    adresse: 'Souk El Had, Agadir',
    telephone: '+212 662 45 45 45',
    email: 'epices@marcheafrique.ma',
    siteWeb: 'www.marcheafrique.ma',
    description: 'Boutiques de gros d\'épices traditionnelles subsahariennes et d\'huile d\'argan.',
    logo: null,
    cotisations: [...cot_30k]
  },

  // 2 Industrie
  {
    id: 18,
    name: 'SenePlast Industrie',
    memberNo: 'M018',
    statutMembre: 'Actif',
    dateAdhesion: '2024-06-01',
    raisonSociale: 'SA SenePlast',
    pays: 'Sénégal',
    ville: 'Rufisque',
    secteur: 'Industrie',
    effectif: '160',
    formeJuridique: 'SA',
    numRC: 'RC-RUF-2014-B-1080',
    ninea: '10294821-2C3',
    dateCreation: '2014-02-18',
    adresse: 'Km 24, Route de Rufisque, Rufisque',
    telephone: '+221 33 836 44 44',
    email: 'seneplast@seneplast.sn',
    siteWeb: 'www.seneplast.sn',
    description: 'Fabrication de tubes PVC pour assainissement et d\'emballages plastiques industriels.',
    logo: null,
    cotisations: [...cot_30k]
  },
  {
    id: 19,
    name: 'Maroc-Sénégal Métaux SA',
    memberNo: 'M019',
    statutMembre: 'Actif',
    dateAdhesion: '2024-06-05',
    raisonSociale: 'SA MS Métaux',
    pays: 'Maroc',
    ville: 'El Jadida',
    secteur: 'Industrie',
    effectif: '210',
    formeJuridique: 'SA',
    numRC: 'RC-LDD-81294',
    ninea: '48192040-ICE',
    dateCreation: '2012-07-02',
    adresse: 'Zone Industrielle de Jorf Lasfar, El Jadida',
    telephone: '+212 523 34 56 78',
    email: 'contact@msmetaux.ma',
    siteWeb: 'www.msmetaux.ma',
    description: 'Fonderie de cuivre et d\'acier de construction pour projets d\'infrastructures ferroviaires.',
    logo: null,
    cotisations: [...cot_50k]
  },

  // 2 Sante
  {
    id: 20,
    name: 'PharmaSahel Hub',
    memberNo: 'M020',
    statutMembre: 'Actif',
    dateAdhesion: '2024-06-10',
    raisonSociale: 'SARL PharmaSahel',
    pays: 'Sénégal',
    ville: 'Dakar',
    secteur: 'Sante',
    effectif: '28',
    formeJuridique: 'SARL',
    numRC: 'RC-DKR-2021-B-3108',
    ninea: '91823901-2S2',
    dateCreation: '2021-08-11',
    adresse: 'Rue Huart, Dakar Plateau',
    telephone: '+221 33 889 00 22',
    email: 'contact@pharmasahel.sn',
    siteWeb: 'www.pharmasahel.sn',
    description: 'Distribution de dispositifs médicaux et parapharmacie importée du Maroc.',
    logo: null,
    cotisations: [...cot_30k]
  },
  {
    id: 21,
    name: 'BioClinique Maroc',
    memberNo: 'M021',
    statutMembre: 'Actif',
    dateAdhesion: '2024-06-12',
    raisonSociale: 'SARL BioClinique',
    pays: 'Maroc',
    ville: 'Fès',
    secteur: 'Sante',
    effectif: '45',
    formeJuridique: 'SARL',
    numRC: 'RC-FES-182904',
    ninea: '104829391-ICE',
    dateCreation: '2017-09-12',
    adresse: 'Route d\'Imouzzer, Fès',
    telephone: '+212 535 80 90 00',
    email: 'clinique@bioclinique.ma',
    siteWeb: 'www.bioclinique.ma',
    description: 'Laboratoire de biologie médicale et services d\'évacuation sanitaire internationale.',
    logo: null,
    cotisations: [...cot_50k]
  },

  // 12 Autres (consulting, law firms, services)
  {
    id: 22,
    name: 'Cabinet Moustapha Sall',
    memberNo: 'M022',
    statutMembre: 'Actif',
    dateAdhesion: '2024-06-15',
    raisonSociale: 'SARL AU Cab Sall',
    pays: 'Sénégal',
    ville: 'Dakar',
    secteur: 'Autres',
    effectif: '6',
    formeJuridique: 'SARL',
    numRC: 'RC-DKR-2016-A-62',
    ninea: '9120489-1R1',
    dateCreation: '2016-09-01',
    adresse: 'Immeuble SDI, Dakar Plateau',
    telephone: '+221 33 821 70 70',
    email: 'audit@cabinetsall.sn',
    siteWeb: 'www.cabinetsall.sn',
    description: 'Audit et expertise comptable certifiée pour firmes ouest-africaines.',
    logo: null,
    cotisations: [...cot_30k]
  },
  {
    id: 23,
    name: 'TriKeys Ltd',
    memberNo: 'M023',
    statutMembre: 'Actif',
    dateAdhesion: '2024-01-20',
    raisonSociale: 'Limited TriKeys',
    pays: 'Sénégal',
    ville: 'Dakar',
    secteur: 'Autres',
    effectif: '10',
    formeJuridique: 'SARL',
    numRC: 'RC-DKR-2023-B-2914',
    ninea: '29104821-2F1',
    dateCreation: '2023-01-05',
    adresse: 'Sacré-Cœur 3, Dakar',
    telephone: '+221 77 400 11 22',
    email: 'hello@trikeys.com',
    siteWeb: 'www.trikeys.sn',
    description: 'Marketing, relations publiques et relations bilatérales Maroc-Sénégal.',
    logo: null,
    cotisations: [...cot_50k]
  },
  {
    id: 24,
    name: 'Sénégal Consommation',
    memberNo: 'M024',
    statutMembre: 'Actif',
    dateAdhesion: '2024-06-18',
    raisonSociale: 'SARL SeneConso',
    pays: 'Sénégal',
    ville: 'Ziguinchor',
    secteur: 'Autres',
    effectif: '4',
    formeJuridique: 'SARL',
    numRC: 'RC-ZIG-2021-B-05',
    ninea: '2819213-3G1',
    dateCreation: '2021-02-10',
    adresse: 'Quartier Escale, Ziguinchor',
    telephone: '+221 33 991 30 30',
    email: 'contact@seneconso.sn',
    siteWeb: 'www.seneconso.sn',
    description: 'Études d\'opinion, panels de consommateurs région Casamance.',
    logo: null,
    cotisations: [...cot_30k]
  },
  {
    id: 25,
    name: 'Maroc Conseils Juridiques',
    memberNo: 'M025',
    statutMembre: 'Actif',
    dateAdhesion: '2024-06-20',
    raisonSociale: 'SARL Maroc Conseils',
    pays: 'Maroc',
    ville: 'Casablanca',
    secteur: 'Autres',
    effectif: '12',
    formeJuridique: 'SARL',
    numRC: 'RC-CAS-19284',
    ninea: '81294191-ICE',
    dateCreation: '2015-01-15',
    adresse: 'Anfa, Boulevard d\'Anfa, Casablanca',
    telephone: '+212 522 20 30 40',
    email: 'consulting@marocconseils.co.ma',
    siteWeb: 'www.marocconseils.ma',
    description: 'Assistance juridique dans l\'immatriculation d\'entreprises sénégalaises au Maroc.',
    logo: null,
    cotisations: [...cot_30k]
  },
  {
    id: 26,
    name: 'Elégance Nettoyage Pro',
    memberNo: 'M026',
    statutMembre: 'Actif',
    dateAdhesion: '2024-06-22',
    raisonSociale: 'SARL Elegance',
    pays: 'Maroc',
    ville: 'Kénitra',
    secteur: 'Autres',
    effectif: '35',
    formeJuridique: 'SARL',
    numRC: 'RC-KNT-48192',
    ninea: '39105829-ICE',
    dateCreation: '2020-05-15',
    adresse: 'Zone Franche de Kénitra, Kénitra',
    telephone: '+212 537 32 32 32',
    email: 'clean@elegancepro.ma',
    siteWeb: 'www.elegancepro.ma',
    description: 'Services d\'hygiène, de dératisation et de nettoyage industriel dans l\'automobile.',
    logo: null,
    cotisations: [...cot_30k]
  },
  {
    id: 27,
    name: 'Sécurité Sahel Gardiennage',
    memberNo: 'M027',
    statutMembre: 'Actif',
    dateAdhesion: '2024-06-25',
    raisonSociale: 'SARL Sécurité Sahel',
    pays: 'Sénégal',
    ville: 'Kaolack',
    secteur: 'Autres',
    effectif: '85',
    formeJuridique: 'SARL',
    numRC: 'RC-KLK-2017-B-49',
    ninea: '481920-1T2',
    dateCreation: '2017-06-01',
    adresse: 'Quartier Ndangane, Kaolack',
    telephone: '+221 33 941 22 22',
    email: 'alert@securitesahel.sn',
    siteWeb: 'www.securitesahel.sn',
    description: 'Télésurveillance et gardiennage de locaux commerciaux et entrepôts de transit.',
    logo: null,
    cotisations: [...cot_30k]
  },
  {
    id: 28,
    name: 'Agence Phoenix Event',
    memberNo: 'M028',
    statutMembre: 'Actif',
    dateAdhesion: '2024-06-27',
    raisonSociale: 'SARL Phoenix',
    pays: 'Maroc',
    ville: 'Marrakech',
    secteur: 'Autres',
    effectif: '7',
    formeJuridique: 'SARL',
    numRC: 'RC-RAK-40192',
    ninea: '302492-ICE',
    dateCreation: '2020-07-20',
    adresse: 'Hivernage, Marrakech',
    telephone: '+212 662 55 66 77',
    email: 'event@phoenix.ma',
    siteWeb: 'www.phoenix.ma',
    description: 'Régie publicitaire et organisation d\'exposition évènementielles.',
    logo: null,
    cotisations: [...cot_10k] // 10k
  },
  {
    id: 29,
    name: 'Maroc-Sénégal Assurance Broker',
    memberNo: 'M029',
    statutMembre: 'Actif',
    dateAdhesion: '2024-06-28',
    raisonSociale: 'SARL MS Assurance',
    pays: 'Maroc',
    ville: 'Casablanca',
    secteur: 'Autres',
    effectif: '9',
    formeJuridique: 'SARL',
    numRC: 'RC-CAS-410294',
    ninea: '1048293-ICE',
    dateCreation: '2019-01-10',
    adresse: 'Boulevard d\'Anfa, Casablanca',
    telephone: '+212 522 45 40 40',
    email: 'broker@msassurance.ma',
    siteWeb: 'www.msassurance.sn',
    description: 'Cabinet de courtage en assurances spécialisé transports routiers et fret maritime.',
    logo: null,
    cotisations: [...cot_10k] // 10k
  },
  {
    id: 30,
    name: 'Cabinet d\'Avocats Diop & Associés',
    memberNo: 'M030',
    statutMembre: 'Actif',
    dateAdhesion: '2024-06-29',
    raisonSociale: 'Cabinet d\'Avocats SCPA',
    pays: 'Sénégal',
    ville: 'Dakar',
    secteur: 'Autres',
    effectif: '14',
    formeJuridique: 'SARL',
    numRC: 'RC-DKR-2015-C-54',
    ninea: '2491204-1C1',
    dateCreation: '2015-03-01',
    adresse: 'Avenue Pasteur, Dakar',
    telephone: '+221 33 822 50 50',
    email: 'cocontact@diopavocats.sn',
    siteWeb: 'www.diopavocats.sn',
    description: 'Droit OHADA des affaires et de la propriété intellectuelle.',
    logo: null,
    cotisations: [...cot_10k] // 10k
  },
  {
    id: 31,
    name: 'Coopérative Artisanale de Ndar',
    memberNo: 'M031',
    statutMembre: 'Actif',
    dateAdhesion: '2024-06-30',
    raisonSociale: 'Coop Ndar',
    pays: 'Sénégal',
    ville: 'Saint-Louis',
    secteur: 'Autres',
    effectif: '45',
    formeJuridique: 'SARL',
    numRC: 'RC-STL-2018-C-104',
    ninea: '192451-2G1',
    dateCreation: '2018-05-18',
    adresse: 'Quartier Guet Ndar, Saint-Louis',
    telephone: '+221 78 190 20 20',
    email: 'ndar@coopndar.sn',
    siteWeb: 'www.coopndar.sn',
    description: 'Tissage, maroquinerie d\'art, export d\'objets vers le Maroc.',
    logo: null,
    cotisations: [...cot_10k] // 10k
  },
  
  // Late / Retard Payments (No cotisations recorded)
  {
    id: 32,
    name: 'Sénégal Express Livraison & Sarl',
    memberNo: 'M032',
    statutMembre: 'Actif',
    dateAdhesion: '2024-07-02',
    raisonSociale: 'SARL SeneExpress',
    pays: 'Sénégal',
    ville: 'Dakar',
    secteur: 'Autres',
    effectif: '10',
    formeJuridique: 'SARL',
    numRC: 'RC-DKR-2024-B-4192',
    ninea: '39105-2D2',
    dateCreation: '2024-01-02',
    adresse: 'Ouakam, Cité Avion, Dakar',
    telephone: '+221 70 820 11 11',
    email: 'livraison@seneexpress.sn',
    siteWeb: 'www.seneexpress.sn',
    description: 'Service de livraison urbaine rapide en deux-roues et camionnettes.',
    logo: null,
    cotisations: [] // 0k (Retard de paiement)
  },
  {
    id: 33,
    name: 'Maroc Design & Signalétique',
    memberNo: 'M033',
    statutMembre: 'Actif',
    dateAdhesion: '2024-07-04',
    raisonSociale: 'SARL Maroc Design',
    pays: 'Maroc',
    ville: 'Fès',
    secteur: 'Autres',
    effectif: '18',
    formeJuridique: 'SARL',
    numRC: 'RC-FES-294102',
    ninea: '401948192-ICE',
    dateCreation: '2013-05-10',
    adresse: 'Zone Industrielle Bensouda, Fès',
    telephone: '+212 535 72 72 11',
    email: 'signs@marocdesign.ma',
    siteWeb: 'www.marocdesign.ma',
    description: 'Signalétique routière, enseignes lumineuses et marquage de flottes.',
    logo: null,
    cotisations: [] // 0k (Retard de paiement)
  }
];

export const deduplicateEnterprises = (list: Enterprise[]): Enterprise[] => {
  const seenNames = new Set<string>();
  const seenMemberNos = new Set<string>();
  const result: Enterprise[] = [];

  for (const ent of list) {
    const nameKey = (ent.name || '').trim().toLowerCase();
    const memberKey = (ent.memberNo || '').trim().toLowerCase();

    if (nameKey && seenNames.has(nameKey)) {
      continue;
    }
    if (memberKey && seenMemberNos.has(memberKey)) {
      continue;
    }

    // Normalize sector 'transport' and 'transport et logistique' to the exact same value
    const currentSect = (ent.secteur || '').trim();
    if (/^transport$/i.test(currentSect) || /transport.*et.*logistique/i.test(currentSect) || /^transport/i.test(currentSect)) {
      ent.secteur = 'Transport et logistique';
    }

    if (nameKey) seenNames.add(nameKey);
    if (memberKey) seenMemberNos.add(memberKey);
    result.push(ent);
  }
  return result;
};

export const getStoredEnterprises = (): Enterprise[] => {
  const data = localStorage.getItem('cscm_enterprises');
  let loaded: Enterprise[];
  if (!data) {
    loaded = INITIAL_ENTERPRISES;
  } else {
    try {
      loaded = JSON.parse(data);
    } catch (e) {
      loaded = INITIAL_ENTERPRISES;
    }
  }
  
  const clean = deduplicateEnterprises(loaded);
  if (clean.length !== loaded.length) {
    localStorage.setItem('cscm_enterprises', JSON.stringify(clean));
  }
  return clean;
};

export const saveStoredEnterprises = (enterprises: Enterprise[]) => {
  const clean = deduplicateEnterprises(enterprises);

  // Always update Firestore documents in background to ensure a shared, synchronized backend
  const oldData = localStorage.getItem('cscm_enterprises');
  let oldList: Enterprise[] = [];
  if (oldData) {
    try {
      oldList = JSON.parse(oldData);
    } catch (e) {}
  }
  const newIds = new Set(clean.map(e => String(e.id)));
  const deletedIds = oldList.map(e => String(e.id)).filter(id => !newIds.has(id));

  // Handle deletions
  deletedIds.forEach(async (id) => {
    try {
      await deleteDoc(doc(db, 'enterprises', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `enterprises/${id}`);
    }
  });

  // Handle additions and modifications
  clean.forEach(async (ent) => {
    try {
      await setDoc(doc(db, 'enterprises', String(ent.id)), ent);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `enterprises/${ent.id}`);
    }
  });

  localStorage.setItem('cscm_enterprises', JSON.stringify(clean));
  // Dispatches simple custom event to notify all components about changes
  window.dispatchEvent(new Event('enterprises_updated'));
};

export const fetchLatestEnterprises = async (): Promise<Enterprise[]> => {
  try {
    const { getDocs, collection } = await import('firebase/firestore');
    const querySnapshot = await getDocs(collection(db, 'enterprises'));
    const list: Enterprise[] = [];
    querySnapshot.forEach(docSnap => {
      list.push(docSnap.data() as Enterprise);
    });
    if (list.length > 0) {
      list.sort((a, b) => (a.id || 0) - (b.id || 0));
      localStorage.setItem('cscm_enterprises', JSON.stringify(list));
      return list;
    }
  } catch (e) {
    console.warn("Could not fetch latest enterprises from Firestore:", e);
  }
  return getStoredEnterprises();
};
