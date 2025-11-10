import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoneTarifaireComponent } from './zone-tarifaire-component';

describe('ZoneTarifaireComponent', () => {
  let component: ZoneTarifaireComponent;
  let fixture: ComponentFixture<ZoneTarifaireComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoneTarifaireComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZoneTarifaireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
