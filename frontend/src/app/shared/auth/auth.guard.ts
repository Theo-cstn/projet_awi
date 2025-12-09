import { Injectable, inject } from '@angular/core'
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router'
import { Observable, of } from 'rxjs'
import { map, catchError } from 'rxjs/operators'
import { AuthService } from './auth.service'

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private auth = inject(AuthService)
  private router = inject(Router)

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    // 1) Si on sait déjà que l'utilisateur est connecté, autorise directement
    if (this.auth.isLoggedIn()) {
      return true
    }

    // 2) Sinon, on appelle whoami$() et on attend la réponse (utile si page reload et cookie httpOnly présent)
    return this.auth.whoami$().pipe(
      map(user => {
        if (user) return true
        // non connecté => redirection vers login
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } })
        return false
      }),
      catchError(err => {
        // En cas d'erreur, redirection vers login
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } })
        return of(false)
      })
    )
  }
}