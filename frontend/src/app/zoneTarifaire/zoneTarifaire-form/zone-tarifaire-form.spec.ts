import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoneTarifaireForm } from './zone-tarifaire-form';

describe('ZoneTarifaireForm', () => {
  let component: ZoneTarifaireForm;
  let fixture: ComponentFixture<ZoneTarifaireForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoneTarifaireForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZoneTarifaireForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
