import { Router } from 'express';
import pool from '../db/database.js';

const router = Router();

// GET /suivi/:festivalId - Tableau de bord CRM pour un festival
// Liste TOUS les éditeurs et leur statut pour ce festival (même s'ils n'ont pas encore été contactés)
router.get('/:festivalId', async (req, res) => {
    const { festivalId } = req.params;
    try {
        const query = `
            SELECT 
                e.id as editeur_id, 
                e.nom, 
                s.etat, 
                s.compte_rendu,
                u.login as responsable_nom
            FROM Editeur e
            LEFT JOIN SuiviEditeur s ON e.id = s.editeur_id AND s.festival_id = $1
            LEFT JOIN Users u ON s.responsable_id = u.id
            ORDER BY e.nom ASC
        `;
        const result = await pool.query(query, [festivalId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur chargement suivi' });
    }
});

// POST /suivi - Mettre à jour le statut d'un éditeur (Upsert)
router.post('/', async (req, res) => {
    const { festival_id, editeur_id, etat, compte_rendu, responsable_id } = req.body;
    
    try {
        const query = `
            INSERT INTO SuiviEditeur (festival_id, editeur_id, etat, compte_rendu, responsable_id)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (festival_id, editeur_id)
            DO UPDATE SET 
                etat = EXCLUDED.etat,
                compte_rendu = EXCLUDED.compte_rendu,
                responsable_id = EXCLUDED.responsable_id
            RETURNING *
        `;
        const result = await pool.query(query, [festival_id, editeur_id, etat, compte_rendu, responsable_id]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur mise à jour suivi' });
    }
});

export default router;