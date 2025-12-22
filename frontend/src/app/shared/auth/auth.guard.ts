import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { UserDto } from '../../types/user-dto'; // Assure-toi que le chemin est bon

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    const requiredRoles = route.data['roles'] as string[] | undefined;

    const checkAccess = (user: UserDto | null): boolean => {
      if (!user) {
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }
      if (requiredRoles && !requiredRoles.includes(user.role)) {
        // Redirection si rôle insuffisant
        this.router.navigate(['/festival']); 
        return false;
      }
      return true;
    };

    if (this.auth.isLoggedIn()) {
      return checkAccess(this.auth.currentUser());
    }

    return this.auth.whoami$().pipe(
      map(user => checkAccess(user)),
      catchError(() => {
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return of(false);
      })
    );
  }
}