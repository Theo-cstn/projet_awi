//CODE TEMPORAIRE. A REVOIR APRÈS AVOIR TERMINÉ LA PAGE DASHBOARD.(généré par IA)

import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FestivalLayoutComponent } from '../festival-layout.component/festival-layout.component'; // Vérifie ce chemin d'import !
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html', // On utilise le fichier HTML séparé
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  // Injection du composant PARENT pour accéder à ses données
  private layout = inject(FestivalLayoutComponent);
  
  // On récupère le signal du parent
  festival = this.layout.festival;

  // Calcul des jours restants
  daysRemaining = computed(() => {
    const f = this.festival();
    if (!f) return 0;
    // On compare la date de début avec maintenant
    const diff = new Date(f.date_debut).getTime() - new Date().getTime();
    // Conversion ms -> jours (arrondi supérieur)
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days > 0 ? days : 0; // On ne retourne pas de négatif si commencé
  });

  // Calcul pourcentage occupation pour la barre de progression
  getOccupancyPercentage(zone: any): number {
    if (zone.nbTotalTables === 0) return 0;
    const used = zone.nbTotalTables - zone.nbTablesLibres;
    return (used / zone.nbTotalTables) * 100;
  }

  totalCommercialCapacity = computed(() => {
    const zones = this.festival()?.zonesTarifaires || [];
    return zones.reduce((acc, z) => acc + (z.nbTotalTables || 0), 0);
  });

  totalCommercialRemaining = computed(() => {
    const zones = this.festival()?.zonesTarifaires || [];
    return zones.reduce((acc, z) => acc + (z.nbTablesLibres || 0), 0);
  });
}