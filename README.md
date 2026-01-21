🎲 Application de Gestion du Festival du Jeu

Bienvenue sur le projet AWI ! Ce guide vous permettra de configurer votre environnement de développement local en quelques minutes.

📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

Node.js (v18 ou supérieur)

Docker Desktop (lancé)

Git

🚀 Installation & Démarrage Rapide

Suivez ces étapes dans l'ordre exact pour éviter les erreurs.

1. Backend (Configuration)

cd backend

# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env
# (Le fichier .env par défaut est configuré pour marcher tout de suite avec Docker)

# 3. Vérifier les certificats HTTPS
# Assurez-vous que le dossier 'backend/certs' contient bien 'localhost.pem' et 'localhost-key.pem'.
# Sinon, demandez-les à Tom ou générez-les avec mkcert.


2. Base de Données (Docker)

Nous utilisons Docker pour PostgreSQL et Adminer.

# À la racine du projet (revenez en arrière si vous êtes dans backend/)
docker compose -f docker-compose.dev.yml up -d


Note : Si vous devez réinitialiser la base à zéro (en cas de bug), faites :
docker compose -f docker-compose.dev.yml down -v puis relancez up -d.

3. Injection des Données (Seed) ⚠️ ÉTAPE CRUCIALE

Pour avoir des festivals, des jeux et des utilisateurs pour tester, il faut remplir la base.

Ouvrez Adminer : http://localhost:8080

Système : PostgreSQL

Serveur : db

Utilisateur : festival_app

Mot de passe : festival_app

Base de données : festival_app

Allez dans "Importer".

Sélectionnez le fichier backend/db/seed.sql (Catalogue complet) -> Exécuter.

Sélectionnez le fichier backend/db/seed-demo.sql (Utilisateurs & Scénarios) -> Exécuter.

✅ Votre base contient maintenant 1500 jeux, 300 éditeurs et des comptes de test.

4. Lancer le Backend

cd backend
npm run dev


👉 L'API tourne sur https://localhost:4000

⚠️ IMPORTANT : La première fois, ouvrez cette URL dans votre navigateur et cliquez sur "Avancé > Continuer vers le site (Dangereux)" pour accepter le certificat auto-signé. Sinon, le login échouera.

5. Lancer le Frontend

Ouvrez un nouveau terminal :

cd frontend
ng serve
