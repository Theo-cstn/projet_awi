import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaintainUserService } from '../maintain-user-service';
import { UserDto } from '../../types/user-dto';
import { AuthService } from '../../shared/auth/auth.service';

@Component({
  selector: 'app-list-users.component',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './list-users.component.html',
  styleUrl: './list-users.component.css',
})
export class AdminUsersComponent {
  private userService = inject(MaintainUserService);

  auth = inject(AuthService);

  //État principal : La liste brute de tous les users
  users = signal<UserDto[]>([]);

  // États dérivés (calculés automatiquement)
  // Ceux qui ont 'no-role'
  pendingUsers = computed(() => this.users().filter(u => u.role === 'no-role'));
  // Tous les autres
  activeUsers = computed(() => this.users().filter(u => u.role !== 'no-role'));

  // Liste des rôles possibles pour le select
  roles = ['visiteur', 'organisateur_jeux', 'organisateur_reservations', 'admin'];

  constructor() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getAll().subscribe({
      next: (data) => this.users.set(data),
      error: (err) => console.error('Erreur chargement users', err)
    });
  }

  updateRole(user: UserDto, newRole: string, selectEl: HTMLSelectElement) {
    
    // On demande confirmation
    if (!confirm(`Passer ${user.login} en ${newRole} ?`)) {
        // CAS ANNULATION : On remet la valeur visuelle d'avant
        if (user.role === 'no-role') {
            selectEl.value = ""; 
        } else {
            selectEl.value = user.role;
        }
        return;
    }

    // Si confirmé, on appelle le backend
    this.userService.updateRole(user.id, newRole).subscribe({
      next: (updatedUser) => {
        this.users.update(currentList => 
          currentList.map(u => u.id === updatedUser.id ? updatedUser : u)
        );
      },
      error: (err) => {
        // En cas d'erreur API, on remet aussi l'ancienne valeur visuelle
        selectEl.value = user.role === 'no-role' ? "" : user.role;
        alert(err.error?.error || 'Erreur modification');
      }
    });
  }

  deleteUser(user: UserDto) {
    if (!confirm(`Supprimer définitivement ${user.login} ?`)) return;
    
    this.userService.delete(user.id).subscribe({
      next: () => {
        this.users.update(currentList => currentList.filter(u => u.id !== user.id));
      },
      error: (err) => alert(err.error?.error || 'Erreur suppression')
    });
  }

}