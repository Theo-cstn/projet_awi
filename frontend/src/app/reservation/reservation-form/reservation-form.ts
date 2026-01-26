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
  remiseGenerale = signal(0)

  reservationAEditer = input<any>(undefined);

  // 1 = Zones & quantités, 2 = Jeux, 3 = Disposition
  currentPhase = signal<1 | 2 | 3>(1);

  close = output<void>();

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
    remise_generale: new FormControl<number>(0, Validators.min(0)), 
    est_present: new FormControl(true), 
    preferences_tables: new FormControl<string>('')
  });

  lignes = signal<{ zone_tarifaire_id: number; quantite: number; prix_moment_reservation: number }[]>([]);
  lignesJeux = signal <{ jeu_id: number; nb_exemplaires: number, tables_occupees: number, zone_plan_id?: number}[]>([]);

  typeValue = signal<'Editeur' | 'Boutique' | 'Association' | 'Prestataire' | 'Autre'>('Autre');
  
  constructor() {
    this.form.controls.type.valueChanges.subscribe(v => this.typeValue.set(v!));
    this.form.controls.remise_generale.valueChanges.subscribe(v => {
      this.remiseGenerale.set(v ?? 0)
    });

    effect(() => {
      const resa = this.reservationAEditer();
      if (resa) {
        // 1. Remplir le formulaire principal
        this.form.patchValue({
          type: resa.type,
          editeur_id: resa.editeur_id,
          autre_nom_reservant: resa.autre_nom_reservant,
          nombre_prises: resa.nombre_prises,
          remise_generale: resa.remise_generale,
          est_present: resa.est_present,
          preferences_tables: resa.preferences_tables
        });

        // 2. Remplir les lignes (IMPORTANT: mapper les IDs pour le Smart Update)
        if (resa.lignes) {
             this.lignes.set(resa.lignes.map((l: any) => ({
                 id: l.id,
                 zone_tarifaire_id: l.zone_tarifaire_id,
                 quantite: l.quantite,
                 prix_moment_reservation: l.prix_moment_reservation
             })));
        }

        // 3. Remplir les jeux
        if (resa.jeux) {
            this.lignesJeux.set(resa.jeux.map((j: any) => ({
                id: j.id,
                jeu_id: j.jeu_id,
                nb_exemplaires: j.nb_exemplaires,
                tables_occupees: j.tables_occupees,
                zone_plan_id: j.zone_plan_id
            })));
        }
      }
    });
  }

  isEditeur = computed(() => this.typeValue() === 'Editeur');
  isBoutique = computed(() => this.typeValue() === 'Boutique')
  
  // Filtre les jeux selon le type de réservant
  jeuxFiltres = computed(() => {
    if (this.isEditeur()) {
      const editeurId = this.form.controls.editeur_id.value;
      if (!editeurId) {
        return [];
      }
      const jeux = this.jeux();
      return jeux;
    }
    // Sinon, retourne tous les jeux
    return this.jeux();
  });
  
  totalTables = computed(() => this.lignes().reduce((sum, l) => sum + l.quantite, 0) );
  totalPrixTables = computed(() => this.lignes().reduce((sum, l) => sum + l.quantite * l.prix_moment_reservation, 0) );
  totalPrixBeforeRed = computed(() => this.totalPrixTables() + (250 * (this.form.controls.nombre_prises.value ?? 0)));
  totalPrixAfterRed = computed(() => this.totalPrixBeforeRed() - this.remiseGenerale() );

  // Calcule les tables libres restantes pour chaque zone en tenant compte des lignes actuelles
  getTablesLibresRestantes = (zoneId: number | undefined): number => {
    if (zoneId === undefined) return 0;

    const zone = this.zones().find(z => z.id === zoneId);
    if (!zone) return 0;
    
    const tablesReservees = this.lignes()
      .filter(l => l.zone_tarifaire_id === zoneId)
      .reduce((sum, l) => sum + l.quantite, 0);
    
    return (zone.nbTablesLibres || 0) - tablesReservees;
  };

  // ----------------ligne de reservation zone tarifaire --------------------------
  addLigne() { 
    this.lignes.update(list => [ ...list, { zone_tarifaire_id: 0, quantite: 0, prix_moment_reservation: 0 } ]); 
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
        prix_moment_reservation: zone.prixTable 
      }; 
      return updated; 
    }); 
  }
  removeLigne(index: number) { 
    this.lignes.update(list => list.filter((_, i) => i !== index)); 
  }

  // ----------------ligne de reservation jeu --------------------------
  addGameLigne() { 
    this.lignesJeux.update(list => [ ...list, { jeu_id: 0, nb_exemplaires: 1, tables_occupees: 1 } ]);
  }
  updateGameLigne(index: number, jeuId: number, nb_exemplaires: number, tables_occupees: number = 1) { 
    const jeu = this.jeux().find(j => j.id === jeuId); 
    if (!jeu || jeuId === 0 || nb_exemplaires <= 0) return; 
    
    this.lignesJeux.update(list => {
      const updated = [...list]; 
      updated[index] = {
        ...updated[index],
        jeu_id: jeuId, 
        nb_exemplaires, 
        tables_occupees
      }; 
      
      // Affiche un warning si dépassement
      if (this.getTotalTablesUsed() > this.getTotalTablesReserved()) {
        console.warn('Attention: dépassement de tables!', {
          used: this.getTotalTablesUsed(),
          reserved: this.getTotalTablesReserved()
        });
      }
      
      return updated; 
    }); 
  }
  removeGameLigne(index: number) { 
    this.lignesJeux.update(list => list.filter((_, i) => i !== index)); 
  }


  getSelectedZones = (): Array<any> => {
    const zoneIds = new Set(this.lignes().map(l => l.zone_tarifaire_id));
    return this.zones().filter(z => z.id !== undefined && zoneIds.has(z.id));
  };
  getZonePlanById = (id: number): any => {
    for (const zone of this.zones()) {
      const plan = zone.zonesPlan?.find(zp => zp.id === id);
      if (plan) return { ...plan, zone_tarifaire_id: zone.id };
    }
    return null;
  };

  // Met à jour le placement d'un jeu
  updateLignePlacement(index: number, zonePlanId: number) {
    // Vérifier si le placement est possible AVANT de le faire
    if (zonePlanId > 0) {
      const ligne = this.lignesJeux()[index];
      if (!this.canPlaceGameInZonePlan(zonePlanId, ligne.nb_exemplaires, ligne.tables_occupees, index)) {
        alert(`❌ Erreur: Pas assez d'espace dans cette zone plan!\nNécessaires: ${ligne.nb_exemplaires * ligne.tables_occupees} tables\nDisponibles: ${this.getTablesLibresInZonePlan(zonePlanId, index)} tables`);
        return;
      }
    }

    this.lignesJeux.update(list => {
      const updated = [...list];
      updated[index] = {
        ...updated[index],
        zone_plan_id: zonePlanId > 0 ? zonePlanId : undefined
      };
      return updated;
    });
  }

  getZonePlanName = (id: number | undefined): string => {
    if (!id) return '';
    const plan = this.getZonePlanById(id);
    return plan?.nom || 'Non défini';
  };
  getJeuName = (jeuId: number | undefined): string => {
    if (!jeuId) return '';
    const jeu = this.jeux().find(j => j.id === jeuId);
    return jeu?.nom || 'Jeu non trouvé';
  };

  // Récupère toutes les zones plan disponibles (de toutes les zones tarifaires réservées)
  getAllZonesPlansForSelectedZones = (): Array<{id: number, nom: string, nbTables: number, zone_tarifaire_nom: string}> => {
    const result: Array<{id: number, nom: string, nbTables: number, zone_tarifaire_nom: string}> = [];
    
    for (const zone of this.getSelectedZones()) {
      if (zone.zonesPlan) {
        for (const plan of zone.zonesPlan) {
          result.push({
            id: plan.id || 0,
            nom: plan.nom,
            nbTables: plan.nbTables,
            zone_tarifaire_nom: zone.nom
          });
        }
      }
    }
    return result;
  };

  // Calcule les tables occupées dans une zone plan par les jeux déjà placés (sauf un jeu spécifique)
  getTablesOccupiedInZonePlan = (zonePlanId: number, excludeLineIndex?: number): number => {
    return this.lignesJeux()
      .filter((l, idx) => l.zone_plan_id === zonePlanId && idx !== excludeLineIndex)
      .reduce((sum, l) => sum + (l.nb_exemplaires * (l.tables_occupees || 1)), 0);
  };

  // Récupère les tables libres restantes dans une zone plan (en excluant un jeu spécifique si demandé)
  getTablesLibresInZonePlan = (zonePlanId: number, excludeLineIndex?: number): number => {
    const planData = this.getAllZonesPlansForSelectedZones().find(zp => zp.id === zonePlanId);
    if (!planData) return 0;
    
    const occupied = this.getTablesOccupiedInZonePlan(zonePlanId, excludeLineIndex);
    return planData.nbTables - occupied;
  };

  // Vérifie si un jeu peut être placé dans une zone plan (en excluant le jeu actuel du calcul)
  canPlaceGameInZonePlan = (zonePlanId: number, nb_exemplaires: number, tables_occupees: number, currentLineIndex?: number): boolean => {
    const tablesNeeded = nb_exemplaires * tables_occupees;
    const tablesAvailable = this.getTablesLibresInZonePlan(zonePlanId, currentLineIndex);
    return tablesNeeded <= tablesAvailable;
  };

  // Récupère les nbTables d'une zone plan par son ID
  getZonePlanNbTables = (zonePlanId: number | undefined): number => {
    if (!zonePlanId) return 0;
    const plan = this.getAllZonesPlansForSelectedZones().find(zp => zp.id === zonePlanId);
    return plan?.nbTables || 0;
  };

  getTotalTablesUsed = (): number => {
    return this.lignesJeux().reduce((sum, l) => {
      return sum + (l.nb_exemplaires * l.tables_occupees);
    }, 0);
  };

  // nombre total tables réservées en phase 1
  getTotalTablesReserved = (): number => {
    return this.lignes().reduce((sum, l) => sum + l.quantite, 0);
  };

  // Vérifie s'il y a un dépassement
  hasTablesExceeded = (): boolean => {
    return this.getTotalTablesUsed() > this.getTotalTablesReserved();
  };

  // Message d'avertissement
  getTablesWarningMessage = (): string => {
    const used = this.getTotalTablesUsed();
    const reserved = this.getTotalTablesReserved();
    if (used > reserved) {
      return `⚠️ Dépassement ! Vous utilisez ${used} tables mais n'en avez réservé que ${reserved}`;
    }
    if (used === reserved) {
      return `✅ Utilisation optimale : ${used}/${reserved} tables`;
    }
    return `Utilisation : ${used}/${reserved} tables`;
  };

  
  goToPhase(phase: number) {
    if (phase == 1 || phase == 2 || phase == 3) {
      if (phase === 3) {
        if (this.lignesJeux().length === 0) {
          alert('Veuillez sélectionner au moins un jeu pour continuer');
          return;
        }
        
        if (this.hasTablesExceeded()) {
          const confirmed = confirm(
            `⚠️ Attention !\n\n${this.getTablesWarningMessage()}\n\nVoulez-vous continuer quand même ?`
          );
          if (!confirmed) {
            return;
          }
        }
      }
      
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
      remise_generale: Number(value.remise_generale ?? 0),
      est_present: value.est_present ?? true, 
      preferences_tables: value.preferences_tables ?? '',
      lignes: this.lignes(),
      jeux: this.lignesJeux()
    };

    // 2. Détection du mode (Création vs Édition)
    const existingResa = this.reservationAEditer();

    if (existingResa) {
      // UPDATE
      this.reservationService.update(existingResa.id, payload).subscribe({
        next: () => { 
          alert("Réservation mise à jour !"); 
          this.close.emit();
        },
        error: (err) => console.error("Erreur update:", err)
      });
    } else {
      // CREATE
      this.reservationService.create(payload).subscribe({
        next: () => { 
          alert("Réservation créée !"); 
          this.close.emit();
        },
        error: (err) => console.error("Erreur create:", err)
      }); 
    }
  }

  cancel() {
    this.close.emit();
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
    
    this.editeurService.loadEditeurs();
    this.zoneService.loadZones(this.festivalId());
    this.jeuService.loadJeux();
    
    this.form.controls.type.valueChanges.subscribe((type) => {
      if (this.isEditeur()) {
        const editeurId = this.form.controls.editeur_id.value;
        if (editeurId) {
          this.jeuService.loadJeuxByEditeur(editeurId);
        }
      } 
      else {
        this.jeuService.loadJeux();
      }
    });
    
      this.form.controls.editeur_id.valueChanges.subscribe((editeurId) => {
      if (editeurId && this.isEditeur()) {
        this.jeuService.loadJeuxByEditeur(editeurId);
      }
    });
  }
}