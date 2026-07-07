/**
 * CONFIGURATION DE LA PASSERELLE DE PAIEMENT EN LIGNE (STRIPE, PAYTECH, ETC.)
 * 
 * Remplissez votre clé API ci-dessous. 
 * Les utilisateurs pourront effectuer des paiements en ligne directement sans saisir de clé dans l'UI.
 * Si cette clé est vide ou n'est pas configurée, un message d'erreur apparaîtra.
 */

// Saisissez votre clé de paiement directement ci-dessous (ex: "sk_test_51Px...")
export const PAYMENT_API_KEY: string = "sk_test_VOTRE_CLE_API_SANS_UI_FR_ICI";

/**
 * Récupère la clé API de paiement active.
 * Vérifie d'abord si l'utilisateur a configuré la clé ci-dessus,
 * sinon essaie de lire la variable d'environnement, ou le stockage temporaire.
 */
export const getEffectiveApiKey = (): string => {
  // 1. Vérification de la clé hardcodée ci-dessus
  const key = PAYMENT_API_KEY;
  if (key && key !== "" && !key.includes("VOTRE_CLE_API")) {
    return key;
  }

  // 2. Repli vers la variable d'environnement
  const envKey = ((import.meta as any).env?.VITE_PAYMENT_API_KEY as string);
  if (envKey && envKey !== "") {
    return envKey;
  }

  // 3. Repli vers le stockage local (test/démo temporaire)
  return localStorage.getItem('CCIM_PAYMENT_API_KEY') || '';
};
