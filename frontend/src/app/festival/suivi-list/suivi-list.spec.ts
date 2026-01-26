import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuiviList } from './suivi-list';

describe('SuiviList', () => {
  let component: SuiviList;
  let fixture: ComponentFixture<SuiviList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuiviList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SuiviList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
