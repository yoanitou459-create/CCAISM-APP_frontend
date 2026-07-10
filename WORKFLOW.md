# Workflow Frontend / Backend — CCAISM

## Rôles

| Qui | Responsabilité | Push Git |
|-----|----------------|----------|
| **Yoan (frontend / design)** | UI, CSS, composants, pages (visuel) | Via Cursor → branche `design/ui-only` puis `main` |
| **Autre développeur (backend)** | Firebase, Firestore, `utils/`, logique métier | Envoie ses fichiers / sa branche — **pas de push design** |

## Fichiers frontend (ne pas modifier côté backend)

```
src/index.css
src/components/
src/pages/          (style et mise en page uniquement)
src/App.tsx         (partie visuelle)
src/lib/
```

## Fichiers backend (modifiables par l'autre dev)

```
src/firebase.ts
src/utils/
src/hooks/
firestore.rules
firebase-blueprint.json
```

---

## 1. Push frontend (Yoan — via Cursor)

Le design est poussé **uniquement** sur ces fichiers. Le backend n'est jamais inclus.

```powershell
$env:PATH = "C:\Program Files\Git\bin;" + $env:PATH
cd "C:\Users\hp\Downloads\CCAISM-APP_frontend-main\CCAISM-APP_frontend-main"

git fetch origin
git checkout design/ui-only
git pull origin design/ui-only

# Après modifications design locales :
git add src/index.css src/App.tsx src/components/ src/pages/ src/lib/
git status   # vérifier : PAS de firebase.ts ni utils/

git commit -m "feat(ui): description du changement design"
git push origin design/ui-only

# Fusion dans main (production / Vercel)
git checkout main
git pull origin main
git merge design/ui-only
git push origin main
```

---

## 2. Réception des modifications backend (autre développeur)

L'autre dev **n'envoie pas** de push direct sur `main` pour le design. Il transmet :

- une **branche Git** (`backend/feature-xxx`), ou
- une **archive** des fichiers backend, ou
- une **Pull Request** limitée aux fichiers backend.

### Option A — Branche Git (recommandé)

L'autre dev crée `backend/nom-feature` et pousse uniquement :

```
src/firebase.ts
src/utils/*
src/hooks/*
firestore.rules
firebase-blueprint.json
```

Yoan intègre **sans toucher au design** :

```powershell
$env:PATH = "C:\Program Files\Git\bin;" + $env:PATH
cd "C:\Users\hp\Downloads\CCAISM-APP_frontend-main\CCAISM-APP_frontend-main"

git fetch origin
git checkout main
git pull origin main

# Remplacer UNIQUEMENT les fichiers backend depuis la branche de l'autre dev
git checkout origin/backend/nom-feature -- src/firebase.ts src/utils src/hooks firestore.rules firebase-blueprint.json

git status
npm run build
git commit -m "chore: sync backend depuis backend/nom-feature"
git push origin main
```

Ou utiliser le script : `.\scripts\sync-backend.ps1 origin/backend/nom-feature`

### Option B — Fichiers reçus par message / archive

1. Copier les fichiers backend dans le projet (mêmes chemins).
2. Vérifier qu'aucun fichier `index.css` / `components/` n'a été remplacé.
3. `npm run build` puis commit + push sur `main`.

---

## 3. Règles pour l'autre développeur

1. Ne **jamais** modifier `src/index.css` ni les classes CSS du design.
2. Travailler sur une branche `backend/*`.
3. Si une page `.tsx` doit changer pour la logique : modifier **uniquement** le code JS/TS (hooks, API), pas le JSX visuel.
4. Réutiliser les classes existantes : `input-field`, `btn-primary`, `table-shell`, `card-elevated`.
5. En cas de conflit : le design de Yoan prime sur l'apparence ; le backend prime sur `firebase.ts` et `utils/`.

---

## 4. Vérification avant chaque push

```powershell
git diff origin/main --name-only
```

**Push frontend** → doit lister surtout `index.css`, `components/`, `pages/`.  
**Sync backend** → doit lister surtout `firebase.ts`, `utils/`, `firestore.rules`.

---

## 5. État actuel

- Design frontend : branche `main` (commit `639f1d6` et suivants)
- Branche design dédiée : `design/ui-only`
- Production Vercel : déploie depuis `main`
