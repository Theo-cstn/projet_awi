import { Router } from 'express';
import { requireVisiteur, requireOrganisateurJeux } from '../middleware/roles.js';
import pool from '../db/database.js';

const router = Router();

// ==============================================================================
// LECTURE - Jeux COMPLETS (visiteurs+)
// ==============================================================================
// GET /jeux - Récupère les jeux COMPLETS AVEC leurs auteurs aggrégés
router.get('/', requireVisiteur(), async (_req, res) => {
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
      WHERE j.nom IS NOT NULL 
        AND j.editeur_id IS NOT NULL 
        AND j.typeG IS NOT NULL 
        AND j.age_min IS NOT NULL 
        AND j.age_max IS NOT NULL
      GROUP BY j.id, e.nom
      ORDER BY j.nom ASC
    `;
    const result = await pool.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur chargement jeux complets' });
  }
});

// ==============================================================================
// LECTURE - TOUS les jeux (orga_jeux+)
// ==============================================================================
// GET /jeux/all - Récupère TOUS les jeux (complets + incomplets)
router.get('/all', requireOrganisateurJeux(), async (_req, res) => {
  try {
    const query = `
      SELECT 
        j.id, j.nom, j.typeG, j.age_min, j.age_max, j.editeur_id, e.nom as nom_editeur,
        COALESCE(
          json_agg(json_build_object('id', p.id, 'nom', p.nom, 'prenom', p.prenom)) 
          FILTER (WHERE p.id IS NOT NULL), 
          '[]'
        ) as auteurs,
        CASE WHEN (j.nom IS NOT NULL AND j.editeur_id IS NOT NULL AND j.typeG IS NOT NULL AND j.age_min IS NOT NULL AND j.age_max IS NOT NULL)
             THEN true ELSE false END as est_complet
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
    res.status(500).json({ error: 'Erreur chargement tous les jeux' });
  }
});

// ==============================================================================
// ÉCRITURE - Création (orga_jeux+)
// ==============================================================================
// POST /jeux - Création avec transaction (Jeu + Liaison Auteurs)
router.post('/', requireOrganisateurJeux(), async (req, res) => {
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

// ==============================================================================
// ÉCRITURE - Modification (orga_jeux+)
// ==============================================================================
// PUT /jeux/:id - Modifier un jeu
router.put('/:id', requireOrganisateurJeux(), async (req, res) => {
  const { id } = req.params;
  const { editeur_id, nom, typeG, age_min, age_max, auteurs_ids } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // 1. Modifier le jeu
    const gameResult = await client.query(
      `UPDATE Jeu 
       SET editeur_id = $1, nom = $2, typeG = $3, age_min = $4, age_max = $5
       WHERE id = $6 
       RETURNING *`,
      [editeur_id, nom, typeG, age_min, age_max, id]
    );

    if (gameResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Jeu non trouvé' });
    }

    // 2. Recréer les liens auteurs
    await client.query('DELETE FROM Auteurs_Jeux WHERE jeu_id = $1', [id]);
    
    if (auteurs_ids && Array.isArray(auteurs_ids) && auteurs_ids.length > 0) {
      for (const auteurId of auteurs_ids) {
        await client.query(
          'INSERT INTO Auteurs_Jeux (jeu_id, auteur_id) VALUES ($1, $2)',
          [id, auteurId]
        );
      }
    }

    await client.query('COMMIT');
    res.json(gameResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Erreur modification jeu' });
  } finally {
    client.release();
  }
});

// ==============================================================================
// ÉCRITURE - Suppression (orga_jeux+)
// ==============================================================================
// DELETE /jeux/:id
router.delete('/:id', requireOrganisateurJeux(), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM Jeu WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Jeu non trouvé' });
    }
    
    res.status(200).json({ message: 'Jeu supprimé', data: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur suppression' });
  }
});

export default router;