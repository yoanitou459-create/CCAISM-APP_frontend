import { db, handleFirestoreError, OperationType } from './firebase';
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

export const INITIAL_ENTERPRISES: Enterprise[] = [];

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
    loaded = [];
  } else {
    try {
      loaded = JSON.parse(data);
    } catch (e) {
      loaded = [];
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
