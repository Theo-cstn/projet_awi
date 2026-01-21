import { Routes } from '@angular/router';
import { AuthGuard } from './shared/auth/auth.guard';

// Layouts
import { MainLayoutComponent } from './shared/main-layout.component/main-layout.component';
import { FestivalLayoutComponent } from './festival/festival-layout.component/festival-layout.component';

// Components
import { LoginComponent } from './shared/auth/login.component/login.component';
import { RegisterComponent } from './shared/register.component/register.component';
import { PendingComponent } from './shared/pending.component/pending.component';

import { FestivalList } from './festival/festival-list/festival-list';
import { EditeurList } from './editeur/editeur-list/editeur-list';
import { JeuList } from './jeu/jeu-list/jeu-list';
import { ContactList } from './contact/contact-list/contact-list';
import { AdminUsersComponent } from './admin/list-users.component/list-users.component';

export const routes: Routes = [

  // ROUTES PUBLIQUES
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'pending', component: PendingComponent, canActivate: [AuthGuard] },

  // APPLICATION PRINCIPALE (NAVBAR + MAIN LAYOUT)
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'festivals', pathMatch: 'full' },
      // Liste globale des festivals
      { path: 'festivals', component: FestivalList },
      // Editeurs globaux
      { path: 'editeurs', component: EditeurList },
      // Jeux d’un éditeur
      { path: 'editeurs/:id/jeux', component: JeuList },
      // Jeux globaux
      { path: 'jeux', component: JeuList },

      { 
        path: 'editeurs/:id/jeux', 
        component: JeuList 
      },

      { 
        path: 'editeurs/:id/contacts', 
        component: ContactList 
      },
      
      // Jeux Globaux
      { 
        path: 'jeux', 
        component: JeuList 
      },
      // Admin
      {
        path: 'admin/users',
        component: AdminUsersComponent,
        data: { roles: ['admin'] }
      }
    ]
  },

  // WORKSPACE FESTIVAL (TOUT CE QUI DÉPEND D’UN FESTIVAL)
  {
    path: 'festivals/:id',
    component: FestivalLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./festival/dashboard.component/dashboard.component').then(m => m.DashboardComponent)
      },
      // Editeurs filtrés pour ce festival
      { path: 'editeurs', component: EditeurList },
      // Jeux filtrés pour ce festival
      { path: 'jeux', component: JeuList },

      // RÉSERVATIONS (LISTE + NEW + DETAILS)
      {
        path: 'reservations',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./reservation/reservation-list/reservation-list').then(m => m.ReservationList)
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./reservation/reservation-form/reservation-form').then(m => m.ReservationForm)
          },
          {
            path: ':reservationId',
            loadComponent: () =>
              import('./reservation/reservation-component/reservation-component').then(m => m.ReservationComponent)
          }
        ]
      }
    ]
  },

  // FALLBACK
  { path: '**', redirectTo: '/festivals' }
];
