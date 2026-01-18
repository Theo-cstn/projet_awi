import { Component, inject, signal, input, computed, output, effect } from '@angular/core';
import { EditeurListService } from '../../editeur/editeur-service/editeur-list-service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { ZoneTarifaireListService } from '../../zoneTarifaire/zoneTarifaire-service/zone-tarifaire-list-service';
import { ReservationListService } from '../reservation-service/reservation-list-service';
import { JeuListService } from '../../jeu/jeu-service/jeu-list-service';

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
  private jeuService = inject(JeuListService)
  private reservationService = inject(ReservationListService);

  festivalId = signal<number>(0);
  currentPhase = signal<1 | 2 | 3>(1);  // 1 = Zones & quantités, 2 = Jeux, 3 = Confirmation

  // Liste des éditeurs 
  editeurs = this.editeurService.editeurs; 
  // Liste des zones tarifaires 
  zones = this.zoneService.zones;
  // Liste des jeux
  jeux = this.jeuService.jeux

  // Formulaire principal 
  form = new FormGroup({ 
    type: new FormControl<'Editeur' | 'Boutique' | 'Association' | 'Prestataire' | 'Autre'>('Autre', Validators.required), 
    editeur_id: new FormControl<number | undefined>(undefined), 
    autre_nom_reservant: new FormControl<string | undefined>(undefined), 
    nombre_prises: new FormControl(0, Validators.min(0)), 
    remise_generale: new FormControl(0, Validators.min(0)), 
    est_present: new FormControl(true), 
    preferences_tables: new FormControl<string>('')
  });

  lignes = signal<{ zone_tarifaire_id: number; quantite: number; prix_unitaire_applique: number }[]>([]);
  lignesJeux = signal <{ jeu_id: number; nb_exemplaires: number, tables_occupees: number}[]>([]);

  typeValue = signal<'Editeur' | 'Boutique' | 'Association' | 'Prestataire' | 'Autre'>('Autre');
  
  constructor() {
    this.form.controls.type.valueChanges.subscribe(v => this.typeValue.set(v!));
  }

  isEditeur = computed(() => this.typeValue() === 'Editeur');
  isBoutique = computed(() => this.typeValue() === 'Boutique')
  
  // Récupère le nom de l'éditeur sélectionné
  selectedEditeurName = computed(() => {
    const editeurId = this.form.controls.editeur_id.value;
    if (!editeurId) return '';
    return this.editeurs().find(e => e.id === editeurId)?.nom ?? '';
  });
  
  // Filtre les jeux selon le type de réservant
  jeuxFiltres = computed(() => {
    if (this.isEditeur()) {
      const editeurId = this.form.controls.editeur_id.value;
      if (!editeurId) {
        console.log('❌ Pas d\'éditeur sélectionné');
        return [];
      }
      // ✅ Les jeux ont déjà été chargés via loadJeuxByEditeur(), pas besoin de filtrer!
      // Ils contiennent DÉJÀ SEULEMENT les jeux de cet éditeur
      const jeux = this.jeux();
      console.log(`✅ Jeux de l'éditeur ${editeurId} affichés: ${jeux.length} jeux`);
      console.log('Jeux à afficher:', jeux);
      return jeux;
    }
    // Sinon, retourne tous les jeux
    console.log(`📊 Mode non-éditeur: ${this.jeux().length} jeux disponibles`);
    return this.jeux();
  });
  
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

  // ----------------ligne de reservation zone tarifaire --------------------------
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

  // ----------------ligne de reservation jeu --------------------------
  addGameLigne() { 
    this.lignesJeux.update(list => [ ...list, { jeu_id: 0, nb_exemplaires: 0, tables_occupees: 0 } ]); 
  }

  updateGameLigne(index: number, jeuId: number, nb_exemplaires: number, tables_occupees: number = 1) { 
    const jeu = this.jeux().find(j => j.id === jeuId); 
    if (!jeu || jeuId === 0 || nb_exemplaires <= 0) return; 
    
    this.lignesJeux.update(list => {
      const updated = [...list]; 
      updated[index] = {
        jeu_id: jeuId, 
        nb_exemplaires, 
        tables_occupees
      }; 
      return updated; 
    }); 
  }

  removeGameLigne(index: number) { 
    this.lignesJeux.update(list => list.filter((_, i) => i !== index)); 
  }
  
  goToPhase(phase: number) {
    if (phase == 1 || phase == 2 || phase == 3) {
      this.currentPhase.set(phase);
    }
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
      preferences_tables: value.preferences_tables ?? '',
      lignes: this.lignes(),
      lignesJeux: this.lignesJeux()
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
    
    // ✅ Charge TOUS les jeux au démarrage
    this.jeuService.loadJeux();
    
    // ✅ Quand le type change
    this.form.controls.type.valueChanges.subscribe((type) => {
      if (type === 'Editeur') {
        // Si c'est un Éditeur, charge ses jeux
        const editeurId = this.form.controls.editeur_id.value;
        if (editeurId) {
          this.jeuService.loadJeuxByEditeur(editeurId);
        }
      } else {
        // Si ce n'est pas un Éditeur, recharge tous les jeux
        this.jeuService.loadJeux();
      }
    });
    
    // ✅ Quand l'éditeur change (si c'est un Éditeur)
    this.form.controls.editeur_id.valueChanges.subscribe((editeurId) => {
      if (editeurId && this.isEditeur()) {
        this.jeuService.loadJeuxByEditeur(editeurId);
      }
    });
  }

}

