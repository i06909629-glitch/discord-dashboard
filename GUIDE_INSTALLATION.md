# 🛡️ ModPanel — Guide d'installation

## Étape 1 — Installer Node.js
Télécharge et installe Node.js sur https://nodejs.org (version LTS recommandée)

## Étape 2 — Créer ton application Discord
1. Va sur https://discord.com/developers/applications
2. Clique "New Application" → donne un nom
3. Va dans l'onglet "Bot" → clique "Add Bot"
4. Copie ton **Bot Token**
5. Va dans "OAuth2" → "General"
6. Copie ton **Client ID** et **Client Secret**
7. Dans "Redirects", ajoute : `http://localhost:3000/auth/callback`

## Étape 3 — Configurer le projet
1. Copie le fichier `.env.example` et renomme-le `.env`
2. Remplis les valeurs :
   - `BOT_TOKEN` → ton token de bot
   - `CLIENT_ID` → ton client ID
   - `CLIENT_SECRET` → ton client secret
   - `SESSION_SECRET` → n'importe quel mot de passe long et aléatoire
   - `CALLBACK_URL` → laisse tel quel pour tester en local

## Étape 4 — Installer les dépendances
Ouvre un terminal dans le dossier du projet et lance :
```
npm install
```

## Étape 5 — Inviter le bot sur ton serveur
Génère un lien d'invitation dans Discord Developer Portal :
- OAuth2 → URL Generator
- Scopes : `bot`, `applications.commands`
- Permissions : `Administrator` (ou les permissions dont tu as besoin)

## Étape 6 — Lancer le projet
```
npm start
```

Ouvre ton navigateur sur : http://localhost:3000

## Fonctionnalités disponibles
- ✅ Connexion OAuth2 Discord
- ✅ Vue d'ensemble avec statistiques
- ✅ Liste des membres avec rôles
- ✅ Bannir / Expulser / Avertir depuis le dashboard
- ✅ Logs de modération en temps réel
- ✅ Recherche de membres

## Pour aller plus loin
- Ajoute MongoDB pour sauvegarder les logs entre redémarrages
- Héberge sur Railway.app ou Heroku pour avoir le bot en ligne 24/7
