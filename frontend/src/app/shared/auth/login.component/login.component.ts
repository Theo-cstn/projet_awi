import { Component, effect, inject } from '@angular/core'
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterModule } from '@angular/router'
import { AuthService } from '../auth.service'
import { CommonModule } from '@angular/common'

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder)
  readonly auth = inject(AuthService)
  private router = inject(Router)

  form: FormGroup = this.fb.group({
    login: ['', [Validators.required]],
    password: ['', [Validators.required]]
  })

  constructor() {
    // Dès que isLoggedIn passe à true, on navigue vers la home.
    // effect() réexécute la callback quand des signals consultés changent.
    effect(() => {
      if (this.auth.isLoggedIn()) {
        // navigation via Router injecté
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
    // Appelle le service
    this.auth.login(login, password)
    // On ne navigue pas ici ; l'effect() s'en chargera quand la connexion est effective.
  }

  // helpers pour le template — expose les FormControl 'login' et 'password' pour simplifier les bindings/validations
  get loginControl() { return this.form.get('login') }
  get passwordControl() { return this.form.get('password') }
}