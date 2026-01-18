import { Component, inject, signal, input, computed, output, effect } from '@angular/core';
import { EditeurListService } from '../../editeur/editeur-service/editeur-list-service';
import { ActivatedRoute, Router } from '@angular/router';
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
  private router = inject(Router);
  private route = inject(ActivatedRoute);

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

  typeValue = signal<'Editeur' | 'Boutique' | 'Association' | 'Prestataire' | 'Autre'>('Autre');
  
  constructor() {
    this.form.controls.type.valueChanges.subscribe(v => this.typeValue.set(v!));
  }

  isEditeur = computed(() => this.typeValue() === 'Editeur');
  totalTables = computed(() => this.lignes().reduce((sum, l) => sum + l.quantite, 0) );
  totalPrixTables = computed(() => this.lignes().reduce((sum, l) => sum + l.quantite * l.prix_unitaire_applique, 0) );
  totalPrixBeforeRed = computed(() => this.totalPrixTables() + (250 * (this.form.controls.nombre_prises.value ?? 0)));
  totalPrixAfterRed = computed(() => this.totalPrixBeforeRed() - (this.form.controls.remise_generale.value ?? 0) );

  // Calcule les tables libres restantes pour chaque zone en tenant compte des lignes actuelles
  getTablesLibresRestantes = (zoneId: number): number => {
    const zone = this.zones().find(z => z.id === zoneId);
    if (!zone) return 0;
    
    const tablesReservees = this.lignes()
      .filter(l => l.zone_tarifaire_id === zoneId)
      .reduce((sum, l) => sum + l.quantite, 0);
    
    return (zone.nbTablesLibres ?? zone.nbTotalTables ?? 0) - tablesReservees;
  };

  addLigne() { 
    this.lignes.update(list => [ ...list, { zone_tarifaire_id: 0, quantite: 0, prix_unitaire_applique: 0 } ]); 
  }

  updateLigne(index: number, zoneId: number, quantite: number) { 
    const zone = this.zones().find(z => z.id === zoneId); 
    if (!zone) return; 
    
    // Récupère les tables libres RESTANTES (après les autres lignes)
    const tablesLibresRestantes = this.getTablesLibresRestantes(zoneId);
    
    // Rejette les quantités invalides silencieusement
    if (quantite < 0 || quantite > tablesLibresRestantes) { 
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

  cancel() {
    this.router.navigate([`/festivals/${this.festivalId()}/reservations`]);
  }
  
  ngOnInit() {
    let currentRoute = this.route;
    while (currentRoute.parent) {
      const id = currentRoute.parent.snapshot.params['id'];
      if (id && !isNaN(+id)) {
        this.festivalId.set(+id);
        break;
      }
      currentRoute = currentRoute.parent;
    }
    
    console.log('Festival ID récupéré:', this.festivalId());
    
    this.editeurService.loadEditeurs();
    this.zoneService.loadZones(this.festivalId());
  }
}

