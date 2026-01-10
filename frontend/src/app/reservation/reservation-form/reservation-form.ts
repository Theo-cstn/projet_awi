import { Component, inject, signal, input, computed, output, effect } from '@angular/core';
import { EditeurListService } from '../../editeur/editeur-service/editeur-list-service';
import { Reservation } from '../../types/reservation-dto';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ZoneTarifaireListService } from '../../zoneTarifaire/zoneTarifaire-service/zone-tarifaire-list-service';
import { ReservationListService } from '../reservation-service/reservation-list-service';

@Component({
  selector: 'app-reservation-form',
  imports: [ReactiveFormsModule],
  templateUrl: './reservation-form.html',
  styleUrl: './reservation-form.css',
})
export class ReservationForm {
  private editeurService = inject(EditeurListService); 
  private zoneService = inject(ZoneTarifaireListService); 
  private reservationService = inject(ReservationListService);

  festivalId = signal<number>(0);

  // Liste des éditeurs 
  editeurs = this.editeurService.editeurs; 
  // Liste des zones tarifaires 
  zones = this.zoneService.zones;

  // Formulaire principal 
  form = new FormGroup({ 
    type: new FormControl<'Editeur' | 'Boutique' | 'Association' | 'Prestataire' | 'Autre'>('Autre', Validators.required), 
    editeur_id: new FormControl<number | undefined>(undefined), 
    autre_nom_reservant: new FormControl<string | undefined>(undefined), 
    nombre_prises: new FormControl(0, Validators.min(0)), 
    remise_generale: new FormControl(0, Validators.min(0)), 
    est_present: new FormControl(true) 
  });

  lignes = signal<{ zone_tarifaire_id: number; quantite: number; prix_unitaire_applique: number }[]>([]);
  isEditeur = computed(() => this.form.controls.type.value === 'Editeur');
  totalTables = computed(() => this.lignes().reduce((sum, l) => sum + l.quantite, 0) );
  totalPrix = computed(() => this.lignes().reduce((sum, l) => sum + l.quantite * l.prix_unitaire_applique, 0) - (this.form.controls.remise_generale.value ?? 0) );

  addLigne() { 
    this.lignes.update(list => [ ...list, { zone_tarifaire_id: 0, quantite: 0, prix_unitaire_applique: 0 } ]); 
  }

  updateLigne(index: number, zoneId: number, quantite: number) { 
    const zone = this.zones().find(z => z.id === zoneId); 
    if (!zone) return; 
    
    // Vérification du stock restant 
    if (quantite > (zone.nbTablesLibres ?? zone.nbTotalTables)) { 
      alert("Pas assez de tables disponibles dans cette zone"); 
      return; 
    } 
    
    this.lignes.update(list => {
      const updated = [...list]; 
      updated[index] = {
        zone_tarifaire_id: zoneId, 
        quantite, 
        prix_unitaire_applique: zone.prixTable 
      }; 
      return updated; 
    }); 
  }

  removeLigne(index: number) { 
    this.lignes.update(list => list.filter((_, i) => i !== index)); 
  } 
  
  submit() { 
    const value = this.form.value; 
    const payload = { 
      festival_id: this.festivalId(), 
      type: value.type!, 
      editeur_id: value.type === 'Editeur' ? (value.editeur_id ?? undefined) : undefined,
      autre_nom_reservant: value.type !== 'Editeur' ? (value.autre_nom_reservant ?? undefined) : undefined,      
      nombre_prises: value.nombre_prises ?? 0, 
      remise_generale: value.remise_generale ?? 0, 
      est_present: value.est_present ?? true, 
      lignes: this.lignes() 
    }; 
    this.reservationService.create(payload).subscribe(() => { 
      alert("Réservation créée"); 
    }); 
  } 
}
