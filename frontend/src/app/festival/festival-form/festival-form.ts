import { Component, signal, output, computed, input, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule } from "@angular/forms";
import { FormControl, FormGroup } from "@angular/forms";

import { Festival } from "../../types/festival-dto";
import { ZoneTarifaire } from "../../types/zone-tarifaire-dto";
import { ZoneTarifaireForm } from "../../zoneTarifaire/zoneTarifaire-form/zone-tarifaire-form";
import { ZoneTarifaireComponent } from "../../zoneTarifaire/zoneTarifaire-component/zone-tarifaire-component";


@Component({
  selector: 'app-festival-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ZoneTarifaireForm, ZoneTarifaireComponent],
  templateUrl: './festival-form.html',
  styleUrl: './festival-form.css'
})

export class FestivalForm {
  add = output<Omit<Festival, 'id'>>();
  update = output<Festival>();
  
  // Input du festival à éditer
  festivalAEditer = input<Festival | undefined>(undefined);
  
  modeEdition = computed(() => this.festivalAEditer() !== undefined);
  
  zonesTarifaires = signal<ZoneTarifaire[]>([]);
  nextZoneId = signal<number>(-1);
  
  // Signal pour gérer l'édition d'une zone
  zoneEnEdition = signal<ZoneTarifaire | undefined>(undefined);
  
  // Pour éviter que l'effect recharge les zones à chaque fois
  private lastLoadedFestivalId = signal<number | undefined>(undefined);

  readonly form = new FormGroup({
    nom: new FormControl('', { nonNullable: true }),
    date_debut: new FormControl('', { nonNullable: true }),
    date_fin: new FormControl('', { nonNullable: true }),
    nbTablesPetites: new FormControl(0, { nonNullable: true }),
    nbTablesGrandes: new FormControl(0, { nonNullable: true }),
    nbTablesMairie: new FormControl(0, { nonNullable: true })
  })

  nbTotalTables = computed(() => {
    const formValue = this.form.getRawValue();
    return formValue.nbTablesGrandes + formValue.nbTablesMairie + formValue.nbTablesPetites ;
  })

  constructor() {
    // Pré-remplir le formulaire quand festivalAEditer change
    effect(() => {
      const festival = this.festivalAEditer();
      
      if (festival) {
        // Mode édition : pré-remplir le formulaire
        this.form.patchValue({
          nom: festival.nom,
          date_debut: festival.date_debut.toISOString().split('T')[0], // Format YYYY-MM-DD
          date_fin: festival.date_fin.toISOString().split('T')[0],
          nbTablesPetites: festival.nbTablesPetites,
          nbTablesGrandes: festival.nbTablesGrandes,
          nbTablesMairie: festival.nbTablesMairie
        });
        
        // Charger les zones tarifaires SEULEMENT si c'est un nouveau festival à éditer
        if (this.lastLoadedFestivalId() !== festival.id) {
          this.zonesTarifaires.set(festival.zonesTarifaires || []);
          
          this.nextZoneId.set(-1);
          
          this.lastLoadedFestivalId.set(festival.id);
        }
      } else {
        // Mode ajout : réinitialiser
        this.form.reset();
        this.zonesTarifaires.set([]);
        this.nextZoneId.set(-1);
        this.lastLoadedFestivalId.set(undefined);
      }
    });
  }

  onSubmitForm(): void {
    const formValue = this.form.getRawValue();

    if (this.form.valid) {
      const zonesPropres = this.zonesTarifaires().map(z => {
        const zoneClean = { ...z };

        // 1. Si l'ID est négatif (temporaire), on le supprime (undefined)
        if (zoneClean.id && zoneClean.id < 0) {
           zoneClean.id = undefined; 
        }

        if (zoneClean.zonesPlan) {
            zoneClean.zonesPlan = zoneClean.zonesPlan.map(p => {
                const planClean = { ...p };
                if (planClean.id && planClean.id < 0) {
                    planClean.id = undefined;
                }
                return planClean;
            });
        }

        return zoneClean;
      });

      const festivalEdit = this.festivalAEditer();

      if (festivalEdit) {
        // Mode édition
        const updatedFestival: Festival = {
          id: festivalEdit.id!,
          nom: formValue.nom,
          date_debut: new Date(formValue.date_debut),
          date_fin: new Date(formValue.date_fin),
          nbTablesPetites: formValue.nbTablesPetites,
          nbTablesGrandes: formValue.nbTablesGrandes,
          nbTablesMairie: formValue.nbTablesMairie,
          nbTotalTables: this.nbTotalTables(),
          zonesTarifaires: zonesPropres
        };
        
        this.update.emit(updatedFestival);
      } else {
        // Mode création
        const festival: Omit<Festival, 'id'> = {
          nom: formValue.nom,
          date_debut: new Date(formValue.date_debut),
          date_fin: new Date(formValue.date_fin),
          nbTablesPetites: formValue.nbTablesPetites,
          nbTablesGrandes: formValue.nbTablesGrandes,
          nbTablesMairie: formValue.nbTablesMairie,
          nbTotalTables: this.nbTotalTables(),
          zonesTarifaires: zonesPropres
        };
        
        this.add.emit(festival);
      }
      
      // Réinitialiser le formulaire
      this.form.reset({
        nom: '', 
        date_debut: '',
        date_fin: '',
        nbTablesPetites: undefined, 
        nbTablesGrandes: undefined, 
        nbTablesMairie: undefined
      });
      this.zonesTarifaires.set([]);
      this.nextZoneId.set(-1);
      this.lastLoadedFestivalId.set(undefined);
    }
  }

  onAddZone(newZone: Omit<ZoneTarifaire, 'id'>): void {
    const zoneWithId: ZoneTarifaire = {
      ...newZone, 
      id: this.nextZoneId(),
      nbTablesLibres: newZone.nbTotalTables // Initialement toutes les tables sont libres
    };
    
    this.zonesTarifaires.update(zones => [...zones, zoneWithId]);
    this.nextZoneId.update(id => id - 1);
  }

  onUpdateZone(updatedZone: ZoneTarifaire): void {
    this.zonesTarifaires.update(zones =>
      zones.map(zone => zone.id === updatedZone.id ? updatedZone : zone)
    );
    
    // Réinitialiser le mode édition
    this.zoneEnEdition.set(undefined);
  }
  
  onEditZone(zone: ZoneTarifaire): void {
    this.zoneEnEdition.set(zone);
  }

  onRemoveZone(idZone: number): void {
    this.zonesTarifaires.update(zones =>
      zones.filter(zone => zone.id !== idZone)
    );
    
    // Si on supprime la zone en édition, annuler l'édition
    if (this.zoneEnEdition()?.id === idZone) {
      this.zoneEnEdition.set(undefined);
    }
  }
}