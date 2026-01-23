import { Router } from 'express';
import { requireVisiteur, requireAdmin } from '../middleware/roles.js';
import pool from '../db/database.js';

const router = Router();

// ==============================================================================
// 1. LECTURE GLOBALE
// ==============================================================================
router.get('/', requireVisiteur(), async (req, res) => {
  try {
    const userRole = req.user?.role;
    const canSeeHistory = userRole === 'admin' || userRole === 'organisateur_reservations';

    let sql = `
      SELECT 
        f.id AS festival_id, 
        f.nom AS festival_nom, 
        f.date_debut, 
        f.date_fin, 
        f.stock_tables_petites, 
        f.stock_tables_grandes, 
        f.stock_tables_mairie,
        COALESCE(
          json_agg(
            json_build_object(
              'id', zt.id,
              'nom', zt.nom,
              'prix_table', zt.prix_table,
              'prix_m2', zt.prix_m2,
              
              'nb_total_tables', (
                  SELECT COALESCE(SUM(zp.nombre_tables), 0)
                  FROM ZonePlan zp
                  WHERE zp.zone_tarifaire_id = zt.id
              ),

              'nb_tables_restantes', (
                  (SELECT COALESCE(SUM(zp.nombre_tables), 0) FROM ZonePlan zp WHERE zp.zone_tarifaire_id = zt.id)
                  -
                  (SELECT COALESCE(SUM(lr.quantite), 0) FROM LigneReservation lr WHERE lr.zone_tarifaire_id = zt.id AND lr.type_emplacement = 'TABLE')
              ),

              'zones_plan', (
                SELECT COALESCE(
                  json_agg(
                    json_build_object(
                      'id', zp.id,
                      'nom', zp.nom,
                      'nombre_tables', zp.nombre_tables
                    )
                  ), '[]'
                )
                FROM ZonePlan zp
                WHERE zp.zone_tarifaire_id = zt.id
              )
            )
          ) FILTER (WHERE zt.id IS NOT NULL), 
          '[]'
        ) AS zones_tarifaires
      FROM Festival f
      LEFT JOIN ZoneTarifaire zt ON zt.festival_id = f.id
    `;

    if (!canSeeHistory) {
      sql += ` WHERE f.date_fin >= CURRENT_DATE `;
    }

    sql += ` GROUP BY f.id `;
    sql += ` ORDER BY f.date_debut ${canSeeHistory ? 'DESC' : 'ASC'}`;

    const result = await pool.query(sql);
    res.json(result.rows);

  } catch (error) {
    console.error('Erreur récupération festivals :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==============================================================================
// 2. LECTURE UNITAIRE
// ==============================================================================
router.get('/:id', requireVisiteur(), async (req, res) => {
  const { id } = req.params;
  try {
    const sql = `
      SELECT 
        f.id AS festival_id, 
        f.nom AS festival_nom, 
        f.date_debut, 
        f.date_fin, 
        f.stock_tables_petites, 
        f.stock_tables_grandes, 
        f.stock_tables_mairie,
        COALESCE(
          json_agg(
            json_build_object(
              'id', zt.id,
              'nom', zt.nom,
              'prix_table', zt.prix_table,
              'prix_m2', zt.prix_m2,
              'nb_total_tables', (
                  SELECT COALESCE(SUM(zp.nombre_tables), 0)
                  FROM ZonePlan zp
                  WHERE zp.zone_tarifaire_id = zt.id
              ),

              'nb_tables_restantes', (
                  (SELECT COALESCE(SUM(zp.nombre_tables), 0)
                   FROM ZonePlan zp
                   WHERE zp.zone_tarifaire_id = zt.id)
                  -
                  (SELECT COALESCE(SUM(lr.quantite), 0)
                   FROM LigneReservation lr
                   WHERE lr.zone_tarifaire_id = zt.id 
                   AND lr.type_emplacement = 'TABLE')
              ),

              'zones_plan', (
                SELECT COALESCE(
                  json_agg(
                    json_build_object(
                      'id', zp.id,
                      'nom', zp.nom,
                      'nombre_tables', zp.nombre_tables
                    )
                  ), '[]'
                )
                FROM ZonePlan zp
                WHERE zp.zone_tarifaire_id = zt.id
              )
            )
          ) FILTER (WHERE zt.id IS NOT NULL), 
          '[]'
        ) AS zones_tarifaires
      FROM Festival f
      LEFT JOIN ZoneTarifaire zt ON zt.festival_id = f.id
      WHERE f.id = $1
      GROUP BY f.id
    `;
    const result = await pool.query(sql, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Festival non trouvé' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==============================================================================
// 3. LECTURE SPÉCIFIQUE (Pour les Réservations : Calcul des dispos)
// ==============================================================================
router.get('/:id/zones', requireVisiteur(), async (req, res) => {
    const { id } = req.params;
    try {
      const query = `
            SELECT 
                zt.id, zt.nom, zt.prix_table, zt.prix_m2,
                
                -- 1. Calcul Capacité Totale (Somme des tables des plans)
                COALESCE((
                    SELECT SUM(zp.nombre_tables) 
                    FROM ZonePlan zp 
                    WHERE zp.zone_tarifaire_id = zt.id
                ), 0)::INT as "nbTotalTables",

                -- 2. Calcul Tables Occupées (Ventes + Jeux placés)
                (
                    SELECT COALESCE(SUM(lr.quantite), 0) 
                    FROM LigneReservation lr 
                    WHERE lr.zone_tarifaire_id = zt.id AND lr.type_emplacement = 'TABLE'
                )::FLOAT as "nbTablesOccupees",

                -- 3. Liste des salles (Zones Plans)
                COALESCE(
                    json_agg(json_build_object('id', zp.id, 'nom', zp.nom, 'nombre_tables', zp.nombre_tables)) 
                    FILTER (WHERE zp.id IS NOT NULL), 
                    '[]'
                ) as "zonesPlan"
            FROM ZoneTarifaire zt
            LEFT JOIN ZonePlan zp ON zt.id = zp.zone_tarifaire_id
            WHERE zt.festival_id = $1
            GROUP BY zt.id
            ORDER BY zt.nom
      `;
      
      const result = await pool.query(query, [id]);
      
      // Calcul final en JS pour éviter les négatifs bizarres
      const zones = result.rows.map((z: any) => ({
          ...z,
          nbTablesLibres: Math.max(0, z.nbTotalTables - z.nbTablesOccupees)
      }));

      res.json(zones);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==============================================================================
// 4. ÉCRITURE (ADMIN SEULEMENT) - GESTION GLOBALE
// ==============================================================================

// POST : Création Festival + Zones + Plans (Deep Insert)
router.post('/', requireAdmin(), async (req, res) => {
  const { nom, date_debut, date_fin, nbTablesPetites, nbTablesGrandes, nbTablesMairie, zonesTarifaires } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Festival
    const fRes = await client.query(
      `INSERT INTO Festival (nom, date_debut, date_fin, stock_tables_petites, stock_tables_grandes, stock_tables_mairie)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [nom, date_debut, date_fin, nbTablesPetites || 0, nbTablesGrandes || 0, nbTablesMairie || 0]
    );
    const festivalId = fRes.rows[0].id;

    // 2. Zones & Plans
    if (zonesTarifaires && Array.isArray(zonesTarifaires)) {
      for (const zone of zonesTarifaires) {
        const zRes = await client.query(
          `INSERT INTO ZoneTarifaire (festival_id, nom, prix_table, prix_m2) 
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [festivalId, zone.nom, zone.prixTable, zone.prixM]
        );
        const zoneId = zRes.rows[0].id;

        if (zone.zonesPlan && Array.isArray(zone.zonesPlan)) {
          for (const plan of zone.zonesPlan) {
            await client.query(
              `INSERT INTO ZonePlan (zone_tarifaire_id, nom, nombre_tables) 
               VALUES ($1, $2, $3)`,
              [zoneId, plan.nom, plan.nbTables]
            );
          }
        }
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ message: "Festival créé", id: festivalId });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Erreur création festival' });
  } finally {
    client.release();
  }
});

// PUT : Modification Intelligente
router.put('/:id', requireAdmin(), async (req, res) => {
  const { id } = req.params;
  const { nom, date_debut, date_fin, stock_tables_petites, stock_tables_grandes, stock_tables_mairie, zonesTarifaires } = req.body;
  
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Update Festival
    const result = await client.query(
      `UPDATE Festival 
       SET nom = $1, date_debut = $2, date_fin = $3, 
           stock_tables_petites = $4, stock_tables_grandes = $5, stock_tables_mairie = $6
       WHERE id = $7 RETURNING *`,
      [nom, date_debut, date_fin, stock_tables_petites, stock_tables_grandes, stock_tables_mairie, id]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Festival non trouvé' });
    }

    // 2. Gestion des Zones
    if (zonesTarifaires && Array.isArray(zonesTarifaires)) {
        
        // A. Suppression (Sécurisée par le WHERE festival_id)
        const receivedZoneIds = zonesTarifaires
            .filter(z => z.id).map(z => z.id);

        if (receivedZoneIds.length > 0) {
            await client.query(
                `DELETE FROM ZoneTarifaire 
                 WHERE festival_id = $1 AND id NOT IN (${receivedZoneIds.join(',')})`,
                [id]
            );
        } else if (zonesTarifaires.length === 0) {
             await client.query('DELETE FROM ZoneTarifaire WHERE festival_id = $1', [id]);
        }

        // B. Traitement des Zones
        for (const zone of zonesTarifaires) {
            let currentZoneId = zone.id;
            let zoneExists = false;

            if (currentZoneId) {
                // Tenter l'UPDATE (Sécurisé avec festival_id)
                const updateZ = await client.query(
                    `UPDATE ZoneTarifaire 
                     SET nom = $1, prix_table = $2, prix_m2 = $3 
                     WHERE id = $4 AND festival_id = $5 RETURNING id`,
                    [zone.nom, zone.prixTable, zone.prixM, currentZoneId, id]
                );
                
                if (updateZ.rowCount && updateZ.rowCount > 0) {
                    zoneExists = true;
                }
            }

            // Si c'était un ID temporaire (frontend) ou si l'ID était introuvable -> INSERT
            if (!currentZoneId || !zoneExists) {
                const zRes = await client.query(
                    `INSERT INTO ZoneTarifaire (festival_id, nom, prix_table, prix_m2) 
                     VALUES ($1, $2, $3, $4) RETURNING id`,
                    [id, zone.nom, zone.prixTable, zone.prixM]
                );
                currentZoneId = zRes.rows[0].id;
            }

            // C. Gestion des Plans (Sous-zones)
            if (zone.zonesPlan && Array.isArray(zone.zonesPlan)) {
                
                // On récupère les vrais IDs de CETTE zone pour ne pas supprimer ceux des autres
                const dbPlansRes = await client.query('SELECT id FROM ZonePlan WHERE zone_tarifaire_id = $1', [currentZoneId]);
                const dbPlanIds = dbPlansRes.rows.map(r => r.id);
                
                const receivedPlanIds = zone.zonesPlan
                    .filter((p: any) => p.id)
                    .map((p: any) => p.id);

                const idsToDelete = dbPlanIds.filter(dbId => !receivedPlanIds.includes(dbId));

                if (idsToDelete.length > 0) {
                    await client.query(
                        `DELETE FROM ZonePlan WHERE id = ANY($1)`,
                        [idsToDelete]
                    );
                }

                // Upsert des Plans
                for (const plan of zone.zonesPlan) {
                    let planUpdated = false;
                    if (plan.id) {
                        const resUp = await client.query(
                            `UPDATE ZonePlan SET nom = $1, nombre_tables = $2 
                             WHERE id = $3 AND zone_tarifaire_id = $4`,
                            [plan.nom, plan.nbTables, plan.id, currentZoneId]
                        );
                        if (resUp.rowCount && resUp.rowCount > 0) planUpdated = true;
                    }

                    if (!plan.id || !planUpdated) {
                        await client.query(
                            `INSERT INTO ZonePlan (zone_tarifaire_id, nom, nombre_tables) 
                             VALUES ($1, $2, $3)`,
                            [currentZoneId, plan.nom, plan.nbTables]
                        );
                    }
                }
            }
        }
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);

  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.code === '23503') {
        return res.status(409).json({ 
            error: "Action impossible : Suppression bloquée car des réservations existent." 
        });
    }
    console.error(error);
    res.status(500).json({ error: 'Erreur modification festival' });
  } finally {
    client.release();
  }
});

// DELETE
router.delete('/:id', requireAdmin(), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM Festival WHERE id = $1', [id]);
    res.json({ message: 'Festival supprimé' });
  } catch (error) {
    // @ts-ignore
    if (error.code === '23503') return res.status(409).json({ error: "Impossible de supprimer : Des données sont liées à ce festival." });
    res.status(500).json({ error: 'Erreur suppression' });
  }
});

// ==============================================================================
// 5. HELPERS (Jeux & Editeurs)
// ==============================================================================
router.get('/:id/jeux', requireVisiteur(), async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `SELECT DISTINCT j.* FROM Jeu j INNER JOIN JeuReserve jr ON jr.jeu_id = j.id INNER JOIN Reservation r ON jr.reservation_id = r.id WHERE r.festival_id = $1 ORDER BY j.nom`;
        const result = await pool.query(sql, [id]);
        res.json(result.rows);
    } catch (e) { res.status(500).json({ error: 'Erreur' }); }
});

router.get('/:id/editeurs', requireVisiteur(), async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `SELECT DISTINCT e.* FROM Editeur e INNER JOIN Reservation r ON r.editeur_id = e.id WHERE r.festival_id = $1 ORDER BY e.nom`;
        const result = await pool.query(sql, [id]);
        res.json(result.rows);
    } catch (e) { res.status(500).json({ error: 'Erreur' }); }
});

export default router;