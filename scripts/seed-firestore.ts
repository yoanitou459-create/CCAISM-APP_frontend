/**
 * Script de peuplement Firestore — base ai-studio-1f26c2df-bc6a-4a47-bfae-9a0c0efaad81
 * Usage: npm run seed:firestore
 */
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { INITIAL_USERS } from '../src/utils/userStorage.ts';
import { INITIAL_ENTERPRISES } from '../src/utils/enterpriseStorage.ts';

const DEFAULT_COTISATION_RULES = {
  amountPerSemester: 10000,
  currency: 'FCFA',
  lastUpdated: new Date().toISOString(),
  updatedBy: 'Système',
};

async function seed() {
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  console.log('>> Connexion Firebase anonyme...');
  const credential = await signInAnonymously(auth);
  console.log('>> Auth OK — UID:', credential.user.uid);
  console.log('>> Base Firestore:', firebaseConfig.firestoreDatabaseId);

  console.log('>> Écriture des utilisateurs...');
  for (const user of INITIAL_USERS) {
    await setDoc(doc(db, 'users', String(user.id)), user);
    console.log('   + users/', user.id, `(${user.email})`);
  }

  console.log('>> Écriture des entreprises...');
  for (const ent of INITIAL_ENTERPRISES) {
    await setDoc(doc(db, 'enterprises', String(ent.id)), ent);
    console.log('   + enterprises/', ent.id, `(${ent.name})`);
  }

  console.log('>> Écriture des règles de cotisation...');
  await setDoc(doc(db, 'settings', 'cotisation_rules'), DEFAULT_COTISATION_RULES);
  console.log('   + settings/cotisation_rules');

  console.log('');
  console.log('Terminé ! Vérifiez dans Firebase Console :');
  console.log('  Projet  : aesthetic-computer-mjhcx');
  console.log('  Base    :', firebaseConfig.firestoreDatabaseId);
  console.log('  Collections : users, enterprises, settings');
}

seed().catch((err) => {
  console.error('Échec du peuplement Firestore:', err);
  console.error('');
  console.error('Vérifiez que l\'auth anonyme est activée dans Firebase Console');
  console.error('(Authentication → Sign-in method → Anonymous → Enable)');
  process.exit(1);
});
