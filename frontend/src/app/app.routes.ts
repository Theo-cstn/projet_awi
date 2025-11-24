import { Routes } from '@angular/router';
import { FestivalList } from './festival/festival-list/festival-list';

export const routes: Routes = [
    { path: 'home', component: FestivalList },
    { path: '', redirectTo: 'home', pathMatch: 'full' }
];
