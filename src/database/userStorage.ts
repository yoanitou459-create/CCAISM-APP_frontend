import { db, handleFirestoreError, OperationType } from './firebase';
import { doc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore';

export interface AppUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: 'ADMIN' | 'MODERATEUR' | 'MEMBRE';
  password?: string;
  dateCreation: string;
  status?: 'Actif' | 'Inactif';
  entreprise?: string;
}

export const INITIAL_USERS: AppUser[] = [];

export const getStoredUsers = (): AppUser[] => {
  const data = localStorage.getItem('cscm_users');
  if (!data) {
    return [];
  }
  return JSON.parse(data);
};

export const saveStoredUsers = async (users: AppUser[]): Promise<void> => {
  // Always update Firestore documents in background to ensure a shared, synchronized backend
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
  const deletionPromises = deletedIds.map(async (id) => {
     try {
       await deleteDoc(doc(db, 'users', id));
     } catch (e) {
       handleFirestoreError(e, OperationType.DELETE, `users/${id}`);
     }
  });

  // Handle additions/modifications
  const savePromises = users.map(async (u) => {
     try {
       await setDoc(doc(db, 'users', String(u.id)), u);
     } catch (e) {
       handleFirestoreError(e, OperationType.WRITE, `users/${u.id}`);
     }
  });

  await Promise.all([...deletionPromises, ...savePromises]);

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

export const fetchLatestUsers = async (): Promise<AppUser[]> => {
  try {
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
    console.warn("Could not fetch latest users from Firestore:", e);
  }
  return getStoredUsers();
};
