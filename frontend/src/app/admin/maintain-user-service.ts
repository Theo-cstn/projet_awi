import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { UserDto } from '../types/user-dto';

@Injectable({
  providedIn: 'root'
})
export class MaintainUserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  getAll() {
    return this.http.get<UserDto[]>(this.apiUrl);
  }

  // Modifier le rôle (PUT /users/:id/role)
  updateRole(userId: number, newRole: string) {
    return this.http.put<UserDto>(`${this.apiUrl}/${userId}/role`, { role: newRole });
  }

  // Supprimer un utilisateur (DELETE /users/:id)
  delete(userId: number) {
    return this.http.delete(`${this.apiUrl}/${userId}`);
  }
}
