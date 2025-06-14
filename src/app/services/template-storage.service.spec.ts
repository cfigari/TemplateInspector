import { TestBed } from '@angular/core/testing';

import { TemplateStorageService } from './template-storage.service';

describe('TemplateStorageService', () => {
  let service: TemplateStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemplateStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
