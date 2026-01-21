import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { fileURLToPath } from 'url';

// 1. CONFIGURATION
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data'); 
const OUTPUT_FILE = path.join(__dirname, '../../db/seed.sql');

const TYPE_MAPPING: Record<string, string> = {
    '1': 'Aventure',
    '2': 'Action',
    '3': 'Strategie',
    '4': 'Aventure',
    '5': 'Reflexion',
    '6': 'Strategie',
    '7': 'RPG'
};

const escapeSql = (str: string | undefined | null) => {
    if (!str) return '';
    // On échappe les apostrophes simples
    return str.replace(/'/g, "''").trim();
};

async function generateSeed() {
    console.log('🏭 Démarrage de la génération du seed.sql...');
    
    let sqlContent = `-- FICHIER GÉNÉRÉ AUTOMATIQUEMENT
-- Ce fichier contient des données nettoyées et dédoublonnées

-- 0. NETTOYAGE
TRUNCATE TABLE JeuReserve, LigneReservation, Reservation, SuiviEditeur, ZonePlan, ZoneTarifaire, Auteurs_Jeux, Jeu, Editeur_Contact, Personne, Editeur, Festival RESTART IDENTITY CASCADE;

-- 1. FESTIVALS & ZONES
INSERT INTO Festival (nom, date_debut, date_fin, stock_tables_petites, stock_tables_grandes, stock_tables_mairie) VALUES
('Festival du Jeu Montpellier 2025', '2025-05-15', '2025-05-18', 200, 100, 20),
('Festival d''Automne 2025', '2025-10-20', '2025-10-22', 100, 50, 10);

INSERT INTO ZoneTarifaire (festival_id, nom, prix_table, prix_m2) VALUES
(1, 'Zone Famille (Hall A)', 50.00, 10.00),
(1, 'Zone Expert (Hall B)', 70.00, 15.00),
(1, 'Espace Boutique', 100.00, 25.00),
(1, 'Zone Proto', 20.00, 5.00);

INSERT INTO ZonePlan (zone_tarifaire_id, nom, nombre_tables) VALUES
(1, 'Allée Centrale', 40),
(1, 'Coin Enfants', 30),
(2, 'Salle Tournoi', 50),
(3, 'Carré Vendeurs', 30),
(4, 'Espace Créateurs', 15);

-- 2. USERS
INSERT INTO Users (login, password_hash, role, email) VALUES
('admin', '$2b$10$C8.7...hash...exemple', 'admin', 'admin@festival.com');

`;

    // ---------------------------------------------------------
    // TRAITEMENT DES ÉDITEURS (Avec Dédoublonnage)
    // ---------------------------------------------------------
    console.log('📖 Lecture de editeur.csv...');
    const validEditorIds = new Set<string>(); // Pour vérifier les jeux plus tard
    const seenEditorNames = new Set<string>(); // Pour éviter l'erreur "Duplicate Key"
    
    try {
        const editeursCsv = fs.readFileSync(path.join(DATA_DIR, 'editeur.csv'), 'utf8');
        const editeurs = Papa.parse(editeursCsv, { header: true, skipEmptyLines: true }).data as any[];

        sqlContent += `\n-- 3. IMPORT ÉDITEURS\n`;
        sqlContent += `INSERT INTO Editeur (id, nom) VALUES\n`;

        const editeurValues = [];

        for (const e of editeurs) {
            const nomNettoye = escapeSql(e.libelleEditeur);
            
            // 1. Vérification doublon de nom (Ex: Ouimba Games)
            if (seenEditorNames.has(nomNettoye.toLowerCase())) {
                console.warn(`⚠️ Doublon détecté et ignoré : ${nomNettoye} (ID ${e.idEditeur})`);
                continue;
            }

            // 2. Ajout aux listes valides
            seenEditorNames.add(nomNettoye.toLowerCase());
            validEditorIds.add(e.idEditeur);

            editeurValues.push(`(${e.idEditeur}, '${nomNettoye}')`);
        }

        sqlContent += editeurValues.join(',\n') + ';\n';
        console.log(`✅ ${editeurValues.length} éditeurs valides conservés (sur ${editeurs.length}).`);

    } catch (e) {
        console.error("❌ Erreur lecture editeur.csv", e);
    }

    // ---------------------------------------------------------
    // TRAITEMENT DES JEUX (Avec vérification de clé étrangère)
    // ---------------------------------------------------------
    console.log('📖 Lecture de jeu.csv...');
    try {
        const jeuxCsv = fs.readFileSync(path.join(DATA_DIR, 'jeu.csv'), 'utf8');
        const jeux = Papa.parse(jeuxCsv, { header: true, skipEmptyLines: true }).data as any[];

        sqlContent += `\n-- 4. IMPORT JEUX\n`;
        sqlContent += `INSERT INTO Jeu (id, nom, editeur_id, typeG, age_min, age_max) VALUES\n`;

        const jeuValues = [];
        const seenJeuIds = new Set();

        for (const j of jeux) {
            const idEditeur = j.idEditeur;

            // 1. Vérification Clé Étrangère : Est-ce que l'éditeur existe ?
            // Si l'éditeur a été supprimé à l'étape d'avant (doublon) ou n'existe pas, on ignore le jeu.
            if (!validEditorIds.has(idEditeur)) {
                // console.warn(`⚠️ Jeu ignoré (Editeur ${idEditeur} inconnu) : ${j.libelleJeu}`);
                continue;
            }

            // 2. Vérification Doublon ID Jeu
            if (seenJeuIds.has(j.idJeu)) continue;
            seenJeuIds.add(j.idJeu);

            // 3. Mapping et Nettoyage
            const typeEnum = TYPE_MAPPING[j.idTypeJeu] || 'Aventure';
            const ageMin = parseInt(j.agemini) || 0;
            const ageMax = 99;

            jeuValues.push(
                `(${j.idJeu}, '${escapeSql(j.libelleJeu)}', ${idEditeur}, '${typeEnum}', ${ageMin}, ${ageMax})`
            );
        }

        sqlContent += jeuValues.join(',\n') + ';\n';
        console.log(`✅ ${jeuValues.length} jeux valides conservés (sur ${jeux.length}).`);

    } catch (e) {
        console.error("❌ Erreur lecture jeu.csv", e);
    }

    // ---------------------------------------------------------
    // RESET DES COMPTEURS
    // ---------------------------------------------------------
    sqlContent += `\n-- 5. RESET DES SÉQUENCES\n`;
    sqlContent += `SELECT setval('editeur_id_seq', COALESCE((SELECT MAX(id) FROM Editeur), 1));\n`;
    sqlContent += `SELECT setval('jeu_id_seq', COALESCE((SELECT MAX(id) FROM Jeu), 1));\n`;
    sqlContent += `SELECT setval('personne_id_seq', COALESCE((SELECT MAX(id) FROM Personne), 1));\n`;
    sqlContent += `SELECT setval('festival_id_seq', COALESCE((SELECT MAX(id) FROM Festival), 1));\n`;

    fs.writeFileSync(OUTPUT_FILE, sqlContent);
    console.log(`🎉 SUCCÈS ! Fichier généré : ${OUTPUT_FILE}`);
}

generateSeed();