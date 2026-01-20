import { Router } from 'express';
import { requireOrganisateurReservations, requireVisiteur } from '../middleware/roles.js';
import pool from '../db/database.js';

const router = Router();

// RÉCUPÉRATION DES ZONES TARIFAIRES D'UN FESTIVAL
router.get('/festival/:festivalId', requireOrganisateurReservations(), async (req, res) => {
    const { festivalId } = req.params;

    try {
        const query = `
            SELECT 
                zt.id,
                zt.festival_id,
                zt.nom,
                zt.prix_table as "prixTable",
                zt.prix_m2 as "prixM",
                COALESCE(SUM(zp.nombre_tables), 0)::INT as "nbTotalTables",
                (
                    COALESCE(SUM(zp.nombre_tables), 0) - 
                    COALESCE((
                        SELECT CAST(SUM(jr.tables_occupees * jr.nb_exemplaires) AS INTEGER)
                        FROM JeuReserve jr
                        JOIN ZonePlan zp2 ON zp2.id = jr.zone_plan_id
                        WHERE zp2.zone_tarifaire_id = zt.id
                    ), 0) -
                    COALESCE((
                        SELECT CAST(SUM(lr.quantite) AS INTEGER)
                        FROM LigneReservation lr
                        WHERE lr.zone_tarifaire_id = zt.id
                    ), 0)
                )::INT as "nbTablesLibres",
                json_agg(json_build_object(
                    'id', zp.id,
                    'nom', zp.nom,
                    'nbTables', zp.nombre_tables
                )) FILTER (WHERE zp.id IS NOT NULL) as "zonesPlan"
            FROM ZoneTarifaire zt
            LEFT JOIN ZonePlan zp ON zp.zone_tarifaire_id = zt.id
            WHERE zt.festival_id = $1
            GROUP BY zt.id, zt.festival_id, zt.nom, zt.prix_table, zt.prix_m2
            ORDER BY zt.nom ASC
        `;

        const result = await pool.query(query, [festivalId]);
        console.log('✅ Résultat SQL:', result.rows);  // ← Ajoutez ça
        
        res.json(result.rows);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('❌ Erreur recupération zone:', errorMessage);
        
        res.status(500).json({ 
            error: 'Erreur récuperation zone tarifaire',
            details: errorMessage
        });
    }
});

// CRÉATION D'UNE ZONE TARIFAIRE
router.post('/', requireOrganisateurReservations(), async (req, res) => {
    const { festival_id, nom, prixTable, prixM2 } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO ZoneTarifaire (festival_id, nom, prix_table, prix_m2)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [festival_id, nom, prixTable, prixM2]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('❌ Erreur création zone:', errorMessage);
        
        res.status(500).json({ 
            error: 'Erreur création zone tarifaire',
            details: errorMessage
        });
    }
});

// MISE À JOUR D'UNE ZONE TARIFAIRE
router.put('/:id', requireOrganisateurReservations(), async (req, res) => {
    const { id } = req.params;
    const { nom, prixTable, prixM2 } = req.body;

    try {
        const result = await pool.query(
            `UPDATE ZoneTarifaire 
             SET nom = $1, prix_table = $2, prix_m2 = $3
             WHERE id = $4
             RETURNING *`,
            [nom, prixTable, prixM2, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Zone tarifaire introuvable' });
        }

        res.json(result.rows[0]);

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('❌ Erreur mise à jour zone:', errorMessage);
        
        res.status(500).json({ 
            error: 'Erreur mise à jour zone tarifaire',
            details: errorMessage
        });
    }
});

// SUPPRESSION D'UNE ZONE TARIFAIRE
router.delete('/:id', requireOrganisateurReservations(), async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM ZoneTarifaire WHERE id = $1', [id]);
        res.json({ message: 'Zone tarifaire supprimée' });

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('❌ Erreur suppression zone:', errorMessage);
        
        res.status(500).json({ 
            error: 'Erreur suppression zone tarifaire',
            details: errorMessage
        });
    }
});

// test 

/**
 * GET /api/zone-tarifaire/festival/:id
 * Retourne toutes les zones tarifaires + calcul du nombre de tables libres
 */
router.get('/festival/:id', requireVisiteur(), async (req, res) => {
    const { id } = req.params;
    
    try {
        const query = `
            SELECT 
                zt.id,
                zt.nom,
                zt.festival_id,
                zt.prix_table,
                zt.prix_m2,
                -- Total de tables disponibles dans cette zone (somme des ZonePlan)
                COALESCE(SUM(zp.nombre_tables), 0) as nb_total_tables,
                -- Tables réservées = somme des quantités dans LigneReservation
                COALESCE(
                    (SELECT SUM(lr.quantite) 
                     FROM LigneReservation lr 
                     WHERE lr.zone_tarifaire_id = zt.id),
                    0
                ) as nb_tables_reservees,
                -- Tables libres = Total - Réservées
                COALESCE(SUM(zp.nombre_tables), 0) -
                COALESCE(
                    (SELECT SUM(lr.quantite) 
                     FROM LigneReservation lr 
                     WHERE lr.zone_tarifaire_id = zt.id),
                    0
                ) as nb_tables_libres,
                -- Récupère les zones de placement
                json_agg(json_build_object('id', zp.id, 'nom', zp.nom, 'nombreTables', zp.nombre_tables))
                FILTER (WHERE zp.id IS NOT NULL) as zones_plan
            FROM ZoneTarifaire zt
            LEFT JOIN ZonePlan zp ON zt.id = zp.zone_tarifaire_id
            WHERE zt.festival_id = $1
            GROUP BY zt.id, zt.nom, zt.festival_id, zt.prix_table, zt.prix_m2
            ORDER BY zt.nom ASC
        `;
        
        const result = await pool.query(query, [id]);
        
        // DEBUG : Log les résultats
        console.log('🔍 Zones tarifaires chargées :', JSON.stringify(result.rows, null, 2));
        
        res.json(result.rows);
        
    } catch (error) {
        console.error('❌ Erreur chargement zones tarifaires:', error);
        res.status(500).json({ error: 'Erreur chargement zones tarifaires' });
    }
});

/**
 * Optionnel : Une route pour obtenir les détails d'une zone spécifique
 */
router.get('/:id', requireVisiteur(), async (req, res) => {
    const { id } = req.params;
    
    try {
        const query = `
            SELECT 
                zt.id,
                zt.nom,
                zt.festival_id,
                zt.prix_table,
                zt.prix_m2,
                COALESCE(SUM(zp.nombre_tables), 0) as nb_total_tables,
                COALESCE(
                    (SELECT SUM(lr.quantite) 
                     FROM LigneReservation lr 
                     WHERE lr.zone_tarifaire_id = zt.id),
                    0
                ) as nb_tables_reservees,
                COALESCE(SUM(zp.nombre_tables), 0) -
                COALESCE(
                    (SELECT SUM(lr.quantite) 
                     FROM LigneReservation lr 
                     WHERE lr.zone_tarifaire_id = zt.id),
                    0
                ) as nb_tables_libres,
                json_agg(json_build_object('id', zp.id, 'nom', zp.nom, 'nombreTables', zp.nombre_tables))
                FILTER (WHERE zp.id IS NOT NULL) as zones_plan
            FROM ZoneTarifaire zt
            LEFT JOIN ZonePlan zp ON zt.id = zp.zone_tarifaire_id
            WHERE zt.id = $1
            GROUP BY zt.id, zt.nom, zt.festival_id, zt.prix_table, zt.prix_m2
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Zone tarifaire non trouvée' });
        }
        
        res.json(result.rows[0]);
        
    } catch (error) {
        console.error('❌ Erreur chargement zone:', error);
        res.status(500).json({ error: 'Erreur chargement zone' });
    }
});


export default router;