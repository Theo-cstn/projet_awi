import { Router } from 'express';
import { requireVisiteur, requireAdmin } from '../middleware/roles.js';
import pool from '../db/database.js';

const router = Router();

// ==============================================================================
// 1. LECTURE PUBLIQUE (Visiteurs+)
// ==============================================================================

// GET /editeurs - Liste tous les éditeurs (Triés par nom)
router.get('/', requireVisiteur(), async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM Editeur ORDER BY nom ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching editors:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /editeurs/:id - Un seul éditeur
router.get('/:id', requireVisiteur(), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM Editeur WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Éditeur non trouvé' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /editeurs/:id/contacts - Récupère les contacts d'un éditeur spécifique
router.get('/:id/contacts', requireVisiteur(), async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT p.id, p.nom, p.prenom, p.email, ec.poste, ec.est_contact_principal
      FROM Personne p
      JOIN Editeur_Contact ec ON p.id = ec.contact_id
      WHERE ec.editeur_id = $1
      ORDER BY ec.est_contact_principal DESC, p.nom ASC
    `;
    const result = await pool.query(query, [id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching editor contacts:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==============================================================================
// 2. ÉCRITURE ÉDITEUR (Admin Uniquement)
// ==============================================================================

// POST /editeurs - Création simple
router.post('/', requireAdmin(), async (req, res) => {
  const { nom } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO Editeur (nom) VALUES ($1) RETURNING *',
      [nom]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
        return res.status(409).json({ error: "Cet éditeur existe déjà." });
    }
    console.error('Error adding editor:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// PUT /editeurs/:id - Modifier le nom
router.put('/:id', requireAdmin(), async (req, res) => {
  const { id } = req.params;
  const { nom } = req.body;
  try {
    const result = await pool.query(
      'UPDATE Editeur SET nom = $1 WHERE id = $2 RETURNING *',
      [nom, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Éditeur non trouvé' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /editeurs/:id - Supprimer l'éditeur
router.delete('/:id', requireAdmin(), async (req, res) => {
  const { id } = req.params;
  try {
    // Le DELETE RESTRICT (SQL) bloquera si des jeux/réservations existent
    const result = await pool.query('DELETE FROM Editeur WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Éditeur non trouvé' });
    }
    res.status(200).json({ message: 'Éditeur supprimé avec succès' });
  } catch (error: any) {
    if (error.code === '23503') {
        return res.status(409).json({ error: "Impossible de supprimer : cet éditeur est lié à des jeux ou des réservations." });
    }
    console.error('Error deleting editor:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==============================================================================
// 3. GESTION DES CONTACTS (Admin Uniquement - Modification de l'éditeur)
// ==============================================================================

// POST /editeurs/:id/contacts - AJOUTER UN CONTACT (Upsert Intelligent)
router.post('/:id/contacts', requireAdmin(), async (req, res) => {
  const editeurId = req.params.id;
  const { nom, prenom, email, fonction, est_contact_principal } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'L\'email est obligatoire' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Gérer la Personne (Créer ou Récupérer + Mettre à jour si existe)
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
    res.status(500).json({ error: 'Erreur serveur lors de l\'ajout du contact' });
  } finally {
    client.release();
  }
});

// DELETE /editeurs/:id/contacts/:contactId - Supprimer un contact (Smart Delete)
router.delete('/:id/contacts/:contactId', requireAdmin(), async (req, res) => {
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
    // Est-ce que cette personne est liée à un AUTRE éditeur ?
    const checkContact = await client.query(
      'SELECT 1 FROM Editeur_Contact WHERE contact_id = $1 LIMIT 1', 
      [contactId]
    );
    
    // Est-ce que cette personne est liée à un JEU (Auteur) ?
    const checkAuteur = await client.query(
      'SELECT 1 FROM Auteurs_Jeux WHERE auteur_id = $1 LIMIT 1', 
      [contactId]
    );

    let message = 'Contact retiré de cet éditeur.';

    // 3. Si elle n'est nulle part ailleurs, on la supprime définitivement pour nettoyer la base
    if (checkContact.rowCount === 0 && checkAuteur.rowCount === 0) {
      await client.query('DELETE FROM Personne WHERE id = $1', [contactId]);
      message += ' (Fiche personne supprimée car orpheline).';
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

export default router;