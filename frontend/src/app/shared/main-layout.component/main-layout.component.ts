import { Component, inject } from '@angular/core';
import { AuthService } from '../../shared/auth/auth.service';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  
  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}