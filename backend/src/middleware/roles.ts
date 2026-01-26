import type { Response, NextFunction } from 'express'
import type { TokenPayload } from '../types/token-payload.js'


export type RoleType = 
  | 'no-role'
  | 'visiteur'
  | 'organisateur_jeux'
  | 'organisateur_reservations'
  | 'admin';

/**
 * Middleware d'autorisation basé sur les rôles
 * @param allowedRoles - Liste des rôles autorisés (admin est toujours inclus)
 */
export function authorize(allowedRoles: RoleType[]) {
  return (req: Express.Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' })
    }

    const userRole = req.user.role as RoleType
    
    // L'admin a toujours accès (privilège suprême)
    if (userRole === 'admin') {
      return next()
    }

    // Vérifier si le rôle de l'utilisateur est dans la liste autorisée
    if (allowedRoles.includes(userRole)) {
      return next()
    }

    return res.status(403).json({ 
      error: `Accès refusé. Rôles requis: ${allowedRoles.join(', ')}` 
    })
  }
}

/**
 * Middlewares spécialisés pour plus de lisibilité
 */
export const requireVisiteur = () => authorize(['visiteur', 'organisateur_jeux', 'organisateur_reservations']); // Tout le monde sauf no-role
export const requireOrganisateurJeux = () => authorize(['organisateur_jeux'])
export const requireOrganisateurReservations = () => authorize(['organisateur_reservations'])
export const requireAdmin = () => authorize(['admin'])