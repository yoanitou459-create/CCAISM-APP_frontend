import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ensureFirebaseAuth } from './ensureFirebaseAuth';
import { INITIAL_USERS } from '../utils/userStorage';
import { INITIAL_ENTERPRISES } from '../utils/enterpriseStorage';

const DEFAULT_COTISATION_RULES = {
  amountPerSemester: 10000,
  currency: 'FCFA',
  lastUpdated: new Date().toISOString(),
  updatedBy: 'Système',
};

export interface FirestoreSeedResult {
  users: number;
  enterprises: number;
  rules: boolean;
  errors: string[];
}

/** Pousse les données initiales vers Firestore (base ai-studio-...). */
export const seedFirestoreDatabase = async (): Promise<FirestoreSeedResult> => {
  const result: FirestoreSeedResult = {
    users: 0,
    enterprises: 0,
    rules: false,
    errors: [],
  };

  await ensureFirebaseAuth();

  for (const user of INITIAL_USERS) {
    try {
      await setDoc(doc(db, 'users', String(user.id)), user);
      result.users += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`users/${user.id}: ${msg}`);
      try {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
      } catch {
        /* déjà loggé */
      }
    }
  }

  for (const ent of INITIAL_ENTERPRISES) {
    try {
      await setDoc(doc(db, 'enterprises', String(ent.id)), ent);
      result.enterprises += 1;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`enterprises/${ent.id}: ${msg}`);
      try {
        handleFirestoreError(err, OperationType.WRITE, `enterprises/${ent.id}`);
      } catch {
        /* déjà loggé */
      }
    }
  }

  try {
    await setDoc(doc(db, 'settings', 'cotisation_rules'), DEFAULT_COTISATION_RULES);
    result.rules = true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    result.errors.push(`settings/cotisation_rules: ${msg}`);
  }

  localStorage.setItem('cscm_firebase_migrated', 'true');
  window.dispatchEvent(new Event('users_updated'));
  window.dispatchEvent(new Event('enterprises_updated'));
  window.dispatchEvent(new Event('cotisation_rules_updated'));

  return result;
};
