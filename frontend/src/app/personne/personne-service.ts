import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { PersonneDto } from '../types/personne-dto';

@Injectable({
  providedIn: 'root'
})
export class PersonneService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/personnes`;

  private _personnes = signal<PersonneDto[]>([]);
  readonly personnes = this._personnes.asReadonly();

  /**
   * Charge la liste complète des personnes (Auteurs, Contacts, etc.)
   */
  loadPersonnes(): void {
    this.http.get<PersonneDto[]>(this.apiUrl, { withCredentials: true }).subscribe({
      next: (data) => {
        this._personnes.set(data);
        console.log('👥 Personnes chargées :', data.length);
      },
      error: (err) => console.error('Erreur chargement personnes:', err)
    });
  }

  create(personne: Partial<PersonneDto>) {
    return this.http.post<PersonneDto>(this.apiUrl, personne, { withCredentials: true });
  }
}