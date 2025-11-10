import { TestBed } from '@angular/core/testing';

import { JeuListService } from './jeu-list-service';

describe('JeuListService', () => {
  let service: JeuListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JeuListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
