import { Routes } from '@angular/router';
import { EditeurList } from './editeur/editeur-list/editeur-list';
import { JeuList } from './jeu/jeu-list/jeu-list';
import { FestivalList } from './festival/festival-list/festival-list';
import { ContactList } from './contact/contact-list/contact-list';


export const routes: Routes = [
  { path: '', redirectTo: '/festival', pathMatch: 'full' },
  { path: 'festival', component: FestivalList },
  { path: 'editeurs', component: EditeurList },
  { path: 'editeurs/:id/jeux', component: JeuList },
  { path: 'editeurs/:id/contacts', component: ContactList },
  { path: 'jeux', component: JeuList }
  
];