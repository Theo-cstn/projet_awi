import { Router } from 'express';
import { requireVisiteur, requireAdmin } from '../middleware/roles.js';
import pool from '../db/database.js';

const router = Router();

// ==============================================================================
// FESTIVALS - CRUD
// ==============================================================================

// LECTURE : Historique complet (Passé/Présent/Futur) -> ADMIN SEULEMENT
router.get('/', requireAdmin(), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Festival ORDER BY date_debut DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// LECTURE : Festivals "Courants" (Actifs/Futurs) -> VISITEUR+
// Ce sont les espaces de travail pour les organisateurs.
router.get('/current', requireVisiteur(), async (req, res) => {
    try {
      // On prend tous les festivals qui ne sont pas encore finis (date_fin >= aujourd'hui)
      const result = await pool.query(`
        SELECT * FROM Festival 
        WHERE date_fin >= CURRENT_DATE 
        ORDER BY date_debut ASC
      `);
      res.json(result.rows); 
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ÉCRITURE : Création -> ADMIN SEULEMENT
router.post('/', requireAdmin(), async (req, res) => {
  const { nom, date_debut, date_fin, stock_tables_petites, stock_tables_grandes, stock_tables_mairie } = req.body;
  try {
    const query = `
      INSERT INTO Festival (nom, date_debut, date_fin, stock_tables_petites, stock_tables_grandes, stock_tables_mairie)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await pool.query(query, [nom, date_debut, date_fin, stock_tables_petites, stock_tables_grandes, stock_tables_mairie]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ÉCRITURE : Modification -> ADMIN SEULEMENT
router.put('/:id', requireAdmin(), async (req, res) => {
    const { id } = req.params;
    const { nom, date_debut, date_fin, stock_tables_petites, stock_tables_grandes, stock_tables_mairie } = req.body;
    try {
      const query = `
        UPDATE Festival 
        SET nom = $1, date_debut = $2, date_fin = $3, 
            stock_tables_petites = $4, stock_tables_grandes = $5, stock_tables_mairie = $6
        WHERE id = $7
        RETURNING *
      `;
      const result = await pool.query(query, [nom, date_debut, date_fin, stock_tables_petites, stock_tables_grandes, stock_tables_mairie, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Festival non trouvé' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ==============================================================================
// ZONES TARIFAIRES
// ==============================================================================

// LECTURE : Voir les zones d'un festival précis -> VISITEUR+
router.get('/:id/zones', requireVisiteur(), async (req, res) => {
    const { id } = req.params;
    try {
      const query = `
            SELECT 
                zt.id, zt.nom, zt.prix_table, zt.prix_m2,
                COALESCE(
                    json_agg(json_build_object('id', zp.id, 'nom', zp.nom, 'nombre_tables', zp.nombre_tables))
                    FILTER (WHERE zp.id IS NOT NULL), 
                    '[]'
                ) as salles
            FROM ZoneTarifaire zt
            LEFT JOIN ZonePlan zp ON zt.id = zp.zone_tarifaire_id
            WHERE zt.festival_id = $1
            GROUP BY zt.id
            ORDER BY zt.nom
      `;
      const result = await pool.query(query, [id]);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
});

// CONFIGURATION ZONES -> ADMIN SEULEMENT
router.post('/:id/zones', requireAdmin(), async (req, res) => {
    const { id } = req.params;
    const { nom, prix_table, prix_m2 } = req.body;
    try {
      const query = `
        INSERT INTO ZoneTarifaire (festival_id, nom, prix_table, prix_m2)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const result = await pool.query(query, [id, nom, prix_table, prix_m2]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
});

router.delete('/zones/:id', requireAdmin(), async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(`
        DELETE FROM ZoneTarifaire 
        WHERE id = $1 
        RETURNING *
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Zone tarifaire non trouvée' });
      }
      
      res.json({ message: 'Zone tarifaire supprimée', data: result.rows[0] });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
});

// CONFIGURATION SALLES -> ADMIN SEULEMENT
router.post('/zones/:id/salles', requireAdmin(), async (req, res) => {
    const { id } = req.params;
    const { nom, nombre_tables } = req.body;
    try {
      const query = `
        INSERT INTO ZonePlan (zone_tarifaire_id, nom, nombre_tables)
        VALUES ($1, $2, $3)
        RETURNING *
      `;
      const result = await pool.query(query, [id, nom, nombre_tables]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;