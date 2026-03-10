# 🚀 ModPanel — Guide d'installation (5 étapes)

## Étape 1 — Installe Node.js
Va sur https://nodejs.org et télécharge la version **LTS**.
Lance l'installateur, clique sur Suivant partout.

---

## Étape 2 — Configure ton application Discord
1. Va sur https://discord.com/developers/applications
2. Clique sur **New Application** (ou sélectionne ton bot existant)
3. Dans l'onglet **Bot** → clique **Reset Token** → copie le token
4. Dans l'onglet **OAuth2** :
   - Copie le **Client ID** et le **Client Secret**
   - Dans **Redirects**, clique **Add Redirect** et colle : `http://localhost:3000/auth/callback`
   - Clique **Save Changes**

---

## Étape 3 — Remplis le fichier `.env`
Ouvre le fichier `.env` et remplace les valeurs :
```
BOT_TOKEN=ton_vrai_token
CLIENT_ID=ton_vrai_client_id
CLIENT_SECRET=ton_vrai_client_secret
```

---

## Étape 4 — Installe les dépendances
Ouvre un terminal dans le dossier `discord-dashboard` et tape :
```bash
npm install
```

---

## Étape 5 — Lance le dashboard !
```bash
npm start
```

Puis ouvre ton navigateur sur → **http://localhost:3000**

---

## ✅ Résultat
- Page d'accueil moderne avec bouton "Connexion Discord"
- Dashboard avec statistiques, liste des membres, logs
- Actions ban/kick/warn directement depuis l'interface

## ❓ Problèmes fréquents
- **"Cannot find module"** → tu n'as pas fait `npm install`
- **"Invalid OAuth2 redirect"** → vérifie que tu as bien ajouté l'URL dans Discord Developer Portal
- **"Serveur introuvable"** → le bot n'est pas sur ton serveur Discord
