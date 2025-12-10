import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Festival } from '../../types/festival-dto';

@Injectable({ providedIn: 'root' })
export class FestivalListService {
  private readonly apiUrl = 'https://localhost:4000/api/festivals/'; // URL du backend
  private readonly _festivals = signal<Festival[]>([]); // Signal pour stocker les festivals
  readonly festivals = this._festivals.asReadonly(); // Signal en lecture seule

  showForm: boolean = false;
  lastId: number = 2;

  constructor(private http: HttpClient) {}

  /**
   * Charge les festivals depuis le backend.
   */
  loadFestivals(): void {
    this.http.get<Festival[]>(this.apiUrl).subscribe({
      next: (data) => this._festivals.set(data),
      error: (err) => console.error('Erreur lors du chargement des festivals :', err),
    });
  }

  /**
   * Supprime un festival par son ID.
   */
  onRemove(idFestival: number): void {
    this._festivals.update((festivalList) =>
      festivalList.filter((festival) => festival.id !== idFestival)
    );
  }

  /**
   * Trouve un festival par son ID.
   */
  findById(id: number): Festival | undefined {
    return this._festivals().find((f) => f.id === id);
  }

  /**
   * Ajoute un nouveau festival.
   */
  onAdd(newFestival: Omit<Festival, 'id'>): void {
    this._festivals.update((festivalList) => [
      ...festivalList,
      { ...newFestival, id: this.lastId },
    ]);
    this.showForm = false;
    this.lastId = this.lastId + 1;
  }

  /**
   * Met à jour un festival existant.
   */
  update(partial: Partial<Festival> & { id: number }): void {
    this._festivals.update((festivalList) =>
      festivalList.map((f) => (f.id === partial.id ? { ...f, ...partial } : f))
    );
  }

  /**
   * Supprime tous les festivals.
   */
  removeAll(): void {
    this._festivals.set([]);
  }
}