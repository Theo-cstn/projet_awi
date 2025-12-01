-- ============================================================
-- 1. TYPES & ENUMS
-- ============================================================

CREATE TYPE role_type AS ENUM ('no-role','visiteur','organisateur_jeux', 'organisateur_reservations', 'admin');
CREATE TYPE game_type AS ENUM ('Action', 'Aventure','RPG','Reflexion','Simulation','Strategie','Sport','Carte');

-- CRM : État du suivi commercial
CREATE TYPE etat_suivi AS ENUM ('PAS_CONTACTE', 'CONTACTE', 'DISCUSSION', 'REFUS', 'CONFIRME');

-- Réservation : Cycle de vie de la commande
CREATE TYPE etat_reservation AS ENUM ('PRESENT', 'FACTUREE', 'PAYEE'); 

-- Qui réserve ?
CREATE TYPE type_reservant AS ENUM ('Editeur', 'Boutique', 'Association', 'Prestataire', 'Autre');

-- Logistique : Tailles physiques des tables
CREATE TYPE taille_table AS ENUM ('PETITE', 'GRANDE', 'MAIRIE');


-- ============================================================
-- 2. AUTHENTIFICATION & UTILISATEURS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    login TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role role_type DEFAULT 'no-role'
);


-- ============================================================
-- 3. DONNÉES GLOBALES (Editeurs, Personnes, Jeux)
-- ============================================================

CREATE TABLE Editeur (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE Personne (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL
);

CREATE TABLE Editeur_Contact (
    editeur_id INT REFERENCES Editeur(id) ON DELETE CASCADE, 
    contact_id INT REFERENCES Personne(id) ON DELETE CASCADE,
    est_contact_principal BOOLEAN DEFAULT false,
    poste VARCHAR(100), 
    PRIMARY KEY (editeur_id, contact_id)
);

CREATE TABLE Jeu (
    id SERIAL PRIMARY KEY,
    editeur_id INT NOT NULL REFERENCES Editeur(id), 
    nom VARCHAR(255) NOT NULL,
    typeG game_type,
    age_min INT,
    age_max INT
);

CREATE TABLE Auteurs_Jeux (
    jeu_id INT REFERENCES Jeu(id) ON DELETE CASCADE, 
    auteur_id INT REFERENCES Personne(id), 
    PRIMARY KEY (jeu_id, auteur_id)
);


-- ============================================================
-- 4. STRUCTURE DU FESTIVAL
-- ============================================================

CREATE TABLE Festival (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) UNIQUE NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    -- Stock global de matériel disponible pour ce festival
    stock_tables_petites INT DEFAULT 0,
    stock_tables_grandes INT DEFAULT 0,
    stock_tables_mairie INT DEFAULT 0,   
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ZoneTarifaire (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    festival_id INT NOT NULL REFERENCES Festival(id) ON DELETE CASCADE,
    prix_table DECIMAL(10, 2) NOT NULL,
    prix_m2 DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ZonePlan (
    id SERIAL PRIMARY KEY,
    zone_tarifaire_id INT NOT NULL REFERENCES ZoneTarifaire(id) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    nombre_tables INT NOT NULL
);


-- ============================================================
-- 5. PROCESSUS MÉTIER (CRM & Réservations)
-- ============================================================

-- TABLE A : CRM (Avant la vente)
CREATE TABLE SuiviEditeur (
    festival_id INT NOT NULL REFERENCES Festival(id) ON DELETE CASCADE,
    editeur_id INT NOT NULL REFERENCES Editeur(id) ON DELETE CASCADE,
    etat etat_suivi DEFAULT 'PAS_CONTACTE',
    compte_rendu TEXT, 
    responsable_id INT REFERENCES users(id),
    PRIMARY KEY (festival_id, editeur_id)
);

-- TABLE B : Réservations (Le Contrat Global)
CREATE TABLE Reservation (
    id SERIAL PRIMARY KEY,
    festival_id INT NOT NULL REFERENCES Festival(id) ON DELETE CASCADE,
    type type_reservant NOT NULL,
    editeur_id INT REFERENCES Editeur(id), 
    autre_nom_reservant VARCHAR(255), 
    
    -- STEP 1 : Données Logistiques Globales & Préférences
    nombre_prises INT DEFAULT 0, 
    est_present BOOLEAN DEFAULT true,
    remise_generale DECIMAL(10, 2) DEFAULT 0,
    preferences_tables TEXT, -- Ex: "On préfère les grandes tables"

    -- Cycle de vie
    statut etat_reservation DEFAULT 'PRESENT',
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_facturation TIMESTAMP,
    date_paiement TIMESTAMP,
    
    CHECK (
        (type = 'Editeur' AND editeur_id IS NOT NULL) OR 
        (type != 'Editeur' AND autre_nom_reservant IS NOT NULL)
    )
);

-- TABLE C : LigneReservation (Step 1 - Ce qui est facturé)
CREATE TABLE LigneReservation (
    id SERIAL PRIMARY KEY,
    reservation_id INT NOT NULL REFERENCES Reservation(id) ON DELETE CASCADE,
    zone_tarifaire_id INT NOT NULL REFERENCES ZoneTarifaire(id),
    
    type_emplacement VARCHAR(10) CHECK (type_emplacement IN ('TABLE', 'M2')),
    
    -- C'est le "Crédit" de tables achetées
    quantite INT NOT NULL, 
    
    -- Prix figé (permet de faire des remises ligne par ligne si besoin en mettant 0)
    prix_unitaire_applique DECIMAL(10, 2) NOT NULL 
);

-- TABLE D : JeuReserve (Step 2 & 3 - L'INSTALLATION)
CREATE TABLE JeuReserve (
    id SERIAL PRIMARY KEY,
    reservation_id INT NOT NULL REFERENCES Reservation(id) ON DELETE CASCADE,
    jeu_id INT NOT NULL REFERENCES Jeu(id),
    
    -- Placement physique (Step 3)
    zone_plan_id INT REFERENCES ZonePlan(id),
    
    -- Type de table souhaité (Info pour les bénévoles qui installent)
    type_table taille_table DEFAULT 'PETITE', 
    
    -- Consommation d'espace (1 = Une table entière, 0.5 = Partage)
    tables_occupees DECIMAL(3, 1) DEFAULT 1.0,
    
    nb_exemplaires INT DEFAULT 1,
    est_recu BOOLEAN DEFAULT false
);