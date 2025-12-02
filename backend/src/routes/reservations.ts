import { Router } from 'express';
import pool from '../db/database.js';

const router = Router();

// ==============================================================================
// LECTURE
// ==============================================================================

// GET /reservations/festival/:id - Liste des réservations pour un festival
router.get('/festival/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // On récupère le nom de l'éditeur OU le nom libre (ex: asso)
        const query = `
            SELECT 
                r.*,
                COALESCE(e.nom, r.autre_nom_reservant) as nom_reservant
            FROM Reservation r
            LEFT JOIN Editeur e ON r.editeur_id = e.id
            WHERE r.festival_id = $1
            ORDER BY r.date_creation DESC
        `;
        const result = await pool.query(query, [id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erreur chargement réservations' });
    }
});

// GET /reservations/:id/details - Récupère TOUT (Header + Lignes + Jeux)
router.get('/:id/details', async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Infos Générales
        const header = await pool.query(
            `SELECT r.*, COALESCE(e.nom, r.autre_nom_reservant) as nom_reservant 
             FROM Reservation r LEFT JOIN Editeur e ON r.editeur_id = e.id 
             WHERE r.id = $1`, [id]
        );
        
        if (header.rows.length === 0) return res.status(404).json({ error: 'Réservation introuvable' });

        // 2. Lignes de Facture (Step 1)
        const lignes = await pool.query(
            `SELECT lr.*, zt.nom as zone_nom 
             FROM LigneReservation lr 
             JOIN ZoneTarifaire zt ON lr.zone_tarifaire_id = zt.id 
             WHERE lr.reservation_id = $1`, [id]
        );

        // 3. Jeux réservés (Step 2 - Logistique)
        const jeux = await pool.query(
            `SELECT jr.*, j.nom as jeu_nom, zp.nom as salle_nom
             FROM JeuReserve jr
             JOIN Jeu j ON jr.jeu_id = j.id
             LEFT JOIN ZonePlan zp ON jr.zone_plan_id = zp.id
             WHERE jr.reservation_id = $1`, [id]
        );

        res.json({
            reservation: header.rows[0],
            lignes: lignes.rows,
            jeux: jeux.rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur chargement détail' });
    }
});

// ==============================================================================
// ÉCRITURE - STEP 1 : COMMERCIALE (Transaction)
// ==============================================================================

router.post('/', async (req, res) => {
    const client = await pool.connect();
    try {
        const { 
            festival_id, type, editeur_id, autre_nom_reservant, // Qui ?
            nombre_prises, est_present, remise_generale, preferences_tables, // Options
            lignes // Array de { zone_tarifaire_id, type_emplacement, quantite, prix_unitaire }
        } = req.body;

        await client.query('BEGIN');

        // A. Créer l'en-tête Reservation
        const resInsert = await client.query(
            `INSERT INTO Reservation 
            (festival_id, type, editeur_id, autre_nom_reservant, nombre_prises, est_present, remise_generale, preferences_tables, statut)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'EN_ATTENTE_VALIDATION')
            RETURNING id`,
            [festival_id, type, editeur_id, autre_nom_reservant, nombre_prises, est_present, remise_generale, preferences_tables]
        );
        const reservationId = resInsert.rows[0].id;

        // B. Insérer les lignes de facture
        if (lignes && lignes.length > 0) {
            for (const l of lignes) {
                await client.query(
                    `INSERT INTO LigneReservation (reservation_id, zone_tarifaire_id, type_emplacement, quantite, prix_unitaire_applique)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [reservationId, l.zone_tarifaire_id, l.type_emplacement, l.quantite, l.prix_unitaire_applique]
                );
            }
        }

        // C. Mettre à jour le CRM si c'est un éditeur (Passer en CONFIRME)
        if (type === 'Editeur' && editeur_id) {
            await client.query(
                `INSERT INTO SuiviEditeur (festival_id, editeur_id, etat) VALUES ($1, $2, 'CONFIRME')
                 ON CONFLICT (festival_id, editeur_id) DO UPDATE SET etat = 'CONFIRME'`,
                [festival_id, editeur_id]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Réservation créée', id: reservationId });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Erreur création réservation' });
    } finally {
        client.release();
    }
});

// ==============================================================================
// ÉCRITURE - STEP 2 : LOGISTIQUE (Ajout de jeux)
// ==============================================================================

// POST /reservations/:id/jeux - Ajouter un jeu à la réservation
router.post('/:id/jeux', async (req, res) => {
    const { id } = req.params;
    const { jeu_id, zone_plan_id, type_table, tables_occupees, nb_exemplaires } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO JeuReserve 
             (reservation_id, jeu_id, zone_plan_id, type_table, tables_occupees, nb_exemplaires)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [id, jeu_id, zone_plan_id, type_table || 'PETITE', tables_occupees || 1, nb_exemplaires || 1]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur ajout jeu' });
    }
});

// DELETE /reservations/jeux/:jeuReserveId - Retirer un jeu de la liste
router.delete('/jeux/:jeuReserveId', async (req, res) => {
    const { jeuReserveId } = req.params;
    try {
        await pool.query('DELETE FROM JeuReserve WHERE id = $1', [jeuReserveId]);
        res.json({ message: 'Jeu retiré' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur suppression jeu' });
    }
});

// ==============================================================================
// GESTION GLOBALE
// ==============================================================================

// PUT /reservations/:id/statut - Changer le statut (Validation, Facturation...)
router.put('/:id/statut', async (req, res) => {
    const { id } = req.params;
    const { statut } = req.body; // 'VALIDEE', 'FACTUREE', 'PAYEE'
    
    // On met à jour la date correspondante automatiquement
    let dateColumn = '';
    if (statut === 'VALIDEE') dateColumn = ', date_validation = NOW()';
    if (statut === 'FACTUREE') dateColumn = ', date_facturation = NOW()';
    if (statut === 'PAYEE') dateColumn = ', date_paiement = NOW()';

    try {
        const query = `UPDATE Reservation SET statut = $1 ${dateColumn} WHERE id = $2 RETURNING *`;
        const result = await pool.query(query, [statut, id]);
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erreur changement statut' });
    }
});

// DELETE /reservations/:id - Supprimer une réservation complète
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM Reservation WHERE id = $1', [id]);
        res.json({ message: 'Réservation supprimée' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur suppression' });
    }
});

export default router;