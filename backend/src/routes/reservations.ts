import { Router } from 'express';
import { requireVisiteur, requireOrganisateurReservations } from '../middleware/roles.js';
import pool from '../db/database.js';

const router = Router();

export enum TailleTable {
    PETITE = 'PETITE',
    GRANDE = 'GRANDE',
    MAIRIE = 'MAIRIE'
}

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
            lignes, // Tableau de { zone_tarifaire_id, type_emplacement, quantite, prix_unitaire }
            jeux // Tableau de { jeu_id, nb_exemplaires, type_table, tables_occupees, zone_plan_id }
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

        // B. Insérer les lignes de facture (Argent)
        if (lignes && lignes.length > 0) {
            for (const l of lignes) {
                await client.query(
                    `INSERT INTO LigneReservation (reservation_id, zone_tarifaire_id, type_emplacement, quantite, prix_unitaire_applique)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [reservationId, l.zone_tarifaire_id, l.type_emplacement, l.quantite, l.prix_unitaire_applique]
                );
            }
        }

        // C. Insérer les jeux (Contenu)
        if (jeux && Array.isArray(jeux) && jeux.length > 0) {
            for (const j of jeux) {
                // On insère le jeu. Note : zone_plan_id est souvent NULL à la création (car pas encore placé)
                await client.query(
                    `INSERT INTO JeuReserve 
                    (reservation_id, jeu_id, nb_exemplaires, type_table, tables_occupees, zone_plan_id)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        reservationId, 
                        j.jeu_id, 
                        j.nb_exemplaires || 1, 
                        j.type_table || TailleTable.PETITE, 
                        j.tables_occupees || 1,
                        j.zone_plan_id || null // Optionnel à la création
                    ]
                );
            }
        }

        // D. Mettre à jour le CRM (Si c'est un éditeur, on le passe en CONFIRME)
        if (type === 'Editeur' && editeur_id) {
            await client.query(
                `INSERT INTO SuiviEditeur (festival_id, editeur_id, etat) VALUES ($1, $2, 'CONFIRME')
                 ON CONFLICT (festival_id, editeur_id) DO UPDATE SET etat = 'CONFIRME'`,
                [festival_id, editeur_id]
            );
        }

        await client.query('COMMIT');
        res.status(201).json({ message: 'Réservation créée avec succès', id: reservationId });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Erreur création réservation:", error);
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
            [id, jeu_id, zone_plan_id, type_table || TailleTable.PETITE, tables_occupees || 1, nb_exemplaires || 1]
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


// ==============================================================================
// 6. MISE À JOUR INTELLIGENTE (CRM -> LOGISTIQUE)
// Permet de modifier les lignes (facturation) ET les jeux (placement) à tout moment
// ==============================================================================
router.put('/:id', requireOrganisateurReservations(), async (req, res) => {
    const { id } = req.params;
    const { 
        nombre_prises, est_present, remise_generale, preferences_tables,
        lignes, // Tableau complet des lignes tarifaires
        jeux    // Tableau complet des jeux
    } = req.body;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // A. Mise à jour de l'en-tête (Infos globales)
        await client.query(
            `UPDATE Reservation 
             SET nombre_prises = $1, est_present = $2, remise_generale = $3, preferences_tables = $4
             WHERE id = $5`,
            [nombre_prises, est_present, remise_generale, preferences_tables, id]
        );

        // B. Gestion Intelligente des Lignes Tarifaires (Facturation)
        if (lignes) {
            // 1. Récupérer les IDs reçus pour savoir quoi garder
            const receivedLigneIds = lignes.filter((l: any) => l.id).map((l: any) => l.id);
            
            // 2. Supprimer les lignes qui ne sont plus dans la liste
            if (receivedLigneIds.length > 0) {
                await client.query(`DELETE FROM LigneReservation WHERE reservation_id = $1 AND id NOT IN (${receivedLigneIds.join(',')})`, [id]);
            } else {
                await client.query(`DELETE FROM LigneReservation WHERE reservation_id = $1`, [id]);
            }

            // 3. Upsert (Update ou Insert)
            for (const l of lignes) {
                if (l.id) {
                    await client.query(
                        `UPDATE LigneReservation SET zone_tarifaire_id = $1, quantite = $2, prix_unitaire_applique = $3 WHERE id = $4`,
                        [l.zone_tarifaire_id, l.quantite, l.prix_unitaire_applique, l.id]
                    );
                } else {
                    await client.query(
                        `INSERT INTO LigneReservation (reservation_id, zone_tarifaire_id, type_emplacement, quantite, prix_unitaire_applique)
                         VALUES ($1, $2, 'TABLE', $3, $4)`, // On force 'TABLE' pour l'instant
                        [id, l.zone_tarifaire_id, l.quantite, l.prix_unitaire_applique]
                    );
                }
            }
        }

        // C. Gestion Intelligente des Jeux (Placement)
        if (jeux) {
            const receivedJeuIds = jeux.filter((j: any) => j.id).map((j: any) => j.id);

            // 1. Suppression
            if (receivedJeuIds.length > 0) {
                await client.query(`DELETE FROM JeuReserve WHERE reservation_id = $1 AND id NOT IN (${receivedJeuIds.join(',')})`, [id]);
            } else {
                await client.query(`DELETE FROM JeuReserve WHERE reservation_id = $1`, [id]);
            }

            // 2. Upsert
            for (const j of jeux) {
                if (j.id) {
                    // Update : On peut changer le placement (zone_plan_id) ici !
                    await client.query(
                        `UPDATE JeuReserve 
                         SET jeu_id = $1, nb_exemplaires = $2, tables_occupees = $3, zone_plan_id = $4 
                         WHERE id = $5`,
                        [j.jeu_id, j.nb_exemplaires, j.tables_occupees, j.zone_plan_id || null, j.id]
                    );
                } else {
                    // Insert
                    await client.query(
                        `INSERT INTO JeuReserve (reservation_id, jeu_id, nb_exemplaires, tables_occupees, type_table, zone_plan_id)
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [id, j.jeu_id, j.nb_exemplaires, j.tables_occupees, TailleTable.PETITE, j.zone_plan_id || null]
                    );
                }
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Réservation mise à jour', id });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Erreur update réservation:", error);
        res.status(500).json({ error: 'Erreur mise à jour' });
    } finally {
        client.release();
    }
});

export default router;