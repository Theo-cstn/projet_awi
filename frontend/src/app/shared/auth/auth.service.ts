import { computed, inject, Injectable, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { UserDto } from '../../types/user-dto'
import { environment } from '../../../environments/environment'
import { catchError, finalize, map, of, tap } from 'rxjs'
import { Router } from '@angular/router'

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly http = inject(HttpClient)
    private readonly router = inject(Router)

    // --- État interne (signaux) ---
    private readonly _currentUser = signal<UserDto | null>(null)
    private readonly _isLoading = signal(false)
    private readonly _error = signal<string | null>(null)

    // --- État exposé (readonly, computed) ---
    readonly currentUser = this._currentUser.asReadonly()
    readonly isLoggedIn = computed(() => this._currentUser() != null)
    readonly isAdmin = computed(() => this._currentUser()?.role === 'admin')
    readonly isLoading = this._isLoading.asReadonly()
    readonly error = this._error.asReadonly()

    // --- Connexion ---
    login(login: string, password: string) {
        this._isLoading.set(true)
        this._error.set(null)
        this.http.post<{ user: UserDto }>(
            `${environment.apiUrl}/auth/login`,
            { login, password },
            { withCredentials: true }
        ).pipe(
            tap(res => {
                if (res?.user) {
                    this._currentUser.set(res.user)
                    console.log(`👍 Utilisateur connecté : ${JSON.stringify(res.user)}`) // DEBUG
                } else {
                    this._error.set('Identifiants invalides')
                    this._currentUser.set(null)
                }
            }),
            catchError((err) => {
                console.error('👎 Erreur HTTP', err)
                if (err.status === 401) { this._error.set('Identifiants invalides') }
                else if (err.status === 0) {
                    this._error.set('Serveur injoignable (vérifiez HTTPS ou CORS)')
                } else { this._error.set(`Erreur serveur (${err.status})`) }
                this._currentUser.set(null)
                return of(null)
            }),
            finalize(() => this._isLoading.set(false))
        ).subscribe()
    }

    register(login: string, password: string) {
        this._isLoading.set(true);
        this._error.set(null);
        return this.http.post<{ user: UserDto }>(
            `${environment.apiUrl}/auth/register`,
            { login, password }
        ).pipe(
            tap(() => {
               this.login(login, password);
            }),
            finalize(() => this._isLoading.set(false))
        );
    }

    logout() {
        this._isLoading.set(true)
        this._error.set(null)
        this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true })
            .pipe(
                tap(() => { 
                    this._currentUser.set(null);
                    this.router.navigate(['/login']); 
                }),
                catchError(err => {
                    console.error('Erreur de déconnexion', err)
                    this._error.set('Erreur de déconnexion')
                    this._currentUser.set(null);
                    this.router.navigate(['/login']);
                    return of(null)
                }),
                finalize(() => this._isLoading.set(false))
            )
            .subscribe()
    }

    // --- Vérifie la session actuelle (cookie httpOnly) ---
    // Observable utile pour le guard ou pour attendre la réponse
    whoami$() {
        this._isLoading.set(true)
        this._error.set(null)
        return this.http.get<{ user?: UserDto }>(`${environment.apiUrl}/auth/whoami`, { withCredentials: true })
            .pipe(
                map(res => res?.user ?? null),
                tap(user => this._currentUser.set(user)),
                catchError(err => {
                    // Notifier l'UI, nettoyer l'état
                    console.warn('whoami error', err)
                    this._error.set('Session expirée')
                    this._currentUser.set(null)
                    return of(null)
                }),
                finalize(() => this._isLoading.set(false))
            )
    }

    // méthode pratique qui appelle whoami$ et s'abonne (pour composants qui ne veulent pas gérer l'observable)
    whoami() {
        this.whoami$().subscribe()
    }

    // --- Rafraîchissement pour l'interceptor ---
    refresh$() { // observable qui émet null en cas d'erreur
        return this.http.post(`${environment.apiUrl}/auth/refresh`, {}, { withCredentials: true })
            .pipe(
                catchError(() => of(null))
            )
    }
}