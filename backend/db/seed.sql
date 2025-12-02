-- ===================================================================================
-- NETTOYAGE (On vide tout pour repartir propre à chaque lancement du seed)
-- ===================================================================================
TRUNCATE TABLE JeuReserve, LigneReservation, Reservation, SuiviEditeur, Auteurs_Jeux, Jeu, Editeur_Contact, Personne, Editeur, ZonePlan, ZoneTarifaire, Festival RESTART IDENTITY CASCADE;

-- ===================================================================================
-- 1. FESTIVALS & ZONES
-- ===================================================================================

-- Création de 2 festivals
INSERT INTO Festival (nom, date_debut, date_fin, stock_tables_petites, stock_tables_grandes, stock_tables_mairie) VALUES
('Festival du Jeu Montpellier 2025', '2025-05-15', '2025-05-18', 200, 100, 20),
('Festival d''Automne 2025', '2025-10-20', '2025-10-22', 100, 50, 10);

-- Zones Tarifaires pour le Festival 1 (Montpellier)
INSERT INTO ZoneTarifaire (festival_id, nom, prix_table, prix_m2) VALUES
(1, 'Zone Famille (Hall A)', 50.00, 10.00), -- ID 1
(1, 'Zone Expert (Hall B)', 70.00, 15.00),  -- ID 2
(1, 'Espace Boutique (Hall C)', 100.00, 25.00), -- ID 3
(1, 'Espace Proto / Auteurs', 20.00, 5.00);    -- ID 4

-- Salles Physiques (Zones Plans) liées aux Zones Tarifaires
INSERT INTO ZonePlan (zone_tarifaire_id, nom, nombre_tables) VALUES
(1, 'Allée Centrale', 40),      -- Dans Zone Famille
(1, 'Coin Enfants', 20),        -- Dans Zone Famille
(2, 'Salle de Tournoi', 50),    -- Dans Zone Expert
(3, 'Carré Vendeurs', 30),      -- Dans Espace Boutique
(4, 'Zone Proto', 15);          -- Dans Espace Auteurs

-- ===================================================================================
-- 2. EDITEURS & PERSONNES
-- ===================================================================================

-- Création des Éditeurs
INSERT INTO Editeur (nom) VALUES 
('Asmodee'), 
('Gigamic'), 
('Iello'), 
('Blue Orange'), 
('Matagot'),
('Repos Production');

-- Création des Personnes (Contacts & Auteurs)
INSERT INTO Personne (nom, prenom, email) VALUES
-- Contacts
('Dupont', 'Jean', 'jean.dupont@asmodee.com'),      -- ID 1
('Martin', 'Sophie', 'sophie.m@gigamic.com'),       -- ID 2
('Bernard', 'Luc', 'luc.b@iello.com'),              -- ID 3
-- Auteurs Célèbres
('Cathala', 'Bruno', 'bruno.cathala@email.com'),    -- ID 4
('Bauza', 'Antoine', 'antoine.bauza@email.com'),    -- ID 5
('Faidutti', 'Bruno', 'bruno.faidutti@email.com'),  -- ID 6
('Leacock', 'Matt', 'matt.leacock@email.com');      -- ID 7

-- Liaison Editeurs <-> Contacts
INSERT INTO Editeur_Contact (editeur_id, contact_id, poste, est_contact_principal) VALUES
(1, 1, 'Directeur Commercial', true), -- Jean chez Asmodee
(2, 2, 'Responsable Events', true),   -- Sophie chez Gigamic
(3, 3, 'Chargé de Projets', true);    -- Luc chez Iello

-- ===================================================================================
-- 3. JEUX & AUTEURS
-- ===================================================================================

INSERT INTO Jeu (editeur_id, nom, typeG, age_min, age_max) VALUES
(1, 'Dobble', 'Reflexion', 6, 99),           -- ID 1 (Asmodee)
(1, 'Jungle Speed', 'Action', 7, 99),        -- ID 2 (Asmodee)
(2, 'Quoridor', 'Strategie', 8, 99),         -- ID 3 (Gigamic)
(3, 'King of Tokyo', 'Action', 8, 12),       -- ID 4 (Iello)
(4, 'Kingdomino', 'Strategie', 8, 99),       -- ID 5 (Blue Orange)
(5, 'Inis', 'Strategie', 14, 99),            -- ID 6 (Matagot)
(6, '7 Wonders', 'Strategie', 10, 99),       -- ID 7 (Repos Prod)
(3, 'Pandemic', 'Simulation', 12, 99);       -- ID 8 (Iello - distri)

-- Liaison Jeux <-> Auteurs
INSERT INTO Auteurs_Jeux (jeu_id, auteur_id) VALUES
(4, 5), -- King of Tokyo -> Antoine Bauza
(5, 4), -- Kingdomino -> Bruno Cathala
(6, 6), -- Inis -> Bruno Faidutti (Exemple)
(7, 5), -- 7 Wonders -> Antoine Bauza
(8, 7); -- Pandemic -> Matt Leacock

-- ===================================================================================
-- 4. SUIVI COMMERCIAL (CRM)
-- ===================================================================================

INSERT INTO SuiviEditeur (festival_id, editeur_id, etat, compte_rendu) VALUES
(1, 1, 'CONFIRME', 'Ils viennent avec un gros stand de 100m2.'),
(1, 2, 'CONFIRME', 'Viennent pour présenter Quoridor.'),
(1, 3, 'DISCUSSION', 'Hésitent encore sur la surface, rappeler semaine prochaine.'),
(1, 4, 'PAS_CONTACTE', NULL),
(1, 5, 'REFUS', 'Pas de budget cette année.'),
(1, 6, 'CONTACTE', 'Message laissé sur répondeur.');

-- ===================================================================================
-- 5. RESERVATIONS (Commandes)
-- ===================================================================================

-- RÉSERVATION 1 : Asmodee (Confirmé et Facturé)
-- Il achète 4 tables en Zone Famille et 2 en Zone Expert.
INSERT INTO Reservation (festival_id, type, editeur_id, statut, nombre_prises, est_present, preferences_tables, remise_generale) VALUES
(1, 'Editeur', 1, 'FACTUREE', 3, true, 'Besoin d''être près de l''entrée principale.', 50.00); 
-- ID Résa = 1

-- Lignes de facture pour Asmodee
INSERT INTO LigneReservation (reservation_id, zone_tarifaire_id, type_emplacement, quantite, prix_unitaire_applique) VALUES
(1, 1, 'TABLE', 4, 50.00), -- 4 tables Famille
(1, 2, 'TABLE', 2, 70.00); -- 2 tables Expert

-- RÉSERVATION 2 : Gigamic (Confirmé mais pas encore facturé)
INSERT INTO Reservation (festival_id, type, editeur_id, statut, nombre_prises, est_present, preferences_tables) VALUES
(1, 'Editeur', 2, 'PRESENT', 1, true, 'Tables rondes si possible.'); 
-- ID Résa = 2

-- Lignes de facture pour Gigamic
INSERT INTO LigneReservation (reservation_id, zone_tarifaire_id, type_emplacement, quantite, prix_unitaire_applique) VALUES
(1, 2, 'TABLE', 2, 70.00); -- 2 tables Expert

-- RÉSERVATION 3 : Une Association locale (Pas un éditeur)
INSERT INTO Reservation (festival_id, type, autre_nom_reservant, statut, est_present) VALUES
(1, 'Association', 'Les Chevaliers du Dé', 'PRESENT', true);
-- ID Résa = 3

INSERT INTO LigneReservation (reservation_id, zone_tarifaire_id, type_emplacement, quantite, prix_unitaire_applique) VALUES
(3, 4, 'TABLE', 4, 20.00); -- 4 tables zone Proto/Asso

-- ===================================================================================
-- 6. JEUX RESERVES (Logistique / Installation)
-- ===================================================================================

-- Pour Asmodee (Résa 1)
-- Ils placent "Dobble" et "Jungle Speed"
INSERT INTO JeuReserve (reservation_id, jeu_id, zone_plan_id, type_table, tables_occupees, nb_exemplaires) VALUES
(1, 1, 1, 'PETITE', 1.0, 6), -- Dobble sur 1 Petite Table (Allée Centrale)
(1, 1, 1, 'PETITE', 1.0, 6), -- Une 2eme table de Dobble
(1, 2, 2, 'GRANDE', 1.0, 4); -- Jungle Speed sur 1 Grande Table (Coin Enfants)

-- Pour Gigamic (Résa 2)
-- Ils placent "Quoridor"
INSERT INTO JeuReserve (reservation_id, jeu_id, zone_plan_id, type_table, tables_occupees, nb_exemplaires) VALUES
(2, 3, 3, 'MAIRIE', 1.0, 2); -- Quoridor sur une table Mairie (Salle Tournoi)