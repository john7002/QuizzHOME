# QUIZZHOME

Jeu de vocabulaire en famille, joué sur un seul appareil (iPad surtout, ou un ordinateur).

## Architecture

- **Application web installable** (PWA) : Vite + React + TypeScript. Fonctionne sans réseau une fois installée.
- **Aucun serveur, aucun compte** : toutes les données (mots, photos, joueurs, progression) sont stockées
  dans l'appareil, dans IndexedDB (via Dexie).
- **Hébergement** : GitHub Pages ne sert que le code de l'application, jamais les données.
- **Sauvegarde et changement d'appareil** : Espace parents → « Sauvegarder maintenant » produit un `.zip`
  (à enregistrer dans Fichiers → iCloud Drive) ; « Importer une sauvegarde » le restaure sur n'importe quel appareil.
  Un rappel s'affiche si la dernière sauvegarde a plus de 7 jours.

```
src/
  domain/   règles du jeu, sans interface : boîtes Leitner, points, choix des mots
  data/     base locale (db.ts) et sauvegarde (backup.ts)
  ui/       écrans
```

## Développer

```sh
npm install
npm run dev -- --host   # ouvrir l'adresse « Network » depuis l'iPad, sur le même Wi-Fi
npm test
npm run build
```

## Publier

Chaque push sur `main` lance les tests puis publie sur GitHub Pages (`.github/workflows/deploy.yml`).
Première fois : dans le dépôt GitHub, Settings → Pages → Source : **GitHub Actions**.

## Installer sur l'iPad

1. Ouvrir l'adresse GitHub Pages dans **Safari**.
2. Partager → **Sur l'écran d'accueil**.
3. Toujours lancer QUIZZHOME depuis l'icône : installée ainsi, Safari n'efface pas ses données.
