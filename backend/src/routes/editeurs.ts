import { Router } from 'express';
import pool from '../db/database.js';

const router = Router();

// ==============================================================================
// GET /editeurs - Liste tous les éditeurs (Triés par nom)
// ==============================================================================
router.get('/', async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Editeur ORDER BY nom ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching editors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================================================
// GET /editeurs/:id/contacts - Récupère les contacts d'un éditeur
// ==============================================================================
router.get('/:id/contacts', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT p.id, p.nom, p.prenom, p.email, ec.poste, ec.est_contact_principal
      FROM Personne p
      JOIN Editeur_Contact ec ON p.id = ec.contact_id
      WHERE ec.editeur_id = $1
    `;
    const result = await pool.query(query, [id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching editor contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================================================
// POST /editeurs/:id/contacts - AJOUTER UN CONTACT (Upsert)
// ==============================================================================
router.post('/:id/contacts', async (req, res) => {
  const editeurId = req.params.id;
  const { nom, prenom, email, fonction, est_contact_principal } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'L\'email est obligatoire' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Gérer la Personne (Créer ou Récupérer + Mettre à jour)
    const personneQuery = `
      INSERT INTO Personne (nom, prenom, email)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) 
      DO UPDATE SET nom = EXCLUDED.nom, prenom = EXCLUDED.prenom
      RETURNING id;
    `;
    const personneResult = await client.query(personneQuery, [nom, prenom, email]);
    const personneId = personneResult.rows[0].id;

    // 2. Gérer le Lien avec l'éditeur
    const lienQuery = `
      INSERT INTO Editeur_Contact (editeur_id, contact_id, poste, est_contact_principal)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (editeur_id, contact_id) 
      DO UPDATE SET poste = EXCLUDED.poste, est_contact_principal = EXCLUDED.est_contact_principal
      RETURNING *;
    `;
    
    await client.query(lienQuery, [editeurId, personneId, fonction, est_contact_principal || false]);

    await client.query('COMMIT');
    
    res.status(201).json({ 
      message: 'Contact ajouté avec succès', 
      contact: { id: personneId, nom, prenom, email, poste: fonction } 
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du contact' });
  } finally {
    client.release();
  }
});

// ==============================================================================
// POST /editeurs - Création d'un éditeur
// ==============================================================================
router.post('/', async (req, res) => {
  const { nom } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Editeur (nom) VALUES ($1) RETURNING *',
      [nom]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding editor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================================================
// GET /editeurs/:id - Détail d'un éditeur
// ==============================================================================
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM Editeur WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Editor not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================================================
// PUT /editeurs/:id - Mise à jour d'un éditeur
// ==============================================================================
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nom } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Editeur SET nom = $1 WHERE id = $2 RETURNING *',
      [nom, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Editor not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ==============================================================================
// DELETE /editeurs/:id/contacts/:contactId - Supprimer un contact (Smart Delete)
// ==============================================================================
router.delete('/:id/contacts/:contactId', async (req, res) => {
  const { id, contactId } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. On coupe le lien avec cet éditeur
    await client.query(
      'DELETE FROM Editeur_Contact WHERE editeur_id = $1 AND contact_id = $2',
      [id, contactId]
    );

    // 2. VÉRIFICATION D'ORPHELIN
    const checkContact = await client.query(
      'SELECT 1 FROM Editeur_Contact WHERE contact_id = $1 LIMIT 1', 
      [contactId]
    );
    
    const checkAuteur = await client.query(
      'SELECT 1 FROM Auteurs_Jeux WHERE auteur_id = $1 LIMIT 1', 
      [contactId]
    );

    let message = 'Contact retiré de cet éditeur.';

    // 3. Si elle n'est nulle part ailleurs, on la supprime définitivement
    if (checkContact.rowCount === 0 && checkAuteur.rowCount === 0) {
      await client.query('DELETE FROM Personne WHERE id = $1', [contactId]);
      message += ' (Personne supprimée car orpheline).';
    }

    await client.query('COMMIT');
    res.status(200).json({ message });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
});

// ==============================================================================
// DELETE /editeurs/:id - Supprimer l'éditeur lui-même
// ==============================================================================
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Si des jeux ou réservations existent, le DELETE RESTRICT (SQL) bloquera automatiquement
    // et renverra une erreur, ce qui est le comportement voulu.
    const result = await pool.query('DELETE FROM Editeur WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Editor not found' });
    }
    res.status(200).json({ message: 'Editor deleted successfully' });
  } catch (error: any) {
    // Gestion spécifique de l'erreur RESTRICT (Foreign Key Violation)
    if (error.code === '23503') {
        return res.status(409).json({ error: "Impossible de supprimer cet éditeur car il est lié à des jeux ou des réservations." });
    }
    console.error('Error deleting editor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;