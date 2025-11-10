import { TestBed } from '@angular/core/testing';

import { EditeurListService } from './editeur-list-service';

describe('EditeurListService', () => {
  let service: EditeurListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EditeurListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
