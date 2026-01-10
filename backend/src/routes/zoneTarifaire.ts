import { Router } from 'express';
import { requireOrganisateurReservations } from '../middleware/roles.js';
import pool from '../db/database.js';

const router = Router();

// ==============================================================================
// RÉCUPÉRATION DES ZONES TARIFAIRES D'UN FESTIVAL
// ==============================================================================
router.get('/festival/:festivalId', requireOrganisateurReservations(), async (req, res) => {
    const { festivalId } = req.params;
    
    try {
        const query = `
            SELECT 
                zt.id,
                zt.festival_id,
                zt.nom,
                zt.prixTable as "prixTable",
                zt.nbTotalTables as "nbTotalTables",
                -- Calculer le nombre de tables libres
                zt.nbTotalTables - COALESCE(
                    (SELECT SUM(lr.quantite) 
                     FROM LigneReservation lr 
                     JOIN Reservation r ON lr.reservation_id = r.id
                     WHERE lr.zone_tarifaire_id = zt.id
                       AND r.statut IN ('PRESENT', 'FACTUREE', 'PAYEE')), 
                    0
                ) as "nbTablesLibres",
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

// Créer une zone tarifaire
router.post('/', requireOrganisateurReservations(), async (req, res) => {
    const { festival_id, nom, prixTable, nbTotalTables, description, couleur } = req.body;
    
    try {
        const result = await pool.query(
            `INSERT INTO ZoneTarifaire (festival_id, nom, prixTable, nbTotalTables, description, couleur)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [festival_id, nom, prixTable, nbTotalTables, description, couleur]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Erreur création zone:', error);
        res.status(500).json({ error: 'Erreur création zone tarifaire' });
    }
});

// Mettre à jour une zone tarifaire
router.put('/:id', requireOrganisateurReservations(), async (req, res) => {
    const { id } = req.params;
    const { nom, prixTable, nbTotalTables, description, couleur } = req.body;
    
    try {
        const result = await pool.query(
            `UPDATE ZoneTarifaire 
             SET nom = $1, prixTable = $2, nbTotalTables = $3, description = $4, couleur = $5
             WHERE id = $6 RETURNING *`,
            [nom, prixTable, nbTotalTables, description, couleur, id]
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

// Supprimer une zone tarifaire
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