import { Router } from 'express';
import { requireVisiteur, requireOrganisateurReservations } from '../middleware/roles.js';
import pool from '../db/database.js';

const router = Router();

// ==============================================================================
// 1. LECTURE PUBLIQUE (Visiteurs / App Mobile)
// Règle : Pas de prix, on veut juste savoir QUI vient et avec QUOI.
// ==============================================================================
router.get('/festival/:id/public', requireVisiteur(), async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                r.id, 
                -- On affiche le nom de l'éditeur OU le nom libre (asso/boutique)
                COALESCE(e.nom, r.autre_nom_reservant) as nom_reservant,
                r.type,
                r.est_present,
                -- On agrège la liste des jeux prévus pour cet exposant
                COALESCE(
                    json_agg(json_build_object('nom', j.nom, 'type', j.typeG, 'zone', zp.nom))
                    FILTER (WHERE j.id IS NOT NULL), 
                    '[]'
                ) as jeux_exposes
            FROM Reservation r
            LEFT JOIN Editeur e ON r.editeur_id = e.id
            LEFT JOIN JeuReserve jr ON r.id = jr.reservation_id
            LEFT JOIN Jeu j ON jr.jeu_id = j.id
            LEFT JOIN ZonePlan zp ON jr.zone_plan_id = zp.id
            WHERE r.festival_id = $1
              -- LOGIQUE METIER : On affiche dès que c'est confirmé (PRESENT), même si pas encore payé.
              AND r.statut IN ('PRESENT', 'FACTUREE', 'PAYEE')
            GROUP BY r.id, e.nom
            ORDER BY e.nom ASC
        `;
        const result = await pool.query(query, [id]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur chargement public' });
    }
});

// ==============================================================================
// 2. LECTURE GESTION (Organisateurs Résa + Admin)
// Règle : On voit tout (Prix, Statuts, Dates, Remises)
// ==============================================================================
router.get('/festival/:id', requireOrganisateurReservations(), async (req, res) => {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                r.*,
                COALESCE(e.nom, r.autre_nom_reservant) as nom_reservant,
                -- Calcul dynamique du total dû (Somme des lignes - Remise)
                (
                  SELECT COALESCE(SUM(quantite * prix_unitaire_applique), 0) 
                  FROM LigneReservation WHERE reservation_id = r.id
                ) - COALESCE(r.remise_generale, 0) as total_a_payer,
                -- Indicateur si des jeux sont déjà placés (Logistique commencée ?)
                (SELECT COUNT(*) FROM JeuReserve WHERE reservation_id = r.id) as nb_jeux
            FROM Reservation r
            LEFT JOIN Editeur e ON r.editeur_id = e.id
            WHERE r.festival_id = $1
            ORDER BY r.date_creation DESC
        `;
        const result = await pool.query(query, [id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Erreur chargement gestion' });
    }
});

// Détail complet d'une réservation (Pour l'écran d'édition / Facturation)
router.get('/:id/details', requireOrganisateurReservations(), async (req, res) => {
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

        // 3. Jeux installés (Step 2)
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
        res.status(500).json({ error: 'Erreur chargement détail' });
    }
});

// ==============================================================================
// 3. ÉCRITURE - STEP 1 : CRÉATION COMMERCIALE (Transaction)
// ==============================================================================
router.post('/', requireOrganisateurReservations(), async (req, res) => {
    const client = await pool.connect();
    try {
        const { 
            festival_id, type, editeur_id, autre_nom_reservant,
            nombre_prises, est_present, remise_generale, preferences_tables,
            lignes // Tableau de { zone_tarifaire_id, type_emplacement, quantite, prix_unitaire }
        } = req.body;

        await client.query('BEGIN');

        // A. Créer la réservation
        const resInsert = await client.query(
            `INSERT INTO Reservation 
            (festival_id, type, editeur_id, autre_nom_reservant, nombre_prises, est_present, remise_generale, preferences_tables, statut)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PRESENT')
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

        // C. Mettre à jour le CRM (Si c'est un éditeur, on le passe en CONFIRME)
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
// 4. ÉCRITURE - STEP 2 : LOGISTIQUE (Ajout de jeux)
// ==============================================================================
router.post('/:id/jeux', requireOrganisateurReservations(), async (req, res) => {
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

// Retirer un jeu de la logistique
router.delete('/jeux/:jeuReserveId', requireOrganisateurReservations(), async (req, res) => {
    const { jeuReserveId } = req.params;
    try {
        await pool.query('DELETE FROM JeuReserve WHERE id = $1', [jeuReserveId]);
        res.json({ message: 'Jeu retiré' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur suppression jeu' });
    }
});

// ==============================================================================
// 5. CYCLE DE VIE (Validation / Facturation / Paiement)
// ==============================================================================
router.put('/:id/statut', requireOrganisateurReservations(), async (req, res) => {
    const { id } = req.params;
    const { statut } = req.body; // 'FACTUREE', 'PAYEE'...
    
    // Mise à jour automatique des dates lors du changement de statut
    let dateColumn = '';
    if (statut === 'FACTUREE') dateColumn = ', date_facturation = NOW()';
    if (statut === 'PAYEE') dateColumn = ', date_paiement = NOW()';

    try {
        const query = `UPDATE Reservation SET statut = $1 ${dateColumn} WHERE id = $2 RETURNING *`;
        const result = await pool.query(query, [statut, id]);
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'Réservation non trouvée' });
        
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erreur changement statut' });
    }
});

// Suppression complète d'une réservation (Admin ou Orga Résa si erreur)
router.delete('/:id', requireOrganisateurReservations(), async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM Reservation WHERE id = $1', [id]);
        res.json({ message: 'Réservation supprimée' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur suppression' });
    }
});

export default router;