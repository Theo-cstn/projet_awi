import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JeuList } from './jeu-list';

describe('JeuList', () => {
  let component: JeuList;
  let fixture: ComponentFixture<JeuList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JeuList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JeuList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
