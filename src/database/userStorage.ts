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
  photo?: string;
}

export const DEFAULT_ADMIN_USERS: AppUser[] = [
  {
    id: 'u_admin_phoenix',
    nom: 'Digitalix',
    prenom: 'Phoenix',
    email: 'info@phoenix19digitalix.com',
    role: 'ADMIN',
    password: 'password',
    status: 'Actif',
    entreprise: 'Phoenix Digitalix',
    dateCreation: '2025-01-01'
  },
  {
    id: 'u_admin_yoani',
    nom: 'Tou',
    prenom: 'Yoani',
    email: 'yoanitou459@gmail.com',
    role: 'ADMIN',
    password: 'password',
    status: 'Actif',
    entreprise: 'CSCM Admin',
    dateCreation: '2025-01-01'
  }
];

export const INITIAL_USERS: AppUser[] = [...DEFAULT_ADMIN_USERS];

export const getStoredUsers = (): AppUser[] => {
  const data = localStorage.getItem('cscm_users');
  let list: AppUser[] = [];
  if (data) {
    try {
      list = JSON.parse(data);
    } catch (e) {
      list = [];
    }
  }

  // Ensure default admin users always exist and have ADMIN role and Actif status
  let modified = false;
  for (const admin of DEFAULT_ADMIN_USERS) {
    const existing = list.find(u => u.email.toLowerCase() === admin.email.toLowerCase());
    if (!existing) {
      list.push(admin);
      modified = true;
    } else if (existing.role !== 'ADMIN' || existing.status !== 'Actif') {
      existing.role = 'ADMIN';
      existing.status = 'Actif';
      modified = true;
    }
  }

  if (modified || !data) {
    localStorage.setItem('cscm_users', JSON.stringify(list));
  }
  return list;
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

    // Ensure default administrators exist in Firestore database
    for (const admin of DEFAULT_ADMIN_USERS) {
      const existing = list.find(u => u.email.toLowerCase() === admin.email.toLowerCase());
      if (!existing) {
        try {
          await setDoc(doc(db, 'users', admin.id), admin);
          list.push(admin);
        } catch (err) {
          console.warn("Could not save admin user to Firestore:", admin.email, err);
          list.push(admin);
        }
      } else if (existing.role !== 'ADMIN' || existing.status !== 'Actif') {
        existing.role = 'ADMIN';
        existing.status = 'Actif';
        try {
          await setDoc(doc(db, 'users', String(existing.id)), existing);
        } catch (err) {
          console.warn("Could not update admin user role in Firestore:", existing.email, err);
        }
      }
    }

    if (list.length > 0) {
      localStorage.setItem('cscm_users', JSON.stringify(list));
      return list;
    }
  } catch (e) {
    console.warn("Could not fetch latest users from Firestore:", e);
  }
  return getStoredUsers();
};
