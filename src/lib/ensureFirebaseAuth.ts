import { auth } from '../firebase';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

/** Attend que Firebase Auth soit prêt (requis pour lire/écrire Firestore). */
export const ensureFirebaseAuth = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if (auth.currentUser) {
      resolve();
      return;
    }

    let settled = false;
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      unsubscribe();
      reject(new Error('Délai dépassé : connexion Firebase impossible.'));
    }, 15000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (settled) return;

      if (user) {
        settled = true;
        window.clearTimeout(timeout);
        unsubscribe();
        resolve();
        return;
      }

      try {
        await signInAnonymously(auth);
      } catch (error) {
        settled = true;
        window.clearTimeout(timeout);
        unsubscribe();
        reject(error);
      }
    });
  });
