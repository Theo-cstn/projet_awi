import { Component, inject, signal, OnInit, computed, effect } from '@angular/core'; // + effect
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { EditeurListService } from '../editeur-service/editeur-list-service';
import { AuthService } from '../../shared/auth/auth.service';
import { EditeurComponent } from '../editeur-component/editeur-component';
import { EditeurForm } from '../editeur-form/editeur-form';
import { EditeurDto } from '../../types/editeur-dto';

@Component({
  selector: 'app-editeur-list',
  standalone: true,
  imports: [CommonModule, RouterLink, EditeurComponent, EditeurForm],
  templateUrl: './editeur-list.html',
  styleUrl: './editeur-list.css'
})
export class EditeurList implements OnInit {
  // Services
  readonly svc = inject(EditeurListService);
  readonly auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  readonly editeurs = this.svc.editeurs;

  // État du formulaire
  afficherFormulaire = signal(false);
  editeurEnEdition = signal<EditeurDto | undefined>(undefined);
  isFestivalMode = signal(false);

  currentPage = signal(1);
  pageSize = 50; // Nombre d'éditeurs par page

  searchTerm = signal('');

  constructor() {
    effect(() => {
      this.searchTerm();
      this.currentPage.set(1);
    });
  }

  ngOnInit(): void {
    this.loadData();
  }

  private loadData() {
    const parentId = this.route.parent?.snapshot.paramMap.get('id');
    
    if (parentId) {
       this.svc.loadEditeurs(Number(parentId));
       this.isFestivalMode.set(true);
    } else {
       this.svc.loadEditeurs();
       this.isFestivalMode.set(false);
    }
  }

  toggleFormulaire(): void {
    this.afficherFormulaire.update(v => !v);
  }

  onAdd(formData: any): void {
    const nouvelEditeur: EditeurDto = {
      id: undefined,
      nom: formData.nom,
      contacts: [],
    };
    this.svc.add(nouvelEditeur);
    this.afficherFormulaire.set(false);
  }

  onEdit(editeur: EditeurDto): void {
    this.editeurEnEdition.set(editeur);
    this.afficherFormulaire.set(true);
  }

  onUpdate(updatedEditeur: EditeurDto): void {
    console.log('✏️ Modification de l\'editeur:', updatedEditeur);

    this.svc.update({
      id: updatedEditeur.id!,
      nom: updatedEditeur.nom
    });

    this.afficherFormulaire.set(false);
    this.editeurEnEdition.set(undefined);
  }

  filteredEditeurs = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.editeurs()?.filter(e => e.nom.toLowerCase().includes(term)) || [];
  });


  paginatedEditeurs = computed(() => {
    const list = this.filteredEditeurs();
    const startIndex = (this.currentPage() - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    
    return list.slice(startIndex, endIndex);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredEditeurs().length / this.pageSize);
  });


  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages()) {
      this.currentPage.set(newPage);
      
      setTimeout(() => {
        window.scrollTo({ 
          top: document.body.scrollHeight
        });
      }, 0);
    }
  }
}