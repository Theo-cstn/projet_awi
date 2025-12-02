import { Router } from 'express';
import pool from '../db/database.js';
const router = Router();

// GET /jeux - Récupère les jeux AVEC leurs auteurs aggrégés
router.get('/', async (_req, res) => {
  try {
    const query = `
      SELECT 
        j.id, j.nom, j.typeG, j.age_min, j.age_max, j.editeur_id, e.nom as nom_editeur,
        COALESCE(
          json_agg(json_build_object('id', p.id, 'nom', p.nom, 'prenom', p.prenom)) 
          FILTER (WHERE p.id IS NOT NULL), 
          '[]'
        ) as auteurs
      FROM Jeu j
      JOIN Editeur e ON j.editeur_id = e.id
      LEFT JOIN Auteurs_Jeux aj ON j.id = aj.jeu_id
      LEFT JOIN Personne p ON aj.auteur_id = p.id
      GROUP BY j.id, e.nom
      ORDER BY j.nom ASC
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur chargement jeux' });
  }
});

// POST /jeux - Création avec transaction (Jeu + Liaison Auteurs)
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    // auteurs_ids est un tableau d'IDs : [1, 5, 8]
    const { editeur_id, nom, typeG, age_min, age_max, auteurs_ids } = req.body;

    await client.query('BEGIN');

    // 1. Créer le jeu
    const gameResult = await client.query(
      `INSERT INTO Jeu (editeur_id, nom, typeG, age_min, age_max) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [editeur_id, nom, typeG, age_min, age_max]
    );
    const newGame = gameResult.rows[0];

    // 2. Créer les liens auteurs (si fournis)
    if (auteurs_ids && Array.isArray(auteurs_ids) && auteurs_ids.length > 0) {
        for (const auteurId of auteurs_ids) {
            await client.query(
                'INSERT INTO Auteurs_Jeux (jeu_id, auteur_id) VALUES ($1, $2)',
                [newGame.id, auteurId]
            );
        }
    }

    await client.query('COMMIT');
    res.status(201).json(newGame);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Erreur création jeu' });
  } finally {
    client.release();
  }
});

// DELETE /jeux/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Le ON DELETE CASCADE SQL nettoie les liens auteurs tout seul
    await pool.query('DELETE FROM Jeu WHERE id = $1', [id]);
    res.status(200).json({ message: 'Jeu supprimé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur suppression' });
  }
});

export default router;