import { Component } from '@angular/core';
import { FestivalList } from "./festival/festival-list/festival-list";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FestivalList],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {

}