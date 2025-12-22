import { Component, effect, inject } from '@angular/core'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'
import { AuthService } from '../auth/auth.service'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  private fb = inject(FormBuilder)
  readonly auth = inject(AuthService)
  private router = inject(Router)

  form: FormGroup = this.fb.group({
    login: ['', [Validators.required]],
    password: ['', [Validators.required]]
  })

  constructor() {
    // Dès que isLoggedIn passe à true (après inscription et auto-login), on navigue vers la home.
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.router.navigateByUrl('/festival')
      }
    })
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }
    const { login, password } = this.form.value
    // Appelle le service d'inscription (qui connecte automatiquement l'utilisateur)
    this.auth.register(login, password).subscribe()
  }
  get loginControl() { return this.form.get('login') }
  get passwordControl() { return this.form.get('password') }
}