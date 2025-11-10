import { TestBed } from '@angular/core/testing';

import { FestivalListService } from './festival-list-service';

describe('FestivalListService', () => {
  let service: FestivalListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FestivalListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
