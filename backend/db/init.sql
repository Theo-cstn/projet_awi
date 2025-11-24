-- 0. Authentification (Utilisateurs de l'application admin)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    login TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user'
);

-- 1. Tables de Référence Globale
CREATE TABLE Editeur (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) UNIQUE NOT NULL,
    est_actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Contact (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    editeur_id UUID NOT NULL REFERENCES Editeur(id) ON DELETE CASCADE,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    email VARCHAR(255),
    telephone VARCHAR(50),
    est_principal BOOLEAN DEFAULT false
);

CREATE TABLE Jeu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    editeur_id UUID NOT NULL REFERENCES Editeur(id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    auteurs VARCHAR(255),
    type VARCHAR(50),
    age_min INT,
    age_max INT,
    duree_moyenne INT
);

-- 2. Structure du Festival

CREATE TABLE Festival (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) UNIQUE NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    est_courant BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ZoneTarifaire (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    festival_id UUID NOT NULL REFERENCES Festival(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    prix_table DECIMAL(10, 2) NOT NULL,
    prix_m2 DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ZonePlan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    festival_id UUID NOT NULL REFERENCES Festival(id) ON DELETE CASCADE,
    zone_tarifaire_id UUID NOT NULL REFERENCES ZoneTarifaire(id),
    nom VARCHAR(100) NOT NULL,
    capacite_tables INT NOT NULL
);

-- 3. Coeur du système : Réservations et Workflow

CREATE TYPE workflow_status AS ENUM (
    'PAS_CONTACTE', 
    'CONTACTE', 
    'DISCUSSION', 
    'PRESENCE_CONFIRMEE', 
    'FACTURE_EDITE', 
    'PAYE', 
    'ABSENT', 
    'SANS_REPONSE'
);

CREATE TABLE Reservation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    festival_id UUID NOT NULL REFERENCES Festival(id) ON DELETE CASCADE,
    editeur_id UUID NOT NULL REFERENCES Editeur(id) ON DELETE RESTRICT,
    statut workflow_status DEFAULT 'PAS_CONTACTE',
    date_dernier_contact TIMESTAMP,
    remise_globale DECIMAL(10, 2) DEFAULT 0,
    commentaire TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(festival_id, editeur_id) 
);

CREATE TABLE LigneReservation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES Reservation(id) ON DELETE CASCADE,
    zone_tarifaire_id UUID NOT NULL REFERENCES ZoneTarifaire(id),
    type VARCHAR(10) CHECK (type IN ('TABLE', 'M2')),
    quantite INT NOT NULL,
    prix_unitaire_applique DECIMAL(10, 2) NOT NULL
);

CREATE TABLE JeuReserve (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES Reservation(id) ON DELETE CASCADE,
    jeu_id UUID NOT NULL REFERENCES Jeu(id),
    zone_plan_id UUID REFERENCES ZonePlan(id), 
    nb_exemplaires INT DEFAULT 1,
    nb_tables_occupees DECIMAL(5, 2),
    est_recu BOOLEAN DEFAULT false
);