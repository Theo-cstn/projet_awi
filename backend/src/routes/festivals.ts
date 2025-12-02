import { Router } from 'express';
import pool from '../db/database.js';

const router = Router();

// ==============================================================================
// FESTIVALS - CRUD
// ==============================================================================

// GET /festivals - Liste des festivals (du plus récent au plus vieux)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Festival ORDER BY date_debut DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /festivals/current - Récupère le festival "en cours" (le plus récent)
// Utile pour charger l'interface par défaut
router.get('/current', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM Festival ORDER BY date_debut DESC LIMIT 1');
      if (result.rows.length === 0) return res.status(404).json({ error: 'Aucun festival trouvé' });
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

// POST /festivals - Créer un nouveau festival
router.post('/', async (req, res) => {
  const { nom, date_debut, date_fin, stock_tables_petites, stock_tables_grandes, stock_tables_mairie } = req.body;
  try {
    const query = `
      INSERT INTO Festival (nom, date_debut, date_fin, stock_tables_petites, stock_tables_grandes, stock_tables_mairie)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await pool.query(query, [
        nom, date_debut, date_fin, 
        stock_tables_petites || 0, 
        stock_tables_grandes || 0, 
        stock_tables_mairie || 0
    ]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la création du festival' });
  }
});

// PUT /festivals/:id - Mettre à jour (ex: modifier le stock de tables)
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { nom, date_debut, date_fin, stock_tables_petites, stock_tables_grandes, stock_tables_mairie } = req.body;
    try {
      const query = `
        UPDATE Festival 
        SET nom=$1, date_debut=$2, date_fin=$3, stock_tables_petites=$4, stock_tables_grandes=$5, stock_tables_mairie=$6
        WHERE id=$7 RETURNING *
      `;
      const result = await pool.query(query, [nom, date_debut, date_fin, stock_tables_petites, stock_tables_grandes, stock_tables_mairie, id]);
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Erreur serveur' });
    }
  });

// ==============================================================================
// ZONES TARIFAIRES (Nested Routes)
// ==============================================================================

// GET /festivals/:id/zones - Récupère TOUTES les zones (Tarifaires + Plans imbriqués)
// C'est cette route qui servira à afficher ton onglet "Plan / Zones"
router.get('/:id/zones', async (req, res) => {
    const { id } = req.params;
    try {
        // On récupère les zones tarifaires et on imbrique les zones plans (salles) dedans
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
        res.status(500).json({ error: 'Erreur récupération zones' });
    }
});

// POST /festivals/:id/zones - Créer une Zone Tarifaire (ex: "Zone Famille")
router.post('/:id/zones', async (req, res) => {
    const { id } = req.params;
    const { nom, prix_table, prix_m2 } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO ZoneTarifaire (festival_id, nom, prix_table, prix_m2) VALUES ($1, $2, $3, $4) RETURNING *',
            [id, nom, prix_table, prix_m2]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erreur création zone tarifaire' });
    }
});

// DELETE /zones/:id - Supprimer une Zone Tarifaire
// Attention : CASCADE supprimera aussi les Salles et les Lignes de Réservation liées !
router.delete('/zones/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM ZoneTarifaire WHERE id = $1', [id]);
        res.json({ message: 'Zone tarifaire supprimée' });
    } catch (error) {
        res.status(500).json({ error: 'Erreur suppression' });
    }
});

// ==============================================================================
// ZONES PLANS (Salles physiques)
// ==============================================================================

// POST /zones/:id/salles - Ajouter une salle à une zone tarifaire existante
router.post('/zones/:id/salles', async (req, res) => {
    const { id } = req.params; // C'est l'ID de la ZoneTarifaire
    const { nom, nombre_tables } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO ZonePlan (zone_tarifaire_id, nom, nombre_tables) VALUES ($1, $2, $3) RETURNING *',
            [id, nom, nombre_tables]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Erreur création salle' });
    }
});

export default router;