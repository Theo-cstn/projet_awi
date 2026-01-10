import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FestivalLayoutComponent } from './festival-layout.component';

describe('FestivalLayoutComponent', () => {
  let component: FestivalLayoutComponent;
  let fixture: ComponentFixture<FestivalLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FestivalLayoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FestivalLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
