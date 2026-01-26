# Application de Gestion du Festival du Jeu

Cette application permet la gestion complète des festivals, des éditeurs, des jeux et des réservations de stands.

## Comment tester l'application

### 1. Accès direct (Déploiement VM)

L'application est déjà déployée et accessible via le VPN à l'adresse suivante :
👉 **[https://162.38.111.43](https://162.38.111.43)**
*(Note : Acceptez le certificat auto-signé dans votre navigateur).*

### 2. Lancement en local (Développement)

Pour lancer le projet sur votre machine, suivez ces étapes :

**Étape 1 : Lancer l'infrastructure (Base de données)**

```bash
docker compose -f docker-compose.dev.yml up -d

```

**Étape 2 : Initialiser les données (Premier lancement uniquement)**
Pour peupler la base de données, connectez-vous à **Adminer** (`http://localhost:8080`) et exécutez les scripts SQL situés dans `backend/db/` dans l'ordre suivant :

1. `01_init.sql` (Structure des tables)
2. `02_import_reference.sql` (Données de référence)
3. `03_data_demo.sql` (Jeux, festivals et réservations de test)
   
**Étape 3 : Lancer le Backend**

```bash
cd backend
npm install
npm run dev

```

*L'API sera disponible sur `https://localhost:4000*`

**Étape 4 : Lancer le Frontend**

```bash
cd frontend
npm install
npm start

```

*L'interface sera disponible sur `http://localhost:4200*`

---

## Identifiants de test

L'accès aux fonctionnalités dépend du rôle de l'utilisateur. Tous les comptes utilisent le mot de passe : **`password`**.

| Utilisateur | Rôle | Description |
| --- | --- | --- |
| **Tom** | `admin` | Accès total (Gestion utilisateurs, festivals, zones) |
| **Theo** | `visiteur` | Consultation uniquement |
| **Amina** | `organisateur_jeux` | Gestion du catalogue de jeux et mécanismes |
| **Julien** | `organisateur_reservations` | Gestion des réservations et des éditeurs |
| **Sarah** | `no-role` | Compte sans droits (test d'accès restreint) |

---

### Consultation de la base de données

Un outil **Adminer** est disponible en local pour visualiser les tables :

* **URL** : `http://localhost:8080`
* **Serveur** : `db`
* **Utilisateur/Password** : `festival_app` / `festival_app`

---
