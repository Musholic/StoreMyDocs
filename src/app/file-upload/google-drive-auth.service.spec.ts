import { TestBed } from '@angular/core/testing';

import { GoogleDriveAuthService } from './google-drive-auth.service';

describe('GoogleDriveAuthService', () => {
  let service: GoogleDriveAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleDriveAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
