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
        // Ne jamais renvoyer les mots de passe hashés !
        const result = await pool.query(`
            SELECT id, login, role, email, created_at, last_login 
            FROM Users 
            ORDER BY created_at DESC
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
        // req.user est défini par le middleware verifyToken
        const userId = (req as any).user.userId;
        const result = await pool.query(
            'SELECT id, login, role, email, created_at, last_login FROM Users WHERE id = $1',
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
    const { login, password, role, email } = req.body;
    
    if (!login || !password) {
        return res.status(400).json({ error: 'Login et mot de passe requis' });
    }
    
    try {
        // Hash du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.query(
            'INSERT INTO Users (login, password, role, email) VALUES ($1, $2, $3, $4) RETURNING id, login, role, email, created_at',
            [login, hashedPassword, role || 'visiteur', email]
        );
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Login ou email déjà utilisé' });
        }
        console.error(error);
        res.status(500).json({ error: 'Erreur création utilisateur' });
    }
});

// PUT /users/:id/role - Changer le rôle d'un utilisateur (Admin uniquement)
router.put('/:id/role', requireAdmin(), async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    
    const validRoles = ['no-role', 'visiteur', 'organisateur_jeux', 'organisateur_reservations', 'admin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Rôle invalide' });
    }
    
    try {
        const result = await pool.query(
            'UPDATE Users SET role = $1 WHERE id = $2 RETURNING id, login, role, email',
            [role, id]
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

// DELETE /users/:id - Supprimer un utilisateur (Admin uniquement)
router.delete('/:id', requireAdmin(), async (req, res) => {
    const { id } = req.params;
    
    // Empêcher la suppression du compte admin connecté
    const currentUserId = (req as any).user.userId;
    if (parseInt(id) === currentUserId) {
        return res.status(400).json({ error: 'Impossible de supprimer votre propre compte' });
    }
    
    try {
        const result = await pool.query('DELETE FROM Users WHERE id = $1 RETURNING login', [id]);
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