import { Router } from 'express';
import pool from '../db/database.js';
const router = Router();

// GET /contacts - Retrieve all contacts
router.get('/', async (_req, res) => {
  try {
    const contacts = await pool.query('SELECT * FROM "Contact"');
    res.status(200).json(contacts.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// POST /contacts - Create a new contact
router.post('/', async (req, res) => {
  try {
    const { editeur_id, nom, prenom, email, telephone, est_principal } = req.body;
    const result = await pool.query(
      'INSERT INTO "Contact" (editeur_id, nom, prenom, email, telephone, est_principal) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [editeur_id, nom, prenom, email, telephone, est_principal]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// GET /contacts/:id - Retrieve a contact by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await pool.query('SELECT * FROM "Contact" WHERE id = $1', [id]);
    if (contact.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.status(200).json(contact.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// PUT /contacts/:id - Update a contact
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, telephone, est_principal } = req.body;
    const result = await pool.query(
      'UPDATE "Contact" SET nom = $1, prenom = $2, email = $3, telephone = $4, est_principal = $5 WHERE id = $6 RETURNING *',
      [nom, prenom, email, telephone, est_principal, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// DELETE /contacts/:id - Delete a contact
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM "Contact" WHERE id = $1', [id]);
    res.status(200).json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

export default router;