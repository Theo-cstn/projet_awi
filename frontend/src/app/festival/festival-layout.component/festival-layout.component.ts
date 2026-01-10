import { Component, inject, input } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FestivalListService } from '../festival-service/festival-list-service';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-festival-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './festival-layout.component.html',
  styleUrls: ['./festival-layout.component.css'],
})
export class FestivalLayoutComponent {
  private festivalService = inject(FestivalListService);
  private router = inject(Router)
  
  id = input.required<string>();

  festival = toSignal(
    toObservable(this.id).pipe(
      switchMap(currentId => 
        this.festivalService.getFestivalById(Number(currentId)).pipe(
          catchError(err => {
            console.error('Festival introuvable ou erreur API', err);
            
            this.router.navigate(['/festivals']);
            return of(undefined);
          })
        )
      )
    )
  ); 
}