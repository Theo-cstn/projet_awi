import type { Response, NextFunction } from 'express'
import type { TokenPayload } from '../types/token-payload.js'


// Hiérarchie des rôles (du plus faible au plus fort)
const ROLE_HIERARCHY = {
  'no-role': 0,
  'visiteur': 1,
  'organisateur_jeux': 2,
  'organisateur_reservations': 3,
  'admin': 4
} as const

type RoleType = keyof typeof ROLE_HIERARCHY //One of the above

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