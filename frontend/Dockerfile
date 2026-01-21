# Étape 1 : Construction de l'application Angular
FROM node:20-alpine as build
WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm ci

# Copie du code source et build
COPY . .
# Le flag --configuration production assure les optimisations
RUN npm run build -- --configuration production

# Étape 2 : Serveur Nginx pour la production
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf

# On copie les fichiers compilés d'Angular vers le dossier de Nginx
COPY --from=build /app/dist/festival/browser /usr/share/nginx/html

# On expose les ports
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
