import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JeuForm } from './jeu-form';

describe('JeuForm', () => {
  let component: JeuForm;
  let fixture: ComponentFixture<JeuForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JeuForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JeuForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
