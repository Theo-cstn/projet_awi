import { Router } from 'express';
import { requireOrganisateurReservations } from '../middleware/roles.js';
import pool from '../db/database.js';

console.log(">>> ZoneTarifaire router LOADED");

const router = Router();

// RÉCUPÉRATION DES ZONES TARIFAIRES D'UN FESTIVAL
router.get('/festival/:festivalId', requireOrganisateurReservations(), async (req, res) => {
    const { festivalId } = req.params;

    try {
        const query = `
            SELECT 
                zt.id,
                zt.festival_id,
                zt.nom,
                zt.prix_table AS "prixTable",
                zt.prix_m2 AS "prixM2",
                zt.description,
                zt.couleur
            FROM ZoneTarifaire zt
            WHERE zt.festival_id = $1
            ORDER BY zt.nom ASC
        `;

        const result = await pool.query(query, [festivalId]);
        res.json(result.rows);

    } catch (error) {
        console.error('Erreur chargement zones tarifaires:', error);
        res.status(500).json({ error: 'Erreur chargement zones tarifaires' });
    }
});

// CRÉATION D’UNE ZONE TARIFAIRE
router.post('/', requireOrganisateurReservations(), async (req, res) => {
    const { festival_id, nom, prixTable, prixM2, description, couleur } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO ZoneTarifaire (festival_id, nom, prix_table, prix_m2, description, couleur)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [festival_id, nom, prixTable, prixM2, description, couleur]
        );

        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Erreur création zone:', error);
        res.status(500).json({ error: 'Erreur création zone tarifaire' });
    }
});

// MISE À JOUR D’UNE ZONE TARIFAIRE
router.put('/:id', requireOrganisateurReservations(), async (req, res) => {
    const { id } = req.params;
    const { nom, prixTable, prixM2, description, couleur } = req.body;

    try {
        const result = await pool.query(
            `UPDATE ZoneTarifaire 
             SET nom = $1, prix_table = $2, prix_m2 = $3, description = $4, couleur = $5
             WHERE id = $6
             RETURNING *`,
            [nom, prixTable, prixM2, description, couleur, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Zone tarifaire introuvable' });
        }

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Erreur mise à jour zone:', error);
        res.status(500).json({ error: 'Erreur mise à jour zone tarifaire' });
    }
});

// SUPPRESSION D’UNE ZONE TARIFAIRE
router.delete('/:id', requireOrganisateurReservations(), async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query('DELETE FROM ZoneTarifaire WHERE id = $1', [id]);
        res.json({ message: 'Zone tarifaire supprimée' });

    } catch (error) {
        console.error('Erreur suppression zone:', error);
        res.status(500).json({ error: 'Erreur suppression zone tarifaire' });
    }
});

export default router;
