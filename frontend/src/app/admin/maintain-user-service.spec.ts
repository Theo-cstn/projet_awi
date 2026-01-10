import { TestBed } from '@angular/core/testing';

import { MaintainUserService } from './maintain-user-service';

describe('MaintainUserService', () => {
  let service: MaintainUserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaintainUserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
