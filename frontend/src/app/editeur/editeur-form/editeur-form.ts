import { Component, output } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';


@Component({
  selector: 'app-editeur-form',
  imports: [],
  templateUrl: './editeur-form.html',
  styleUrl: './editeur-form.css',
})
export class EditeurForm {
  readonly form = new FormGroup({  
    
      name: new FormControl('', {
      nonNullable : true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    
  });

  add = output<any>()

  submit():void {
    console.log(this.form.value);
  }

  getErrorMessage(control:AbstractControl|null): string|null {
    if (control != null){  
      if (control.errors?.['required']) {
        return "Champ obligatoire"
      }
      if (control.errors?.['minLength']) {
        return "Format invalide"
      }
    }
    return null
  }
}
