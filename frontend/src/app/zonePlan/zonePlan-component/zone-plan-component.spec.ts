import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZonePlanComponent } from './zone-plan-component';

describe('ZonePlanComponent', () => {
  let component: ZonePlanComponent;
  let fixture: ComponentFixture<ZonePlanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZonePlanComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZonePlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
