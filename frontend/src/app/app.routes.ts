import { Routes } from '@angular/router';
import { EditeurList } from './editeur/editeur-list/editeur-list';
import { JeuList } from './jeu/jeu-list/jeu-list';
import { FestivalList } from './festival/festival-list/festival-list';
import { ContactList } from './contact/contact-list/contact-list';
import { LoginComponent } from './shared/auth/login.component/login.component';
import { AuthGuard } from './shared/auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { 
    path: 'festival', 
    component: FestivalList,
    canActivate: [AuthGuard]
  },
  { 
    path: 'editeurs', 
    component: EditeurList,
    canActivate: [AuthGuard] 
  },
  { 
    path: 'editeurs/:id/jeux', 
    component: JeuList,
    canActivate: [AuthGuard] 
  },
  { 
    path: 'editeurs/:id/contacts', 
    component: ContactList,
    canActivate: [AuthGuard] 
  },
  { 
    path: 'jeux', 
    component: JeuList,
    canActivate: [AuthGuard] 
  }
];