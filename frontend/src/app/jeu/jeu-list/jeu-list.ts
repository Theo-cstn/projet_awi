import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router'; // Ajout de Router
import { JeuListService } from '../jeu-service/jeu-list-service';
import { EditeurListService } from '../../editeur/editeur-service/editeur-list-service'; // Ajout du service éditeur
import { AuthService } from '../../shared/auth/auth.service';
import { JeuComponent } from '../jeu-component/jeu-component';
import { JeuForm } from '../jeu-form/jeu-form';
import { JeuDto } from '../../types/jeu-dto';

@Component({
  selector: 'app-jeu-list',
  standalone: true,
  imports: [CommonModule, RouterLink, JeuComponent, JeuForm],
  templateUrl: './jeu-list.html',
  styleUrl: './jeu-list.css',
})
export class JeuList implements OnInit {
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

  // --- INITIALISATION ---

  ngOnInit(): void {
    this.detectContextAndLoad();
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

    } else if (festivalId) {
      this.svc.loadJeux(Number(festivalId));

    } else {
      this.svc.loadJeux();
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
    const targetEditeurId = this.editeurId() || formData.editeurId;

    const newJeu: JeuDto = {
      id: undefined, 
      nom: formData.nom,
      typeG: formData.type,  
      age_min: formData.ageMin,  
      age_max: formData.ageMax,
      editeur_id: targetEditeurId, 
      editeur: undefined, 
      auteurs: [] 
    };
    
    this.svc.add(newJeu);
    this.afficherFormulaire.set(false);
  }

  onUpdate(updatedJeu: JeuDto): void {
    console.log('✏️ Modification du jeu:', updatedJeu);
    
    // ✨ Envoyer uniquement les champs que le backend attend
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
}