import { Router } from 'express';
import pool from '../db/database.js';

const router = Router();

// ==============================================================================
// GET /personnes - Liste ou Recherche (Pour l'autocomplétion)
// Utilisation : GET /personnes?q=Dupont
// ==============================================================================
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    let query = 'SELECT * FROM Personne';
    let params: any[] = [];

    if (q) {
      query += ' WHERE nom ILIKE $1 OR prenom ILIKE $1 OR email ILIKE $1';
      params.push(`%${q}%`);
    }

    query += ' ORDER BY nom ASC LIMIT 50'; // On limite pour la perf

    const result = await pool.query(query, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des personnes' });
  }
});

// ==============================================================================
// POST /personnes/contact - Route "Métier" pour le formulaire "Ajouter Contact"
// Crée la personne (si elle n'existe pas) ET crée le lien avec l'éditeur
// ==============================================================================
router.post('/contact', async (req, res) => {
  const { editeur_id, nom, prenom, email, fonction, est_contact_principal } = req.body;

  if (!email || !editeur_id) {
    return res.status(400).json({ error: 'Email et Editeur ID requis' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. GESTION DE LA PERSONNE (Upsert)
    // Si l'email existe -> On met à jour le nom/prénom et on récupère l'ID
    // Si l'email n'existe pas -> On crée
    const personneQuery = `
      INSERT INTO Personne (nom, prenom, email)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) 
      DO UPDATE SET nom = EXCLUDED.nom, prenom = EXCLUDED.prenom
      RETURNING id, nom, prenom, email;
    `;
    const personneResult = await client.query(personneQuery, [nom, prenom, email]);
    const personne = personneResult.rows[0];

    // 2. GESTION DU LIEN ÉDITEUR
    // On attache cette personne à l'éditeur avec son poste
    const lienQuery = `
      INSERT INTO Editeur_Contact (editeur_id, contact_id, poste, est_contact_principal)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (editeur_id, contact_id) 
      DO UPDATE SET poste = EXCLUDED.poste, est_contact_principal = EXCLUDED.est_contact_principal
      RETURNING *;
    `;
    
    await client.query(lienQuery, [editeur_id, personne.id, fonction, est_contact_principal || false]);

    await client.query('COMMIT');
    
    res.status(201).json({ 
      message: 'Contact ajouté avec succès', 
      personne: personne,
      poste: fonction 
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
// PUT /personnes/:id - Mettre à jour une fiche personne (Correction faute de frappe)
// ==============================================================================
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nom, prenom, email } = req.body;

  try {
    const result = await pool.query(
      'UPDATE Personne SET nom = $1, prenom = $2, email = $3 WHERE id = $4 RETURNING *',
      [nom, prenom, email, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Personne non trouvée' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
        return res.status(409).json({ error: "Cet email est déjà utilisé par quelqu'un d'autre." });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==============================================================================
// GET /personnes/:id - Détail d'une personne
// ==============================================================================
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM Personne WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Personne non trouvée' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;