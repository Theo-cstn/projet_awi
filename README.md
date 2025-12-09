## Configuration de l'environnement

### 1. Cloner et installer
```bash
git clone git@github.com:Theo-cstn/projet_awi.git
cd projet_awi/backend
npm install
```

### 2. Configuration
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer selon votre setup local
nano .env
```

### 3. Base de données
```bash
# Si Docker
docker-compose up -d

# Si PostgreSQL local
createdb festival_app
psql festival_app < db/init.sql
```

### 4. Certificats HTTPS
```bash
# Installer mkcert
brew install mkcert  # ou apt install mkcert

# Configurer CA
mkcert -install

# Générer certificats
mkdir -p certs
mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem "localhost"
```

### 5. Lancer le serveur
```bash
npm run dev
```

### 6. Test
Ouvrir : `https://localhost:4000/api/public`
