import { Router } from 'express';
import pool from '../db/database';

const router = Router();

// GET /editeurs - Retrieve all editors
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "Editeur"');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching editors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /editeurs - Add a new editor
router.post('/', async (req, res) => {
  const { nom, est_actif } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO "Editeur" (nom, est_actif) VALUES ($1, $2) RETURNING *',
      [nom, est_actif || true]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding editor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /editeurs/:id - Retrieve an editor by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM "Editeur" WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Editor not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching editor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /editeurs/:id - Update an editor
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nom, est_actif } = req.body;
  try {
    const result = await pool.query(
      'UPDATE "Editeur" SET nom = $1, est_actif = $2 WHERE id = $3 RETURNING *',
      [nom, est_actif, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Editor not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error updating editor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /editeurs/:id - Delete an editor
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM "Editeur" WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Editor not found' });
    }
    res.status(200).json({ message: 'Editor deleted successfully' });
  } catch (error) {
    console.error('Error deleting editor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;