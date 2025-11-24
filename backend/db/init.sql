-- ============================================================
-- 1. TYPES & ENUMS
-- ============================================================

-- Rôles utilisateurs (Admin, organisateurs...)
CREATE TYPE role_type AS ENUM ('no-role','visiteur','organisateur_jeux', 'organisateur_reservations', 'admin');

-- Types de jeux de société
CREATE TYPE game_type AS ENUM ('Action', 'Aventure','RPG','Reflexion','Simulation','Strategie','Sport','Carte');

-- CRM (Customer relationship management): État du suivi commercial (Avant réservation)
CREATE TYPE etat_suivi AS ENUM ('A_CONTACTER', 'CONTACTE', 'DISCUSSION', 'REFUS', 'CONFIRME');

-- Réservation : État de la commande (Après accord)
CREATE TYPE etat_reservation AS ENUM ('EN_ATTENTE_VALIDATION', 'VALIDEE', 'FACTUREE', 'PAYEE');

-- Qui réserve ?
CREATE TYPE type_reservant AS ENUM ('Editeur', 'Boutique', 'Association', 'Prestataire', 'Autre');


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
    poste VARCHAR(100), -- Ex: Commercial, DG... On le met ici comme ca une meme personne peut avoir plusieurs postes (par exemple pour 2 éditeurs différents)
    PRIMARY KEY (editeur_id, contact_id)
);

CREATE TABLE Jeu (
    id SERIAL PRIMARY KEY,
    -- RESTRICT implicite : Impossible de supprimer un éditeur s'il a des jeux
    editeur_id INT NOT NULL REFERENCES Editeur(id), 
    nom VARCHAR(255) NOT NULL,
    typeG game_type,
    age_min INT,
    age_max INT
);

CREATE TABLE Auteurs_Jeux (
    -- Si l'admin supprime le jeu (erreur de saisie), le lien saute (Pratique)
    jeu_id INT REFERENCES Jeu(id) ON DELETE CASCADE,
    -- Si l'admin essaie de supprimer la personne, ça bloque (Sécurité)
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

-- TABLE A : CRM (Suivi commercial des éditeurs pour un festival)
CREATE TABLE SuiviEditeur (
    festival_id INT NOT NULL REFERENCES Festival(id) ON DELETE CASCADE,
    editeur_id INT NOT NULL REFERENCES Editeur(id) ON DELETE CASCADE,
    etat etat_suivi DEFAULT 'A_CONTACTER',
    compte_rendu TEXT, 
    responsable_id INT REFERENCES users(id),
    PRIMARY KEY (festival_id, editeur_id)
);

-- TABLE B : Réservations fermes (Commandes)
CREATE TABLE Reservation (
    id SERIAL PRIMARY KEY,
    festival_id INT NOT NULL REFERENCES Festival(id) ON DELETE CASCADE,
    
    -- Qui réserve ? 
    type type_reservant NOT NULL,
    
    -- RESTRICT implicite : Impossible de supprimer l'éditeur s'il a une réservation
    editeur_id INT REFERENCES Editeur(id), 
    
    -- Si c'est une Boutique/Asso (qui n'a pas de table dédiée), on remplit ça
    autre_nom_reservant VARCHAR(255), 
    
    statut etat_reservation DEFAULT 'EN_ATTENTE_VALIDATION', -- C'est l'état "brouillon", la venue de l'éfiteur est confirmée mais le nombre de table etc.. n'est pas défini
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Contrainte : On s'assure qu'on a soit un ID éditeur, soit un nom libre
    CHECK (
        (type = 'Editeur' AND editeur_id IS NOT NULL) OR 
        (type != 'Editeur' AND autre_nom_reservant IS NOT NULL)
    )
);

-- Détail de la facture (Tables, m2...)
CREATE TABLE LigneReservation (
    id SERIAL PRIMARY KEY,
    reservation_id INT NOT NULL REFERENCES Reservation(id) ON DELETE CASCADE,
    zone_tarifaire_id INT NOT NULL REFERENCES ZoneTarifaire(id),
    type_emplacement VARCHAR(10) CHECK (type_emplacement IN ('TABLE', 'M2')),
    quantite INT NOT NULL,
    prix_unitaire_applique DECIMAL(10, 2) NOT NULL
);

-- Jeux que l'exposant prévoit d'amener
CREATE TABLE JeuReserve (
    id SERIAL PRIMARY KEY,
    reservation_id INT NOT NULL REFERENCES Reservation(id) ON DELETE CASCADE,
    jeu_id INT NOT NULL REFERENCES Jeu(id),
    zone_plan_id INT REFERENCES ZonePlan(id),
    nb_exemplaires INT DEFAULT 1,
    est_recu BOOLEAN DEFAULT false
);