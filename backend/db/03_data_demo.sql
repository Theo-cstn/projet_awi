-- ===================================================================================
-- SCÉNARIOS DE DÉMONSTRATION (À lancer APRÈS le gros seed.sql)
-- ===================================================================================

-- 1. CRÉATION DES HUMAINS (Avec IDs forcés pour la cohérence)
INSERT INTO Personne (id, nom, prenom, email) VALUES
(1, 'Cathala', 'Bruno', 'bruno.cathala@email.com'),
(2, 'Bauza', 'Antoine', 'antoine.bauza@email.com'),
(3, 'Dupont', 'Jean', 'jean.dupont@asmodee.com'),
(4, 'Martin', 'Sophie', 'sophie.m@gigamic.com'),
(5, 'Durand', 'Paul', 'paul.d@blueorange.com')
ON CONFLICT (id) DO NOTHING; -- Sécurité si on relance

-- 2. LIAISON ÉDITEURS <-> CONTACTS
-- Asmodee (100)
INSERT INTO Editeur_Contact (editeur_id, contact_id, poste, est_contact_principal) VALUES
(100, 3, 'Directeur Commercial', true); 

-- Gigamic (138)
INSERT INTO Editeur_Contact (editeur_id, contact_id, poste, est_contact_principal) VALUES
(138, 4, 'Responsable Events', true);

-- Blue Orange (104)
INSERT INTO Editeur_Contact (editeur_id, contact_id, poste, est_contact_principal) VALUES
(104, 5, 'Chef de Projet', true);

-- 3. LIAISON JEUX <-> AUTEURS
-- Queendomino (35) -> Bruno Cathala (1)
INSERT INTO Auteurs_Jeux (jeu_id, auteur_id) VALUES (35, 1);

-- 7 Wonders (ID 170 à vérifier dans votre CSV, sinon prenons un autre exemple sûr)
-- Attention : L'ID 170 doit exister dans Jeu. Si incertain, on commente :
-- INSERT INTO Auteurs_Jeux (jeu_id, auteur_id) VALUES (170, 2);

-- Kingdomino (392) -> Bruno Cathala (1)
INSERT INTO Auteurs_Jeux (jeu_id, auteur_id) VALUES (392, 1);

-- 4. SUIVI CRM (Correction Enum 'A_CONTACTER' -> 'PAS_CONTACTE' ou 'CONTACTE')
INSERT INTO SuiviEditeur (festival_id, editeur_id, etat, compte_rendu) VALUES
(1, 100, 'CONFIRME', 'Gros stand prévu, viennent avec Lorcana.'), -- Asmodee
(1, 138, 'CONTACTE', 'Message laissé sur répondeur le 12/04.'),   -- Gigamic
(1, 104, 'DISCUSSION', 'Hésitent entre 2 et 3 tables.'),          -- Blue Orange
(1, 146, 'REFUS', 'Pas de budget cette année.'),                  -- Iello
(1, 161, 'PAS_CONTACTE', NULL);                                   -- Ravensburger (Correction ici)

-- 5. RÉSERVATIONS

-- ASMODEE (100)
INSERT INTO Reservation (festival_id, type, editeur_id, statut, nombre_prises, est_present, preferences_tables, remise_generale) 
VALUES (1, 'Editeur', 100, 'FACTUREE', 3, true, 'Besoin de 200m2 minimum.', 100.00);

-- On récupère l'ID de la résa qu'on vient de créer pour les lignes suivantes
INSERT INTO LigneReservation (reservation_id, zone_tarifaire_id, type_emplacement, quantite, prix_moment_reservation) VALUES
((SELECT id FROM Reservation WHERE editeur_id = 100 AND festival_id = 1), 1, 'TABLE', 10, 50.00),
((SELECT id FROM Reservation WHERE editeur_id = 100 AND festival_id = 1), 2, 'TABLE', 5, 70.00);

-- PLACEMENT JEUX ASMODEE
INSERT INTO JeuReserve (reservation_id, jeu_id, zone_plan_id, type_table, tables_occupees, nb_exemplaires) VALUES
((SELECT id FROM Reservation WHERE editeur_id = 100 AND festival_id = 1), 288, 1, 'PETITE', 1.0, 10), -- Dobble (288)
((SELECT id FROM Reservation WHERE editeur_id = 100 AND festival_id = 1), 285, 1, 'PETITE', 1.0, 10); -- Jungle Speed (285)

-- BLUE ORANGE (104)
INSERT INTO Reservation (festival_id, type, editeur_id, statut, nombre_prises, est_present) 
VALUES (1, 'Editeur', 104, 'PRESENT', 1, true);

INSERT INTO LigneReservation (reservation_id, zone_tarifaire_id, type_emplacement, quantite, prix_moment_reservation) VALUES
((SELECT id FROM Reservation WHERE editeur_id = 104 AND festival_id = 1), 1, 'TABLE', 4, 50.00);

INSERT INTO JeuReserve (reservation_id, jeu_id, zone_plan_id, type_table, tables_occupees, nb_exemplaires) VALUES
((SELECT id FROM Reservation WHERE editeur_id = 104 AND festival_id = 1), 392, 1, 'GRANDE', 1.0, 4); -- Kingdomino (392)

-- 6. RESET FINAL DES SÉQUENCES (Pour repartir propre après nos IDs forcés 1,2,3,4,5)
SELECT setval('personne_id_seq', (SELECT MAX(id) FROM Personne));