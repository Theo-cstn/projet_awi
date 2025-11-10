import { TestBed } from '@angular/core/testing';

import { ZoneTarifaireListService } from './zone-tarifaire-list-service';

describe('ZoneTarifaireListService', () => {
  let service: ZoneTarifaireListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZoneTarifaireListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
