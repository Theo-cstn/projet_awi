import { Router } from 'express';
import pool from '../db/database.js';
const router = Router();

// GET /jeux - Retrieve all games
router.get('/', async (_req, res) => {
  try {
    const games = await pool.query('SELECT * FROM "Jeu"');
    res.status(200).json(games.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// POST /jeux - Create a new game
router.post('/', async (req, res) => {
  try {
    const { editeur_id, nom, auteurs, type, age_min, age_max, duree_moyenne } = req.body;
    const result = await pool.query(
      'INSERT INTO "Jeu" (editeur_id, nom, auteurs, type, age_min, age_max, duree_moyenne) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [editeur_id, nom, auteurs, type, age_min, age_max, duree_moyenne]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// GET /jeux/:id - Retrieve a game by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const game = await pool.query('SELECT * FROM "Jeu" WHERE id = $1', [id]);
    if (game.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.status(200).json(game.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

// PUT /jeux/:id - Update a game
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, auteurs, type, age_min, age_max, duree_moyenne } = req.body;
    const result = await pool.query(
      'UPDATE "Jeu" SET nom = $1, auteurs = $2, type = $3, age_min = $4, age_max = $5, duree_moyenne = $6 WHERE id = $7 RETURNING *',
      [nom, auteurs, type, age_min, age_max, duree_moyenne, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update game' });
  }
});

// DELETE /jeux/:id - Delete a game
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM "Jeu" WHERE id = $1', [id]);
    res.status(200).json({ message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

export default router;