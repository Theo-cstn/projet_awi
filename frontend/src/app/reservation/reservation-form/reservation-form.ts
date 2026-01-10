import { Component, inject, input, computed, output, effect } from '@angular/core';
import { EditeurListService } from '../../editeur/editeur-service/editeur-list-service';
import { Reservation } from '../../types/reservation-dto';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-reservation-form',
  imports: [ReactiveFormsModule],
  templateUrl: './reservation-form.html',
  styleUrl: './reservation-form.css',
})
export class ReservationForm {

  private readonly editeurService = inject(EditeurListService); 
  
  // Si on édite une réservation 
  reservationAEditer = input<Reservation | undefined>(undefined); 
  
  // Mode édition ? 
  modeEdition = computed(() => this.reservationAEditer() !== undefined); 
  
  // Si type = éditeur → on affiche la liste des éditeurs 
  isEditeur = computed(() => this.form.controls.type.value === 'editeur'); 
  
  add = output<any>(); 
  update = output<any>(); 
  
  submitted = false; 
  
  readonly form = new FormGroup({ 
    type: new FormControl<'editeur' | 'boutique' | 'association' | 'prestataire' | 'autre'> ('autre', { validators: [Validators.required] }), 
    editeur_id: new FormControl<number | undefined>(undefined), 
    nom_reservant: new FormControl<string | undefined>(undefined), 
    nombre_tables: new FormControl<number>(0, { 
      nonNullable: true, 
      validators: [Validators.min(0)] 
    }), 
    nombre_prises: new FormControl<number>(0, { 
      nonNullable: true, 
      validators: [Validators.min(0)] 
    }),
    remise_generale: new FormControl<number>(0, { 
      nonNullable: true, 
      validators: [Validators.min(0)] 
    }), 
    est_present: new FormControl<boolean>(true, { 
      nonNullable: true 
    }) 
  }); 
  
  constructor() { 
    effect(() => { 
      const r = this.reservationAEditer(); 
      if (r) { this.form.patchValue({ 
        type: r.type, 
        editeur_id: r.editeur_id, 
        nom_reservant: r.nom_reservant, 
        nombre_tables: r.nombre_tables, 
        nombre_prises: r.nombre_prises, 
        remise_generale: r.remise_generale, 
        est_present: r.est_present 
      }); 
    } 
    });
  } 
   
  editeurs() { 
    return this.editeurService.editeurs(); 
  } 
  onSubmit() { 
    this.submitted = true; 
    if (!this.form.valid) return; 
    
    const value = this.form.value; 
    if (this.modeEdition()) { 
      this.update.emit({ ...this.reservationAEditer()!, ...value }); 
    } 
    else { 
      this.add.emit(value); 
    } 
    this.form.reset(); 
    this.submitted = false; 
  }

}