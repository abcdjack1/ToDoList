import { HttpClientModule } from '@angular/common/http'
import { TestBed } from '@angular/core/testing';

import { ToDoService } from './task.service';

describe('ToDoService', () => {
  let service: ToDoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule]
    });
    service = TestBed.inject(ToDoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
