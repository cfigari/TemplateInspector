import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TemplateStorageService, Template } from '../../services/template-storage.service';
import { TemplateValidatorService, ValidationResult, CloudFormationResource } from '../../services/template-validator.service';

@Component({
  selector: 'app-template-validator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './template-validator.component.html',
  styleUrl: './template-validator.component.css'
})
export class TemplateValidatorComponent implements OnInit {
  templates: Template[] = [];
  selectedTemplateId: number | null = null;
  validationResult: ValidationResult | null = null;
  isValidating = false;
  selectedResource: CloudFormationResource | null = null;
  resourceCode: string = '';
  activeTab: string = 'resources';
  
  // Para el modal de detalle
  detailModal: any;

  constructor(
    private templateStorage: TemplateStorageService,
    private validator: TemplateValidatorService
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
    
    // Inicializar el modal cuando el componente se carga
    setTimeout(() => {
      const modalElement = document.getElementById('resourceDetailModal');
      if (modalElement && typeof window !== 'undefined' && (window as any).bootstrap) {
        this.detailModal = new (window as any).bootstrap.Modal(modalElement);
      }
    }, 500);
  }

  loadTemplates(): void {
    this.templateStorage.getAllTemplates().subscribe(templates => {
      // Filtrar solo los templates YAML
      this.templates = templates.filter(t => t.type === 'YAML');
    });
  }

  selectTemplate(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const templateId = parseInt(selectElement.value, 10);
    
    if (!isNaN(templateId)) {
      this.selectedTemplateId = templateId;
      this.validationResult = null;
    } else {
      this.selectedTemplateId = null;
    }
  }

  validateTemplate(): void {
    if (!this.selectedTemplateId) return;
    
    this.isValidating = true;
    
    this.templateStorage.getTemplateById(this.selectedTemplateId).subscribe({
      next: (template) => {
        if (template && typeof template.content === 'string') {
          // Validar el template
          this.validationResult = this.validator.validateTemplate(template.content);
          
          // Actualizar el estado del template en la base de datos
          if (template.id !== undefined) {
            const updatedTemplate = { ...template };
            updatedTemplate.status = this.validationResult.isValid ? 'Válido' : 'Error';
            this.templateStorage.saveTemplate(updatedTemplate).subscribe({
              error: (err) => console.error('Error al actualizar el estado del template:', err)
            });
          }
          
          // Establecer la pestaña activa inicial
          this.setInitialActiveTab();
        }
        this.isValidating = false;
      },
      error: (err) => {
        console.error('Error al obtener el template:', err);
        this.isValidating = false;
      }
    });
  }

  setInitialActiveTab(): void {
    if (this.getResourceCount() > 0) {
      this.activeTab = 'resources';
    } else if (this.getParameterCount() > 0) {
      this.activeTab = 'parameters';
    } else if (this.getOutputCount() > 0) {
      this.activeTab = 'outputs';
    } else if (this.getMappingCount() > 0) {
      this.activeTab = 'mappings';
    } else if (this.getConditionCount() > 0) {
      this.activeTab = 'conditions';
    }
  }

  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
  }

  showResourceDetail(resource: CloudFormationResource): void {
    this.selectedResource = resource;
    this.resourceCode = JSON.stringify(resource.properties, null, 2);
    
    if (this.detailModal) {
      this.detailModal.show();
    } else {
      alert('No se pudo inicializar el modal. Detalles del recurso: ' + resource.logicalId);
    }
  }

  getResourceCount(): number {
    return this.validationResult?.resources.length || 0;
  }

  getParameterCount(): number {
    return this.validationResult ? Object.keys(this.validationResult.parameters).length : 0;
  }

  getOutputCount(): number {
    return this.validationResult ? Object.keys(this.validationResult.outputs).length : 0;
  }

  getMappingCount(): number {
    return this.validationResult ? Object.keys(this.validationResult.mappings).length : 0;
  }

  getConditionCount(): number {
    return this.validationResult ? Object.keys(this.validationResult.conditions).length : 0;
  }

  copyResourceCode(): void {
    if (this.resourceCode) {
      navigator.clipboard.writeText(this.resourceCode)
        .then(() => {
          alert('Código copiado al portapapeles');
        })
        .catch(err => {
          console.error('Error al copiar el código: ', err);
        });
    }
  }
}