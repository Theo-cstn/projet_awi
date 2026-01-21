import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { AuthService } from '../auth/auth.service'
import { catchError, switchMap, throwError } from 'rxjs'

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const auth = inject(AuthService)
    const authReq = req.clone({ //On clone la requête pour activer l'envoi des cookies
        withCredentials: true
    });
    // --- Ne pas intercepter les requêtes d'auth elles-mêmes ---
    const excluded = ['/auth/login', '/auth/logout', '/auth/refresh']
    if (excluded.some(path => req.url.includes(path))) { return next(req) } // passe directement
    // --- Interception des autres requêtes ---
    return next(authReq).pipe(
        catchError((err: HttpErrorResponse) => {
            if (err.status !== 401) { return throwError(() => err) } // si pas 401 on transmet au suivant
            // Si 401 on tente de refresh via Observable
            return auth.refresh$().pipe(
                switchMap(ok => ok ? next(req) : throwError(() => err)), // Si refresh réussi, rejouer la requête
                catchError(refreshErr => { // si encore erreur, on termine
                    auth.logout() ; return throwError(() => refreshErr)
                })
            )
        })
    )
}