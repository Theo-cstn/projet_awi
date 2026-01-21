import { Component, signal, output, input, computed, effect } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms'
import { ReactiveFormsModule } from '@angular/forms';

import { ZoneTarifaire } from '../../types/zone-tarifaire-dto';
import { ZonePlan } from '../../types/zone-plan-dto';
import { ZonePlanForm } from '../../zonePlan/zonePlan-form/zone-plan-form';
import { ZonePlanComponent } from '../../zonePlan/zonePlan-component/zone-plan-component';


@Component({
  selector: 'app-zone-tarifaire-form',
  imports: [ReactiveFormsModule, ZonePlanForm, ZonePlanComponent],
  templateUrl: './zone-tarifaire-form.html',
  styleUrl: './zone-tarifaire-form.css',
})
export class ZoneTarifaireForm {
    add = output<Omit<ZoneTarifaire, 'id'>>();
    update = output<ZoneTarifaire>();
    cancel = output<void>();
    
    // Input pour la zone à éditer
    zoneAEditer = input<ZoneTarifaire | undefined>(undefined);
    
    modeEdition = computed(() => this.zoneAEditer() !== undefined);
    
    zonesPlan = signal<ZonePlan[]>([]);
    nextZoneId = signal<number>(0);
    
    // Pour l'édition des zones plan
    zonePlanEnEdition = signal<ZonePlan | undefined>(undefined);
    
    // Pour éviter de recharger les zones plan à chaque fois
    private lastLoadedZoneId = signal<number | undefined>(undefined);

  readonly form = new FormGroup({
    nom: new FormControl('', { nonNullable: true }),
    nbTotalTables: new FormControl(0),
    prixTable: new FormControl(0),
    prixM: new FormControl(0)
  })
  
  constructor() {
    // Pré-remplir le formulaire quand zoneAEditer change
    effect(() => {
      const zone = this.zoneAEditer();
      
      if (zone) {
        // Mode édition : pré-remplir le formulaire
        this.form.patchValue({
          nom: zone.nom,
          nbTotalTables: zone.nbTotalTables,
          prixTable: zone.prixTable,
          prixM: zone.prixM
        });
        
        // Charger les zones plan SEULEMENT si c'est une nouvelle zone à éditer
        if (this.lastLoadedZoneId() !== zone.id) {
          this.zonesPlan.set(zone.zonesPlan || []);
          
          const maxId = zone.zonesPlan && zone.zonesPlan.length > 0
            ? Math.max(...zone.zonesPlan.map(z => z.id || 0))
            : 0;
          this.nextZoneId.set(maxId + 1);
          
          this.lastLoadedZoneId.set(zone.id);
        }
      } else {
        // Mode ajout : réinitialiser
        this.form.reset();
        this.zonesPlan.set([]);
        this.nextZoneId.set(0);
        this.lastLoadedZoneId.set(undefined);
      }
    });
  }

  onSubmitForm(): void {
    const formValue = this.form.getRawValue();
    const zoneEdit = this.zoneAEditer();

    let prixM = formValue.prixM;
    if (prixM === null || prixM === undefined){
      prixM = formValue.prixTable!/4.5;
    }

    if (zoneEdit) {
      // Mode édition
      const updatedZone: ZoneTarifaire = {
        id: zoneEdit.id!,
        nom: formValue.nom,
        nbTotalTables: formValue.nbTotalTables || 0,
        nbTablesLibres: zoneEdit.nbTablesLibres, // Préserver la valeur existante
        prixTable: formValue.prixTable || 0,
        prixM: prixM,
        zonesPlan: this.zonesPlan()
      };
      
      this.update.emit(updatedZone);
    } else {
      // Mode création
      const zoneTarifaire: Omit<ZoneTarifaire, 'id'> = {
        nom: formValue.nom,
        nbTotalTables: formValue.nbTotalTables || 0,
        prixTable: formValue.prixTable || 0,
        prixM: prixM,
        zonesPlan: this.zonesPlan()
      };

      this.add.emit(zoneTarifaire);
    }

    // Réinitialiser le formulaire
    this.form.reset({
      nom: '',
      nbTotalTables: null,
      prixTable: null,
      prixM: null,
    });
    this.zonesPlan.set([]);
    this.nextZoneId.set(0);
    this.lastLoadedZoneId.set(undefined);
  }

  onAddZone(newZone: Omit<ZonePlan, 'id'>): void {
    const zoneWithId: ZonePlan={...newZone, id: this.nextZoneId()};
    this.zonesPlan.update(zones => [...zones, zoneWithId]);
    this.nextZoneId.update(id => id+1);
  }

  onRemoveZone(zone: ZonePlan): void{
    this.zonesPlan.update(zones =>
      zones.filter(z => z.id !== zone.id)
    );
  }
  
  onEditZonePlan(zone: ZonePlan): void {
    this.zonePlanEnEdition.set(zone);
  }

  onUpdateZonePlan(updatedZone: ZonePlan): void {
    this.zonesPlan.update(zones =>
      zones.map(zone => zone.id === updatedZone.id ? updatedZone : zone)
    );
    this.zonePlanEnEdition.set(undefined);
  }

  onCancelEditZonePlan(): void {
    this.zonePlanEnEdition.set(undefined);
  }
  
  onCancel(): void {
    // Réinitialiser le formulaire
    this.form.reset({
      nom: '',
      nbTotalTables: null,
      prixTable: null,
      prixM: null,
    });
    this.zonesPlan.set([]);
    this.nextZoneId.set(0);
    this.lastLoadedZoneId.set(undefined);
    
    // Émettre l'événement d'annulation
    this.cancel.emit();
  }
}
