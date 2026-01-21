import { Router } from 'express';
import { requireAdmin, requireVisiteur } from '../middleware/roles.js';
import pool from '../db/database.js';
import bcrypt from 'bcryptjs'

const router = Router();

// ==============================================================================
// GESTION DES COMPTES UTILISATEURS
// ==============================================================================

// GET /users - Liste des utilisateurs (Admin uniquement)
router.get('/', requireAdmin(), async (_req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, login, role
            FROM users 
            ORDER BY id ASC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur chargement utilisateurs' });
    }
});

// GET /users/me - Profil de l'utilisateur connecté
router.get('/me', requireVisiteur(), async (req, res) => {
    try {
        const userId = req.user!.id;
        
        const result = await pool.query(
            'SELECT id, login, role FROM users WHERE id = $1',
            [userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur chargement profil' });
    }
});

// POST /users - Créer un utilisateur (Admin uniquement)
router.post('/', requireAdmin(), async (req, res) => {
    const { login, password, role } = req.body;
    
    if (!login || !password) {
        return res.status(400).json({ error: 'Login et mot de passe requis' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            `INSERT INTO users (login, password_hash, role) 
             VALUES ($1, $2, $3) 
             RETURNING id, login, role`,
            [login, hashedPassword, role || 'visiteur']
        );
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Login déjà utilisé' });
        }
        console.error(error);
        res.status(500).json({ error: 'Erreur création utilisateur' });
    }
});

// PUT /users/:id/role - Changer le rôle
router.put('/:id/role', requireAdmin(), async (req, res) => {
    const targetUserId = parseInt(req.params.id, 10);
    const { role } = req.body;

    if (req.user && req.user.id === targetUserId) {
        return res.status(403).json({ error: 'Modification de son propre rôle interdite' });
    }
    
    const validRoles = ['no-role', 'visiteur', 'organisateur_jeux', 'organisateur_reservations', 'admin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Rôle invalide' });
    }
    
    try {
        // CORRECTION : Retrait de l'email du RETURNING
        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, login, role',
            [role, targetUserId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur modification rôle' });
    }
});

// DELETE /users/:id - Supprimer un utilisateur
router.delete('/:id', requireAdmin(), async (req, res) => {
    const targetUserId = parseInt(req.params.id, 10);
    
    if (req.user && req.user.id === targetUserId) {
        return res.status(403).json({ error: 'Impossible de supprimer votre propre compte' });
    }
    
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING login', [targetUserId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }
        res.json({ message: `Utilisateur ${result.rows[0].login} supprimé` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erreur suppression utilisateur' });
    }
});

export default router;