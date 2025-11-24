import { Router } from 'express';
import pool from '../db/database.js';
const router = Router();

// GET /editeurs - Retrieve all editors
router.get('/', async (_req, res) => {
  try {
    const editors = await pool.query('SELECT * FROM "Editeur"');
    res.status(200).json(editors.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch editors' });
  }
});

// POST /editeurs - Create a new editor
router.post('/', async (req, res) => {
  try {
    const { nom } = req.body;
    const result = await pool.query(
      'INSERT INTO "Editeur" (nom) VALUES ($1) RETURNING *',
      [nom]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create editor' });
  }
});

// GET /editeurs/:id - Retrieve an editor by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const editor = await pool.query('SELECT * FROM "Editeur" WHERE id = $1', [id]);
    if (editor.rows.length === 0) {
      return res.status(404).json({ error: 'Editor not found' });
    }
    res.status(200).json(editor.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch editor' });
  }
});

// PUT /editeurs/:id - Update an editor
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom } = req.body;
    const result = await pool.query(
      'UPDATE "Editeur" SET nom = $1 WHERE id = $2 RETURNING *',
      [nom, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Editor not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update editor' });
  }
});

// DELETE /editeurs/:id - Delete an editor
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM "Editeur" WHERE id = $1', [id]);
    res.status(200).json({ message: 'Editor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete editor' });
  }
});

export default router;