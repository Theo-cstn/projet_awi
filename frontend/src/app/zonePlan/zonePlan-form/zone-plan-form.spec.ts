import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZonePlanForm } from './zone-plan-form';

describe('ZonePlanForm', () => {
  let component: ZonePlanForm;
  let fixture: ComponentFixture<ZonePlanForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ZonePlanForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZonePlanForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
