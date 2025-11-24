import { Routes } from '@angular/router';
import { EditeurList } from './editeur/editeur-list/editeur-list';
import { JeuList } from './jeu/jeu-list/jeu-list';

export const routes: Routes = [
  { path: '', redirectTo: '/editeurs', pathMatch: 'full' },
  { path: 'editeurs', component: EditeurList },
  { path: 'editeurs/:id/jeux', component: JeuList },
  { path: 'jeux', component: JeuList },
];