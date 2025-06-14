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
  activeComponentType: string = '';
  
  // Para los modales
  detailModal: any;

  constructor(
    private templateStorage: TemplateStorageService,
    private validator: TemplateValidatorService
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
    
    // Inicializar los modales cuando el componente se carga
    setTimeout(() => {
      const resourceModalElement = document.getElementById('resourceDetailModal');
      
      if (typeof window !== 'undefined' && (window as any).bootstrap) {
        if (resourceModalElement) {
          this.detailModal = new (window as any).bootstrap.Modal(resourceModalElement);
        }
      }
    }, 500);
  }

  loadTemplates(): void {
    this.templateStorage.getAllTemplates().subscribe(templates => {
      // Filtrar solo los templates YAML
      this.templates = templates.filter(t => t.type === 'YAML');
      console.log('Templates cargados:', this.templates);
    });
  }

  selectTemplate(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const templateId = parseInt(selectElement.value, 10);
    
    console.log('Template seleccionado ID:', templateId);
    
    if (!isNaN(templateId)) {
      this.selectedTemplateId = templateId;
      this.validationResult = null;
      this.activeComponentType = '';
      
      // Validar automáticamente al seleccionar
      this.validateTemplate();
    } else {
      this.selectedTemplateId = null;
    }
  }

  validateTemplate(): void {
    if (!this.selectedTemplateId) return;
    
    console.log('Iniciando validación del template ID:', this.selectedTemplateId);
    this.isValidating = true;
    
    this.templateStorage.getTemplateById(this.selectedTemplateId).subscribe({
      next: (template) => {
        console.log('Template obtenido:', template);
        
        if (template && typeof template.content === 'string') {
          console.log('Contenido del template (primeros 100 caracteres):', template.content.substring(0, 100));
          
          // Validar el template
          this.validationResult = this.validator.validateTemplate(template.content);
          console.log('Resultado de validación:', this.validationResult);
          
          // Actualizar el estado del template en la base de datos
          if (template.id !== undefined) {
            const updatedTemplate = { ...template };
            updatedTemplate.status = this.validationResult.isValid ? 'Válido' : 'Error';
            this.templateStorage.saveTemplate(updatedTemplate).subscribe({
              error: (err) => console.error('Error al actualizar el estado del template:', err)
            });
          }
          
          // Mostrar recursos por defecto si hay
          if (this.getResourceCount() > 0) {
            this.activeComponentType = 'resources';
          }
        } else {
          console.error('El template no tiene contenido o no es una cadena:', template);
        }
        this.isValidating = false;
      },
      error: (err) => {
        console.error('Error al obtener el template:', err);
        this.isValidating = false;
      }
    });
  }

  toggleComponentView(componentType: string): void {
    if (this.activeComponentType === componentType) {
      // Si ya está activo, lo desactivamos
      this.activeComponentType = '';
    } else {
      // Si no está activo, lo activamos
      this.activeComponentType = componentType;
    }
  }

  getComponentTitle(): string {
    switch (this.activeComponentType) {
      case 'resources': return 'Recursos';
      case 'parameters': return 'Parámetros';
      case 'outputs': return 'Outputs';
      case 'mappings': return 'Mappings';
      case 'conditions': return 'Condiciones';
      default: return '';
    }
  }

  showResourceDetail(resource: CloudFormationResource): void {
    console.log('Mostrando detalle del recurso:', resource);
    this.selectedResource = resource;
    this.resourceCode = JSON.stringify(resource.properties, null, 2);
    
    // Mostrar el modal de detalles del recurso
    if (this.detailModal) {
      this.detailModal.show();
    } else {
      console.error('No se pudo inicializar el modal de detalles');
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