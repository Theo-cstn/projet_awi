import { Router } from 'express';
import {requireOrganisateurJeux } from '../middleware/roles.js';
import pool from '../db/database.js';

const router = Router();

// ==============================================================================
// ANNUAIRE PERSONNES (Admin uniquement)
// Utilisé pour : Auteurs de jeux, Contacts éditeurs, etc.
// ==============================================================================

// GET /personnes - Liste complète
router.get('/', requireOrganisateurJeux(), async (_req, res) => {
    try {
        const query = `
            SELECT 
                p.*,
                (SELECT COUNT(*) FROM Editeur_Contact ec WHERE ec.contact_id = p.id) as nb_editeurs,
                (SELECT COUNT(*) FROM Auteurs_Jeux aj WHERE aj.auteur_id = p.id) as nb_jeux
            FROM Personne p
            ORDER BY p.nom ASC, p.prenom ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur chargement personnes' });
    }
});

// POST /personnes - Créer une personne
router.post('/', requireOrganisateurJeux(), async (req, res) => {
    const { nom, prenom, email } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO Personne (nom, prenom, email) VALUES ($1, $2, $3) RETURNING *',
            [nom, prenom, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Email déjà utilisé' });
        }
        console.error(error);
        res.status(500).json({ error: 'Erreur création personne' });
    }
});

// PUT /personnes/:id - Modifier
router.put('/:id', requireOrganisateurJeux(), async (req, res) => {
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
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur modification personne' });
    }
});

// DELETE /personnes/:id - Supprimer (avec vérifications)
router.delete('/:id', requireOrganisateurJeux(), async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM Personne WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Personne non trouvée' });
        }
        res.json({ message: 'Personne supprimée' });
    } catch (error: any) {
        if (error.code === '23503') {
            return res.status(409).json({ error: 'Impossible de supprimer : personne liée à des éditeurs ou jeux' });
        }
        console.error(error);
        res.status(500).json({ error: 'Erreur suppression' });
    }
});

export default router;