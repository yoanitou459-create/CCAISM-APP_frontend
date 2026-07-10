import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';
import { ensureFirebaseAuth } from '../lib/ensureFirebaseAuth';

export interface AppUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'ADMIN' | 'MODERATEUR' | 'MEMBRE';
  password?: string;
  dateCreation: string;
  status?: 'Actif' | 'Inactif';
}

const INITIAL_USERS: AppUser[] = [
  {
    id: 'u1',
    nom: 'Diop',
    prenom: 'Ibrahima',
    email: 'admin@cscm.com',
    role: 'ADMIN',
    password: 'admin',
    dateCreation: '2024-01-15'
  },
  {
    id: 'u2',
    nom: 'Sow',
    prenom: 'Mariama',
    email: 'mod@cscm.com',
    role: 'MODERATEUR',
    password: 'mod',
    dateCreation: '2024-02-10'
  },
  {
    id: 'u3',
    nom: 'Ndiaye',
    prenom: 'Cheikh',
    email: 'membre@cscm.com',
    role: 'MEMBRE',
    password: 'member',
    dateCreation: '2024-03-01'
  }
];

export const getStoredUsers = (): AppUser[] => {
  const data = localStorage.getItem('cscm_users');
  if (!data) {
    localStorage.setItem('cscm_users', JSON.stringify(INITIAL_USERS));
    return INITIAL_USERS;
  }
  return JSON.parse(data);
};

export const saveStoredUsers = async (users: AppUser[]): Promise<void> => {
  const oldData = localStorage.getItem('cscm_users');
  let oldList: AppUser[] = [];
  if (oldData) {
    try {
      oldList = JSON.parse(oldData);
    } catch {
      oldList = [];
    }
  }

  const newIds = new Set(users.map(u => String(u.id)));
  const deletedIds = oldList.map(u => String(u.id)).filter(id => !newIds.has(id));

  try {
    await ensureFirebaseAuth();

    for (const id of deletedIds) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, `users/${id}`);
      }
    }

    for (const u of users) {
      try {
        await setDoc(doc(db, 'users', String(u.id)), u);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `users/${u.id}`);
      }
    }
  } catch (e) {
    console.warn('Synchronisation Firestore des utilisateurs échouée, sauvegarde locale uniquement:', e);
  }

  localStorage.setItem('cscm_users', JSON.stringify(users));
  window.dispatchEvent(new Event('users_updated'));
};

export const getCurrentUserRole = (): 'ADMIN' | 'MODERATEUR' | 'MEMBRE' => {
  const userString = localStorage.getItem('user');
  if (!userString) return 'MEMBRE';
  try {
    const user = JSON.parse(userString);
    return user.role || 'MEMBRE';
  } catch {
    return 'MEMBRE';
  }
};

export const fetchLatestUsers = async (): Promise<AppUser[]> => {
  try {
    await ensureFirebaseAuth();
    const querySnapshot = await getDocs(collection(db, 'users'));
    const list: AppUser[] = [];
    querySnapshot.forEach(docSnap => {
      list.push(docSnap.data() as AppUser);
    });
    if (list.length > 0) {
      localStorage.setItem('cscm_users', JSON.stringify(list));
      return list;
    }
  } catch (e) {
    console.warn('Could not fetch latest users from Firestore:', e);
  }
  return getStoredUsers();
};
