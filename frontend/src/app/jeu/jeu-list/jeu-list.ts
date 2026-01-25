import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { JeuListService } from '../jeu-service/jeu-list-service';
import { EditeurListService } from '../../editeur/editeur-service/editeur-list-service';
import { AuthService } from '../../shared/auth/auth.service';
import { JeuComponent } from '../jeu-component/jeu-component';
import { JeuForm } from '../jeu-form/jeu-form';
import { JeuDto } from '../../types/jeu-dto';

type SortField = 'age_min' | 'age_max' ;
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-jeu-list',
  standalone: true,
  imports: [CommonModule, JeuComponent, JeuForm],
  templateUrl: './jeu-list.html',
  styleUrl: './jeu-list.css',
})
export class JeuList {
  // Services
  readonly svc = inject(JeuListService);
  readonly editeurService = inject(EditeurListService);
  readonly auth = inject(AuthService);
  jeuEnEdition = signal<JeuDto | undefined>(undefined);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  // --- ÉTATS DU COMPOSANT ---

  // Contexte Éditeur (Si on est sur /editeurs/:id/jeux)
  editeurId = signal<number | undefined>(undefined);

  isFestivalMode = signal(false);

  currentPage = signal(1);
  pageSize = 50; // Nombre d'éléments par page
  
  // On récupère l'objet éditeur complet si on a un ID
  editeur = computed(() => {
    const id = this.editeurId();
    return id ? this.editeurService.findById(id) : undefined;
  });

  // Gestion des données (Liste des jeux)
  // On crée un computed qui filtre si on est en mode "Éditeur", 
  jeux = computed(() => {
    const eId = this.editeurId();
    const list = this.svc.jeux();

    if (eId) {
      return list.filter(j => j.editeur_id === eId);
    }
    return list;
  });

  afficherFormulaire = signal(false);

  // gestion du tris
  sortField = signal<SortField>('age_min');
  sortDirection = signal<SortDirection>('asc');

  // Filtre par type
  selectedType = signal<string | 'all'>('all');
  gameTypes = ['Action', 'Aventure', 'RPG', 'Reflexion', 'Simulation', 'Strategie', 'Sport', 'Carte'];

  // Barre de recherche
  searchTerm = signal('');

  filteredJeux = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const field = this.sortField();
    const direction = this.sortDirection();
    const type = this.selectedType();

    let filtered = this.jeux()?.filter(j => j.nom.toLowerCase().includes(term)) || [];
    if (type !== 'all') {
      filtered = filtered.filter(j => j.typeG === type);
    }

    // Appliquer le tri
    filtered.sort((a, b) => {
      let valueA: any = a[field];
      let valueB: any = b[field];

      // Comparaison
      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  });

  paginatedJeux = computed(() => {
    const list = this.filteredJeux(); // On prend la liste déjà filtrée et triée
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    
    return list.slice(startIndex, endIndex);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredJeux().length / this.pageSize);
  });

  constructor() {
    effect(() => {
      this.detectContextAndLoad();
    });

    effect(() => {
      // On lit ces signaux uniquement pour déclencher le reset de la page quand ils changent
      this.searchTerm();
      this.selectedType();
      this.sortField();
      this.currentPage.set(1);
    });
  }

  private detectContextAndLoad() {
    // Cas FESTIVAL : L'ID est dans le parent (/festivals/:id/jeux)
    const festivalId = this.route.parent?.snapshot.paramMap.get('id');

    // Cas ÉDITEUR : L'ID est dans la route courante (/editeurs/:id/jeux)
    const currentRouteId = this.route.snapshot.paramMap.get('id');
    const isEditeurRoute = this.router.url.includes('/editeurs/');

    if (isEditeurRoute && currentRouteId) {
      // MODE ÉDITEUR
      const eId = Number(currentRouteId);      
      this.editeurId.set(eId);
      
      // On charge l'info de l'éditeur (pour le titre)
      if (this.editeurService.editeurs().length === 0) {
          this.editeurService.loadEditeurs(); // Charge tout si vide
      }

      this.svc.loadJeux();
      this.isFestivalMode.set(false);

    } else if (festivalId) {
      this.svc.loadJeux(Number(festivalId));
      this.isFestivalMode.set(true);

    } else {
      this.svc.loadJeux();
      this.isFestivalMode.set(false);
    }
  }

  // --- ACTIONS ---

  toggleFormulaire(): void {
    this.afficherFormulaire.update(v => !v);
  }
  retourEditeurs(): void {
    this.router.navigate(['/editeurs']);
  }
  onEdit(jeu: JeuDto): void {
    this.jeuEnEdition.set(jeu); 
    this.afficherFormulaire.set(true);
  }
  onDelete(id: number): void {
    if (confirm('Voulez-vous vraiment supprimer ce jeu ?')) {
      this.svc.delete(id);
    }
  }

  onAdd(formData: any): void {
    // Si on est sur la page d'un éditeur, on force l'ID
    const targetEditeurId = this.editeurId() || formData.editeur_id; 

    const newJeu: JeuDto = {
      id: undefined, 
      nom: formData.nom,
      typeG: formData.typeG,  
      age_min: formData.age_min,  
      age_max: formData.age_max,
      editeur_id: targetEditeurId, 
      editeur: undefined, 
      auteurs: [] 
    };
    
    this.svc.add(newJeu);
    this.afficherFormulaire.set(false);
  }

  onUpdate(updatedJeu: JeuDto): void {
    console.log('Modification du jeu:', updatedJeu);
    
    // Envoyer uniquement les champs que le backend attend
    this.svc.update({
      id: updatedJeu.id!,
      nom: updatedJeu.nom,
      typeG: updatedJeu.typeG,
      age_min: updatedJeu.age_min,
      age_max: updatedJeu.age_max,
      editeur_id: updatedJeu.editeur_id
    });
    
    this.afficherFormulaire.set(false);
    this.jeuEnEdition.set(undefined);
  }

  setSortField(field: SortField): void {
    // Si on clique sur le même champ, inverser la direction
    if (this.sortField() === field) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set('asc');
    }
  }

  getSortIndicator(field: SortField): string {
    if (this.sortField() !== field) return '';
    return this.sortDirection() === 'asc' ? ' ▲' : ' ▼';
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages()) {
      this.currentPage.set(newPage);
      
      setTimeout(() => {
        window.scrollTo({ 
          top: 0
        });
      }, 0);
    }
  }
}