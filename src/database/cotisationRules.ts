import { doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export interface CotisationRules {
  amountPerSemester: number;
  currency: string;
  lastUpdated: string;
  updatedBy: string;
}

const DEFAULT_RULES: CotisationRules = {
  amountPerSemester: 10000,
  currency: 'FCFA',
  lastUpdated: new Date().toISOString(),
  updatedBy: 'Système'
};

/**
 * Retrieves the current contribution rules from localStorage.
 * Falls back to default rules if none are present.
 */
export const getLocalCotisationRules = (): CotisationRules => {
  const data = localStorage.getItem('cscm_cotisation_rules');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed.amountPerSemester === 'number') {
        return parsed;
      }
    } catch (e) {}
  }
  return DEFAULT_RULES;
};

/**
 * Saves updated contribution rules to Firestore.
 * This will automatically sync to all users in real-time.
 */
export const saveCotisationRules = async (rules: CotisationRules) => {
  try {
    await setDoc(doc(db, 'settings', 'cotisation_rules'), rules);
    localStorage.setItem('cscm_cotisation_rules', JSON.stringify(rules));
    window.dispatchEvent(new Event('cotisation_rules_updated'));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/cotisation_rules');
  }
};

/**
 * Fetches the latest rules from Firestore once.
 */
export const fetchLatestCotisationRules = async (): Promise<CotisationRules> => {
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'cotisation_rules'));
    if (docSnap.exists()) {
      const rules = docSnap.data() as CotisationRules;
      localStorage.setItem('cscm_cotisation_rules', JSON.stringify(rules));
      window.dispatchEvent(new Event('cotisation_rules_updated'));
      return rules;
    } else {
      // Seed default rules if not found
      await saveCotisationRules(DEFAULT_RULES);
      return DEFAULT_RULES;
    }
  } catch (e) {
    console.warn("Could not fetch latest cotisation rules from Firestore:", e);
  }
  return getLocalCotisationRules();
};

/**
 * Subscribes to real-time changes of the contribution rules.
 * This ensures any change is visible instantly in all open tabs/browsers.
 */
export const setupCotisationRulesListener = () => {
  return onSnapshot(
    doc(db, 'settings', 'cotisation_rules'),
    (docSnap) => {
      if (docSnap.exists()) {
        const rules = docSnap.data() as CotisationRules;
        localStorage.setItem('cscm_cotisation_rules', JSON.stringify(rules));
        window.dispatchEvent(new Event('cotisation_rules_updated'));
      } else {
        // Document doesn't exist, seed it
        saveCotisationRules(DEFAULT_RULES).catch(err => {
          console.error("Failed to seed default cotisation rules:", err);
        });
      }
    },
    (error) => {
      console.error("Error with cotisation rules listener:", error);
    }
  );
};
