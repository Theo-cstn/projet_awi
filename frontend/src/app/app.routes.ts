import { Routes } from '@angular/router';
import { AuthGuard } from './shared/auth/auth.guard';

// Layouts
import { MainLayoutComponent } from '../app/shared/main-layout.component/main-layout.component';
import { FestivalLayoutComponent } from '../app/festival/festival-layout.component/festival-layout.component';

// Components
import { LoginComponent } from './shared/auth/login.component/login.component';
import { RegisterComponent } from './shared/register.component/register.component';
import { PendingComponent } from './shared/pending.component/pending.component';
import { FestivalList } from './festival/festival-list/festival-list';
import { EditeurList } from './editeur/editeur-list/editeur-list';
import { JeuList } from './jeu/jeu-list/jeu-list';
import { AdminUsersComponent } from './admin/list-users.component/list-users.component';


export const routes: Routes = [
  // --- ROUTES PUBLIQUES (Sans Layout) ---
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'pending', component: PendingComponent, canActivate: [AuthGuard] },

  // --- APPLICATION PRINCIPALE (Avec MainLayout) ---
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      // Redirection par défaut vers la liste des festivals
      { path: '', redirectTo: 'festivals', pathMatch: 'full' },
      
      // Liste globale des festivals
      { 
        path: 'festivals', 
        component: FestivalList,
        data: { roles: ['visiteur', 'organisateur_jeux', 'organisateur_reservations', 'admin'] }
      },
      // Editeurs Globaux
      { 
        path: 'editeurs', 
        component: EditeurList 
      },

      { 
        path: 'editeurs/:id/jeux', 
        component: JeuList 
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

  // --- WORKSPACE FESTIVAL (Avec FestivalLayout) ---
  {
    path: 'festivals/:id',
    component: FestivalLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      
      // Dashboard du festival
      { 
        path: 'dashboard', 
        // Lazy loading recommandé pour les nouvelles vues
        loadComponent: () => import('./festival/dashboard.component/dashboard.component').then(m => m.DashboardComponent)
      },
      
      // Editeurs filtrés pour ce festival (On réutilise le composant mais le contexte change)
      { path: 'editeurs', component: EditeurList },
      
      // Jeux filtrés pour ce festival
      { path: 'jeux', component: JeuList },
      
      // Placeholder Reservations
      { 
        path: 'reservations', 
        loadComponent: () => import('./reservation/reservation-list/reservation-list').then(m => m.ReservationList)
      }
    ]
  },

  // Fallback global
  { path: '**', redirectTo: '/festivals' }
];