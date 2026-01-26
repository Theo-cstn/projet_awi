import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SuiviDto } from '../../types/suivi-dto';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SuiviService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/suivi`;

  private _suivis = signal<SuiviDto[]>([]);
  readonly suivis = this._suivis.asReadonly();

  //Charge tous les suivis d'éditeurs pour un festival donné
  loadSuivis(festivalId: number): void {
    this.http
      .get<SuiviDto[]>(`${this.apiUrl}/${festivalId}`, { withCredentials: true })
      .subscribe({
        next: (data) => {
          this._suivis.set(data);
        },
        error: (err) => console.error('Erreur chargement suivis:', err),
      });
  }

  //Prendre contact avec un éditeur (ajoute une date de contact)
  prendreContact(festivalId: number, editeurId: number): void {
    this.http
      .post(
        `${this.apiUrl}/contact`,
        { festival_id: festivalId, editeur_id: editeurId },
        { withCredentials: true }
      )
      .subscribe({
        next: () => {
          // Recharge la liste pour avoir les données à jour
          this.loadSuivis(festivalId);
        },
        error: (err) => console.error('Erreur prise de contact:', err),
      });
  }

  //Met à jour le suivi d'un éditeur (état, compte-rendu, etc.)
  updateSuivi(
    festivalId: number,
    editeurId: number,
    etat: string,
    compteRendu?: string,
    responsableId?: number
  ): void {
    this.http
      .post(
        this.apiUrl,
        {
          festival_id: festivalId,
          editeur_id: editeurId,
          etat,
          compte_rendu: compteRendu,
          responsable_id: responsableId,
        },
        { withCredentials: true }
      )
      .subscribe({
        next: () => {
          // Recharge la liste
          this.loadSuivis(festivalId);
        },
        error: (err) => console.error('Erreur mise à jour suivi:', err),
      });
  }
}
