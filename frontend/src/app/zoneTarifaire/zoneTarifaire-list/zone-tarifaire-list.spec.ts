import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoneTarifaireList } from './zone-tarifaire-list';

describe('ZoneTarifaireList', () => {
  let component: ZoneTarifaireList;
  let fixture: ComponentFixture<ZoneTarifaireList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZoneTarifaireList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZoneTarifaireList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
