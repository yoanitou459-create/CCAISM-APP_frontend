import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../../database/firebase';
import { fetchLatestUsers, saveStoredUsers, AppUser } from '../../database/userStorage';

export type GoogleSessionOptions = {
  /** true = inscription (crée le compte si absent). false = connexion (uniquement si déjà en base). */
  allowCreate?: boolean;
  companyName?: string;
};

/** Provider Google : force le choix parmi les comptes du navigateur. */
export function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  provider.setCustomParameters({
    prompt: 'select_account',
  });
  return provider;
}

export function isGoogleFirebaseUser(user: FirebaseUser | null | undefined): boolean {
  if (!user || user.isAnonymous || !user.email) return false;
  return user.providerData.some(p => p.providerId === 'google.com');
}

function persistSession(matchedUser: AppUser) {
  localStorage.setItem('token', `google-token-${matchedUser.id}`);
  localStorage.setItem(
    'user',
    JSON.stringify({
      id: matchedUser.id,
      nom: matchedUser.nom,
      prenom: matchedUser.prenom,
      email: matchedUser.email,
      role: matchedUser.role,
      entreprise: matchedUser.entreprise || '',
    })
  );
  localStorage.setItem('cscm_last_email', matchedUser.email);
  localStorage.setItem('cscm_auth_provider', 'google');
  window.dispatchEvent(new Event('user_profile_updated'));
}

/**
 * Après le choix du compte Google :
 * - si le compte est reconnu en base → connexion automatique
 * - sinon, selon allowCreate, création ou refus
 */
export async function establishAppSessionFromGoogle(
  userEmail: string,
  displayName: string,
  options: GoogleSessionOptions = {}
): Promise<
  | { ok: true; user: AppUser; created: boolean }
  | { ok: false; reason: 'inactive' | 'not_found' }
> {
  const { allowCreate = false, companyName } = options;
  const email = userEmail.trim().toLowerCase();
  const users = await fetchLatestUsers();
  let matchedUser = users.find(u => u.email.toLowerCase() === email);
  let created = false;

  if (!matchedUser) {
    if (!allowCreate) {
      return { ok: false, reason: 'not_found' };
    }
    const names = displayName ? displayName.trim().split(/\s+/) : [];
    const prenom = names[0] || 'Utilisateur';
    const nom = names.slice(1).join(' ') || 'Google';
    const newUser: AppUser = {
      id: 'u_' + Date.now(),
      nom,
      prenom,
      email,
      role: users.length === 0 ? 'ADMIN' : 'MEMBRE',
      entreprise: companyName || 'Compte Google',
      status: 'Actif',
      dateCreation: new Date().toISOString().split('T')[0],
    };
    await saveStoredUsers([...users, newUser]);
    matchedUser = newUser;
    created = true;
  }

  if (matchedUser.status === 'Inactif') {
    return { ok: false, reason: 'inactive' };
  }

  persistSession(matchedUser);
  return { ok: true, user: matchedUser, created };
}

export async function establishAppSessionFromFirebaseUser(
  gUser: FirebaseUser,
  options: GoogleSessionOptions = {}
) {
  if (!gUser.email) return { ok: false as const, reason: 'no_email' as const };
  return establishAppSessionFromGoogle(gUser.email, gUser.displayName || '', options);
}

/** Ouvre le sélecteur de comptes Google (popup), sinon redirect. */
export async function signInWithGoogleAccountPicker(): Promise<FirebaseUser> {
  const provider = createGoogleProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw err;
    }
    try {
      await signInWithRedirect(auth, provider);
      throw Object.assign(new Error('redirect_started'), { code: 'auth/redirect-started' });
    } catch (redirectErr: any) {
      if (redirectErr?.code === 'auth/redirect-started') throw redirectErr;
      throw err;
    }
  }
}

export async function consumeGoogleRedirectResult(): Promise<FirebaseUser | null> {
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch {
    return null;
  }
}

/** Reconnexion auto uniquement si session Google active ET compte reconnu. */
export function watchExistingGoogleSession(
  onReady: (user: FirebaseUser) => void
): () => void {
  return onAuthStateChanged(auth, (user) => {
    if (isGoogleFirebaseUser(user) && user) {
      onReady(user);
    }
  });
}

export const LAST_EMAIL_KEY = 'cscm_last_email';
