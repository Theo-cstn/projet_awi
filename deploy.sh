#!/bin/bash

# Configuration
USER="tom.cantillon"
HOST="162.38.111.43"
DIR="~/projet_awi"
BRANCH="dev"

# Fonction d'aide
show_help() {
    echo "Usage: ./deploy.sh [OPTIONS]"
    echo "Déploie la branche '$BRANCH' sur la VM Polytech."
    echo ""
    echo "Options:"
    echo "  --reset-db    Supprime la base de données et la recrée (perte de données !)"
    echo "  --help        Affiche ce message"
}

# Gestion des arguments
RESET_DB=false

for arg in "$@"
do
    case $arg in
        --reset-db)
        RESET_DB=true
        shift
        ;;
        --help)
        show_help
        exit 0
        ;;
    esac
done

echo "Démarrage du déploiement sur $HOST..."

# Commande de base : Pull + Build Frontend (car code modifié) + Build Backend + Up
# NOTE : On force le build du frontend à chaque fois pour être sûr que les modifs Angular sont prises en compte
REMOTE_COMMANDS="
    cd $DIR && \
    echo '1. Récupération du code Git...' && \
    git checkout $BRANCH && \
    git pull origin $BRANCH && \
"

if [ "$RESET_DB" = true ] ; then
    REMOTE_COMMANDS+="
    echo '2. RESET COMPLET DE LA BASE DE DONNÉES...' && \
    docker compose -f docker-compose.prod.yml down -v && \
    "
else
    REMOTE_COMMANDS+="
    echo '2. Arrêt des conteneurs...' && \
    docker compose -f docker-compose.prod.yml down && \
    "
fi

REMOTE_COMMANDS+="
    echo '3. Construction et Démarrage...' && \
    docker compose -f docker-compose.prod.yml up -d --build && \
    echo 'Déploiement terminé avec succès !'
"

# Exécution via SSH
ssh $USER@$HOST "$REMOTE_COMMANDS"