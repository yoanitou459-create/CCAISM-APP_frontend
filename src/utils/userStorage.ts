import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

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

export const isLocalEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
};

const INITIAL_USERS: AppUser[] = [
  {
    id: 'u1',
    nom: 'Diop',
    prenom: 'Ibrahima',
    email: 'admin@cscm.com',
    role: 'ADMIN',
    password: '12345',
    dateCreation: '2024-01-15'
  },
  {
    id: 'u2',
    nom: 'Sow',
    prenom: 'Mariama',
    email: 'mod@cscm.com',
    role: 'MODERATEUR',
    password: '12345',
    dateCreation: '2024-02-10'
  },
  {
    id: 'u3',
    nom: 'Ndiaye',
    prenom: 'Cheikh',
    email: 'membre@cscm.com',
    role: 'MEMBRE',
    password: '12345',
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

export const saveStoredUsers = (users: AppUser[]) => {
  // If Firebase is active, update Firestore documents in background
  if (localStorage.getItem('cscm_firebase_active') === 'true') {
    const oldData = localStorage.getItem('cscm_users');
    let oldList: AppUser[] = [];
    if (oldData) {
      try {
        oldList = JSON.parse(oldData);
      } catch (e) {}
    }
    const newIds = new Set(users.map(u => String(u.id)));
    const deletedIds = oldList.map(u => String(u.id)).filter(id => !newIds.has(id));

    // Handle deletions
    deletedIds.forEach(async (id) => {
       try {
         await deleteDoc(doc(db, 'users', id));
       } catch (e) {
         handleFirestoreError(e, OperationType.DELETE, `users/${id}`);
       }
    });

    // Handle additions/modifications
    users.forEach(async (u) => {
       try {
         await setDoc(doc(db, 'users', String(u.id)), u);
       } catch (e) {
         handleFirestoreError(e, OperationType.WRITE, `users/${u.id}`);
       }
    });
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
  } catch (e) {
    return 'MEMBRE';
  }
};
