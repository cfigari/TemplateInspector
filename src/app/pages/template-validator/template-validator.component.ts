import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TemplateStorageService, Template } from '../../services/template-storage.service';
import { TemplateValidatorService, ValidationResult, CloudFormationResource, CloudFormationParameter } from '../../services/template-validator.service';
import { TemplateExtractorService } from '../../services/template-extractor.service';
import { ExtractBlockComponent } from '../../shared/extract-block/extract-block.component';
import { TemplateHierarchyService, TemplateNode } from '../../services/template-hierarchy.service';

@Component({
  selector: 'app-template-validator',
  standalone: true,
  imports: [CommonModule, FormsModule, ExtractBlockComponent],
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
  selectedParameterName: string = '';
  selectedParameter: CloudFormationParameter | null = null;
  parameterCode: string = '';
  activeComponentType: string = '';
  templateContent: string = '';
  
  // Secciones de nivel superior de CloudFormation
  cfnSections = ['resources', 'parameters', 'mappings', 'outputs', 'conditions', 'globals'];
  
  // Para los modales
  detailModal: any;
  parameterModal: any;

  constructor(
    private templateStorage: TemplateStorageService,
    private validator: TemplateValidatorService,
    private extractor: TemplateExtractorService,
    private hierarchy: TemplateHierarchyService
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
    
    // Inicializar los modales cuando el componente se carga
    setTimeout(() => {
      const resourceModalElement = document.getElementById('resourceDetailModal');
      const parameterModalElement = document.getElementById('parameterDetailModal');
      
      if (typeof window !== 'undefined' && (window as any).bootstrap) {
        if (resourceModalElement) {
          this.detailModal = new (window as any).bootstrap.Modal(resourceModalElement);
        }
        if (parameterModalElement) {
          this.parameterModal = new (window as any).bootstrap.Modal(parameterModalElement);
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
          
          // Guardar el contenido del template
          this.templateContent = template.content;
          
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
          
          // Mostrar la primera sección disponible por defecto
          this.setDefaultActiveSection();
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

  setDefaultActiveSection(): void {
    // Siempre mostrar recursos por defecto si hay
    if (this.getResourceCount() > 0) {
      this.activeComponentType = 'resources';
      return;
    }
    
    // Si no hay recursos, buscar la primera sección que tenga contenido
    for (const section of this.cfnSections) {
      if (section === 'resources') continue; // Ya verificamos recursos
      
      let count = 0;
      switch (section) {
        case 'parameters': count = this.getParameterCount(); break;
        case 'mappings': count = this.getMappingCount(); break;
        case 'outputs': count = this.getOutputCount(); break;
        case 'conditions': count = this.getConditionCount(); break;
        case 'globals': count = this.getGlobalCount(); break;
      }
      
      if (count > 0) {
        this.activeComponentType = section;
        return;
      }
    }
  }

  showResourceDetail(resource: CloudFormationResource): void {
    console.log('Mostrando detalle del recurso:', resource);
    this.selectedResource = resource;
    
    // Extraer el recurso exactamente como aparece en el template
    this.resourceCode = this.getExtractedResource(resource.logicalId);
    
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
  
  getGlobalCount(): number {
    return this.validationResult && this.validationResult.globals ? 
      Object.keys(this.validationResult.globals).length : 0;
  }

  showParameterDetail(paramName: string, parameter: CloudFormationParameter): void {
    console.log('Mostrando detalle del parámetro:', paramName);
    this.selectedParameterName = paramName;
    this.selectedParameter = parameter;
    
    // Extraer el parámetro exactamente como aparece en el template
    this.parameterCode = this.getExtractedParameter(paramName);
    
    // Mostrar el modal de detalles del parámetro
    if (this.parameterModal) {
      this.parameterModal.show();
    } else {
      console.error('No se pudo inicializar el modal de detalles del parámetro');
    }
  }
  
  getExtractedParameter(paramName: string): string {
    return this.extractor.extractParameter(this.templateContent, paramName);
  }
  
  getExtractedResource(resourceName: string): string {
    return this.extractor.extractResource(this.templateContent, resourceName);
  }
  
  getExtractedMapping(mappingName: string): string {
    return this.extractor.extractMapping(this.templateContent, mappingName);
  }
  
  getExtractedOutput(outputName: string): string {
    return this.extractor.extractOutput(this.templateContent, outputName);
  }
  
  getExtractedCondition(conditionName: string): string {
    return this.extractor.extractCondition(this.templateContent, conditionName);
  }
  
  getSectionContent(section: string): string {
    if (!this.templateContent || !this.validationResult) return '';
    
    return this.extractor.extractSection(this.templateContent, section);
  }
  
  getResourceNames(): string[] {
    if (!this.validationResult) return [];
    
    return this.validationResult.resources.map(resource => resource.logicalId);
  }
  
  getParameterNames(): string[] {
    if (!this.validationResult) return [];
    
    return Object.keys(this.validationResult.parameters);
  }
  
  getOutputNames(): string[] {
    if (!this.validationResult) return [];
    
    return Object.keys(this.validationResult.outputs);
  }
  
  getMappingNames(): string[] {
    if (!this.validationResult) return [];
    
    return Object.keys(this.validationResult.mappings);
  }
  
  getConditionNames(): string[] {
    if (!this.validationResult) return [];
    
    return Object.keys(this.validationResult.conditions);
  }
  
  // Métodos para obtener componentes jerárquicos basados en la indentación
  getResourceComponents(): TemplateNode[] {
    if (!this.templateContent) return [];
    return this.hierarchy.getHierarchicalComponents(this.templateContent, 'Resources');
  }
  
  getParameterComponents(): TemplateNode[] {
    if (!this.templateContent) return [];
    return this.hierarchy.getHierarchicalComponents(this.templateContent, 'Parameters');
  }
  
  getOutputComponents(): TemplateNode[] {
    if (!this.templateContent) return [];
    return this.hierarchy.getHierarchicalComponents(this.templateContent, 'Outputs');
  }
  
  getMappingComponents(): TemplateNode[] {
    if (!this.templateContent) return [];
    return this.hierarchy.getHierarchicalComponents(this.templateContent, 'Mappings');
  }
  
  getConditionComponents(): TemplateNode[] {
    if (!this.templateContent) return [];
    return this.hierarchy.getHierarchicalComponents(this.templateContent, 'Conditions');
  }
  
  extractParameter(paramName: string, parameter: CloudFormationParameter): void {
    // Extraer el parámetro exactamente como aparece en el template
    const extractedParam = this.getExtractedParameter(paramName);
    
    // Copiar al portapapeles
    navigator.clipboard.writeText(extractedParam)
      .then(() => {
        alert(`Parámetro ${paramName} copiado al portapapeles`);
      })
      .catch(err => {
        console.error('Error al copiar el parámetro: ', err);
      });
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
  
  copyParameterCode(): void {
    if (this.parameterCode) {
      navigator.clipboard.writeText(this.parameterCode)
        .then(() => {
          alert('Código del parámetro copiado al portapapeles');
        })
        .catch(err => {
          console.error('Error al copiar el código del parámetro: ', err);
        });
    }
  }
}