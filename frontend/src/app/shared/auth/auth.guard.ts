import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { UserDto } from '../../types/user-dto';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | boolean | UrlTree {
    
    // Fonction de vérification centralisée
    const checkAccess = (user: UserDto | null): boolean | UrlTree => {
      // Pas connecté -> Login
      if (!user) {
        return this.router.createUrlTree(['/login']);
      }

      // CAS SPÉCIAL : Utilisateur "En attente" (no-role)
      if (user.role === 'no-role') {
        // S'il est déjà sur la page pending, on laisse passer
        if (state.url === '/pending') {
          return true;
        }
        // Sinon, on le force à aller sur pending
        return this.router.createUrlTree(['/pending']);
      }

      // CAS INVERSE : Utilisateur validé qui essaie d'aller sur "pending"
      // On le renvoie vers l'accueil (festival) pour ne pas qu'il reste bloqué
      if (state.url === '/pending') {
        return this.router.createUrlTree(['/festival']);
      }

      // Vérification classique des Rôles (data: { roles: [...] })
      const requiredRoles = route.data['roles'] as string[] | undefined;
      if (requiredRoles && !requiredRoles.includes(user.role)) {
        // Rôle insuffisant -> Redirection accueil (ou 403 page)
        return this.router.createUrlTree(['/festival']);
      }

      return true;
    };

    if (this.auth.isLoggedIn()) {
      return checkAccess(this.auth.currentUser());
    }

    return this.auth.whoami$().pipe(
      map(user => checkAccess(user)),
      catchError(() => {
        return of(this.router.createUrlTree(['/login']));
      })
    );
  }
}