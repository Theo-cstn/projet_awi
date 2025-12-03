import { Router } from 'express';
import { requireOrganisateurReservations } from '../middleware/roles.js';
import pool from '../db/database.js';

const router = Router();

// ==============================================================================
// 1. DASHBOARD CRM (Vue Globale par Festival)
// Règle : Accessible aux Orga Résa (et Admin)
// ==============================================================================
router.get('/:festivalId', requireOrganisateurReservations(), async (req, res) => {
    const { festivalId } = req.params;
    try {
        // On part de la table EDITEUR (pour les avoir tous)
        // On fait un LEFT JOIN sur SUIVI pour ce festival précis
        const query = `
            SELECT 
                e.id as editeur_id, 
                e.nom as editeur_nom, 
                
                -- Si pas de ligne de suivi, on renvoie 'PAS_CONTACTE' par défaut
                COALESCE(s.etat, 'PAS_CONTACTE') as etat,
                
                s.compte_rendu,
                
                -- Infos sur le responsable (si assigné)
                u.id as responsable_id,
                u.login as responsable_nom,

                -- Bonus : Combien de jeux ont-ils dans notre base ?
                -- Utile pour savoir si c'est un "gros" éditeur à prioriser
                (SELECT COUNT(*) FROM Jeu j WHERE j.editeur_id = e.id) as nb_jeux
            
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

// ==============================================================================
// 2. MISE À JOUR (Action de prospection)
// Règle : Orga Résa
// ==============================================================================
router.post('/', requireOrganisateurReservations(), async (req, res) => {
    // responsable_id est optionnel (on peut assigner quelqu'un ou laisser vide)
    const { festival_id, editeur_id, etat, compte_rendu, responsable_id } = req.body;
    
    try {
        // UPSERT : "Insère, et si ça existe déjà (conflit sur la clé primaire), mets à jour"
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
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur sauvegarde suivi' });
    }
});

export default router;