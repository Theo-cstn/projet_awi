import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SuiviService } from '../suivi-service/suivi-service';
import { SuiviDto } from '../../types/suivi-dto';
import { AuthService } from '../../shared/auth/auth.service';

@Component({
  selector: 'app-suivi-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './suivi-list.html',
  styleUrl: './suivi-list.css',
})
export class SuiviList implements OnInit {
  private route = inject(ActivatedRoute);
  private suiviService = inject(SuiviService);
  readonly auth = inject(AuthService);

  readonly suivis = this.suiviService.suivis;
  festivalId = signal<number | undefined>(undefined);

  // Filtre pour trier selon l'état
  filtreEtat = signal<string>('TOUS');

  // États possibles pour le filtre
  readonly etatsDisponibles = [
    { value: 'TOUS', label: 'Tous' },
    { value: 'PAS_CONTACTE', label: 'Pas contacté' },
    { value: 'CONTACTE', label: 'Contacté' },
    { value: 'DISCUSSION', label: 'Discussion en cours' },
    { value: 'REFUS', label: 'Refus / Absent' },
    { value: 'CONFIRME', label: 'Confirmé / Présent' },
  ];

  // États pour la liste déroulante de changement d'état
  readonly etatsWorkflow = [
    { value: 'PAS_CONTACTE', label: 'Pas encore de contact' },
    { value: 'CONTACTE', label: 'Contact pris' },
    { value: 'DISCUSSION', label: 'Discussion en cours' },
    { value: 'REFUS', label: 'Sera absent / Considéré absent' },
    { value: 'CONFIRME', label: 'Présent (a fait sa réservation)' },
  ];

  // Liste filtrée selon le filtre sélectionné
  suivisFiltres = computed(() => {
    const filtre = this.filtreEtat();
    if (filtre === 'TOUS') {
      return this.suivis();
    }
    return this.suivis().filter((s) => s.etat === filtre);
  });

  ngOnInit(): void {
    // Récupère l'ID du festival depuis la route parent
    const parentId = this.route.parent?.snapshot.paramMap.get('id');
    if (parentId) {
      const fId = Number(parentId);
      this.festivalId.set(fId);
      this.suiviService.loadSuivis(fId);
    }
  }

  /**
   * Prendre contact avec un éditeur
   */
  prendreContact(editeurId: number): void {
    const fId = this.festivalId();
    if (fId) {
      this.suiviService.prendreContact(fId, editeurId);
    }
  }

  /**
   * Changer l'état du workflow
   */
  changerEtat(editeurId: number, nouvelEtat: string): void {
    const fId = this.festivalId();
    if (fId) {
      this.suiviService.updateSuivi(fId, editeurId, nouvelEtat);
    }
  }

  /**
   * Formater les dates de contact pour l'affichage
   */
  formaterDatesContact(dates: string[]): string {
    if (!dates || dates.length === 0) {
      return 'Aucun contact';
    }
    return dates
      .map((d) => new Date(d).toLocaleDateString('fr-FR'))
      .join(', ');
  }

  /**
   * Obtenir le libellé de l'état
   */
  getLibelleEtat(etat: string): string {
    const etatObj = this.etatsWorkflow.find((e) => e.value === etat);
    return etatObj?.label || etat;
  }

  /**
   * Changer le filtre
   */
  changerFiltre(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.filtreEtat.set(select.value);
  }
}
