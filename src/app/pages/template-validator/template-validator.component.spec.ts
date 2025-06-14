import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateValidatorComponent } from './template-validator.component';

describe('TemplateValidatorComponent', () => {
  let component: TemplateValidatorComponent;
  let fixture: ComponentFixture<TemplateValidatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateValidatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemplateValidatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
