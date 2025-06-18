import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TemplateStorageService, Template } from '../../services/template-storage.service';
import { TemplateValidatorService, ValidationResult, CloudFormationResource, CloudFormationParameter } from '../../services/template-validator.service';
import { TemplateExtractorService } from '../../services/template-extractor.service';
import { TemplateHierarchyService, TemplateNode } from '../../services/template-hierarchy.service';
import { ModalService } from '../../services/modal.service';

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
    private hierarchy: TemplateHierarchyService,
    public modalService: ModalService
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
      
      // Inicializar el servicio de modal
      this.modalService.initialize();
    }, 500);
    
    // Resetear el tipo activo
    this.activeResourceType = 'All';
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
          
          // Resetear el tipo de recurso activo
          this.activeResourceType = 'All';
          
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
  activeResourceType: string = 'All'; // Tipo de recurso actualmente seleccionado
  
  getResourceComponents(): TemplateNode[] {
    if (!this.templateContent) return [];
    return this.hierarchy.getHierarchicalComponents(this.templateContent, 'Resources');
  }
  
  getUniqueResourceTypes(): string[] {
    // Extraer directamente del contenido del template para mayor precisión
    if (!this.templateContent) return [];
    
    // Buscar todos los patrones "Type: AWS::*::*" en el template
    const typeRegex = /Type:\s*([A-Za-z0-9:]+)/g;
    const matches = [...this.templateContent.matchAll(typeRegex)];
    
    const types = new Set<string>();
    matches.forEach(match => {
      if (match[1] && match[1].match(/^AWS::[A-Za-z0-9]+::[A-Za-z0-9]+$/)) {
        types.add(match[1]);
      }
    });
    
    const uniqueTypes = Array.from(types).sort();
    console.log('Tipos únicos válidos encontrados:', uniqueTypes);
    return uniqueTypes;
  }
  
  getShortTypeName(fullType: string): string {
    const parts = fullType.split('::');
    if (parts.length >= 3) {
      return parts[2]; // Devuelve la última parte (Role, Instance, etc.)
    }
    return fullType;
  }
  
  getIconForResourceType(type: string): string {
    // Asignar iconos según el tipo de recurso
    if (type.includes('::IAM::')) return 'bi bi-shield-lock';
    if (type.includes('::EC2::')) return 'bi bi-hdd';
    if (type.includes('::S3::')) return 'bi bi-bucket';
    if (type.includes('::Lambda::')) return 'bi bi-code-square';
    if (type.includes('::DynamoDB::')) return 'bi bi-table';
    if (type.includes('::RDS::')) return 'bi bi-database';
    if (type.includes('::CloudFront::')) return 'bi bi-cloud';
    if (type.includes('::ApiGateway::')) return 'bi bi-diagram-3';
    if (type.includes('::SNS::')) return 'bi bi-chat-dots';
    if (type.includes('::SQS::')) return 'bi bi-envelope';
    if (type.includes('::CloudFormation::')) return 'bi bi-layers';
    if (type.includes('::ElasticLoadBalancing::')) return 'bi bi-distribute-horizontal';
    if (type.includes('::AutoScaling::')) return 'bi bi-arrow-repeat';
    if (type.includes('::Logs::')) return 'bi bi-journal-text';
    if (type.includes('::KMS::')) return 'bi bi-key';
    
    // Icono por defecto
    return 'bi bi-box';
  }
  
  countResourcesByType(type: string): number {
    return this.getResourceComponents().filter(resource => {
      const extract = resource.extract || '';
      const typePattern = `Type: ${type}`;
      return extract.includes(typePattern);
    }).length;
  }
  
  setActiveResourceType(type: string): void {
    console.log('Tipo seleccionado:', type);
    this.activeResourceType = type;
  }
  
  getFilteredResourceComponents(): TemplateNode[] {
    const resources = this.getResourceComponents();
    console.log('Total recursos:', resources.length);
    
    if (this.activeResourceType === 'All') {
      return resources;
    }
    
    // Filtrar directamente usando el extracto de cada recurso
    const filtered = resources.filter(resource => {
      const extract = resource.extract || '';
      
      // Buscar el patrón "Type: TIPO_ACTIVO" en el extracto
      const typePattern = `Type: ${this.activeResourceType}`;
      return extract.includes(typePattern);
    });
    
    console.log('Recursos filtrados por', this.activeResourceType, ':', filtered.length);
    return filtered;
  }
  
  getResourceType(resource: TemplateNode): string {
    const typeProperty = resource.children.find(prop => prop.id === 'Type');
    if (!typeProperty || !typeProperty.value) return '';
    
    // Devolver el tipo completo para mostrar en la tabla
    return typeProperty.value;
  }
  
  getResourceName(resource: TemplateNode): string {
    // Buscar en Properties > Tags > Name o Properties > Name
    const propertiesNode = resource.children.find(prop => prop.id === 'Properties');
    
    if (propertiesNode && propertiesNode.children) {
      // Buscar Tags
      const tagsNode = propertiesNode.children.find(prop => prop.id === 'Tags');
      if (tagsNode && tagsNode.children) {
        const nameTag = tagsNode.children.find(tag => 
          tag.children && tag.children.some(p => p.id === 'Key' && p.value === 'Name')
        );
        
        if (nameTag) {
          const valueNode = nameTag.children.find(p => p.id === 'Value');
          if (valueNode) return valueNode.value || '';
        }
      }
      
      // Buscar Name directo
      const nameNode = propertiesNode.children.find(prop => prop.id === 'Name');
      if (nameNode) return nameNode.value || '';
    }
    
    return '';
  }
  
  getResourceDependsOnList(resource: TemplateNode): string[] {
    const dependsOnNode = resource.children.find(prop => prop.id === 'DependsOn');
    if (!dependsOnNode) return [];
    
    if (dependsOnNode.value) {
      return [dependsOnNode.value];
    }
    
    if (dependsOnNode.children && dependsOnNode.children.length > 0) {
      return dependsOnNode.children.map(c => c.value || c.id);
    }
    
    return [];
  }
  
  getSpecificPropertiesForType(): string[] {
    // Si estamos mostrando todos los tipos, mostrar propiedades genéricas
    if (this.activeResourceType === 'All') {
      return ['Properties'];
    }
    
    // Propiedades específicas según el tipo de recurso exacto
    if (this.activeResourceType === 'AWS::IAM::Role') {
      return ['ManagedPolicyArns', 'Policies', 'AssumeRolePolicyDocument'];
    }
    
    if (this.activeResourceType === 'AWS::EC2::Instance') {
      return ['InstanceType', 'ImageId', 'SecurityGroups', 'SubnetId'];
    }
    
    if (this.activeResourceType === 'AWS::EC2::SecurityGroup') {
      return ['GroupDescription', 'VpcId', 'SecurityGroupIngress', 'SecurityGroupEgress'];
    }
    
    if (this.activeResourceType === 'AWS::S3::Bucket') {
      return ['BucketName', 'VersioningConfiguration', 'WebsiteConfiguration'];
    }
    
    if (this.activeResourceType === 'AWS::Lambda::Function') {
      return ['Runtime', 'Handler', 'Code', 'Timeout'];
    }
    
    if (this.activeResourceType === 'AWS::DynamoDB::Table') {
      return ['KeySchema', 'AttributeDefinitions'];
    }
    
    if (this.activeResourceType === 'AWS::RDS::DBInstance') {
      return ['Engine', 'DBInstanceClass', 'AllocatedStorage'];
    }
    
    if (this.activeResourceType === 'AWS::ApiGateway::RestApi') {
      return ['EndpointConfiguration', 'Body'];
    }
    
    if (this.activeResourceType === 'AWS::CloudFront::Distribution') {
      return ['DistributionConfig', 'Origins', 'DefaultCacheBehavior'];
    }
    
    // Para otros tipos, buscar propiedades no vacías
    const resources = this.getFilteredResourceComponents();
    const propertiesMap = new Map<string, number>(); // Propiedad -> Conteo de valores no vacíos
    
    resources.forEach(resource => {
      const propertiesNode = resource.children.find(prop => prop.id === 'Properties');
      if (propertiesNode && propertiesNode.children) {
        propertiesNode.children.forEach(prop => {
          // Contar solo si tiene valor o es complejo
          if (prop.value || prop.isComplex || (prop.children && prop.children.length > 0)) {
            const count = propertiesMap.get(prop.id) || 0;
            propertiesMap.set(prop.id, count + 1);
          }
        });
      }
    });
    
    // Ordenar por frecuencia y tomar las más comunes
    const sortedProperties = Array.from(propertiesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
    
    return sortedProperties.slice(0, 4); // Limitar a 4 propiedades
  }
  
  getPropertyDisplayName(propertyName: string): string {
    // Formatear nombres de propiedades para mejor visualización
    if (propertyName === 'AssumeRolePolicyDocument') return 'Assume Role Policy';
    if (propertyName === 'ManagedPolicyArns') return 'Managed Policies';
    if (propertyName === 'SecurityGroupIngress') return 'Ingress Rules';
    if (propertyName === 'SecurityGroupEgress') return 'Egress Rules';
    
    // Dividir palabras en CamelCase
    return propertyName.replace(/([A-Z])/g, ' $1').trim();
  }
  
  isSimplePropertyInResource(resource: TemplateNode, propertyName: string): boolean {
    // Verificar si es una propiedad de nivel superior
    if (propertyName === 'DependsOn') {
      const property = resource.children.find(prop => prop.id === propertyName);
      if (!property) return false;
      return !property.isComplex && property.value !== undefined;
    }
    
    // Verificar si es una propiedad dentro de Properties
    if (propertyName === 'Properties') {
      return false; // Properties siempre es complejo
    }
    
    const propertiesNode = resource.children.find(prop => prop.id === 'Properties');
    if (!propertiesNode || !propertiesNode.children) return false;
    
    const property = propertiesNode.children.find(prop => prop.id === propertyName);
    if (!property) return false;
    
    // Verificar si tiene valor y no es complejo
    return !property.isComplex && 
           property.value !== undefined && 
           property.value !== null && 
           property.value !== '';
  }
  
  isListPropertyInResource(resource: TemplateNode, propertyName: string): boolean {
    // Verificar si es una propiedad de nivel superior
    if (propertyName === 'DependsOn') {
      const property = resource.children.find(prop => prop.id === propertyName);
      if (!property) return false;
      return !!property.children && property.children.length > 0;
    }
    
    // Verificar si es Properties
    if (propertyName === 'Properties') {
      return false;
    }
    
    const propertiesNode = resource.children.find(prop => prop.id === 'Properties');
    if (!propertiesNode || !propertiesNode.children) return false;
    
    const property = propertiesNode.children.find(prop => prop.id === propertyName);
    if (!property) return false;
    
    return !!property.children && property.children.length > 0 && 
           property.children.every(child => !child.isComplex);
  }
  
  isComplexPropertyInResource(resource: TemplateNode, propertyName: string): boolean {
    // Verificar si es Properties
    if (propertyName === 'Properties') {
      return true;
    }
    
    // Verificar si es una propiedad de nivel superior
    if (propertyName === 'DependsOn') {
      return false; // Ya manejado por isListPropertyInResource
    }
    
    const propertiesNode = resource.children.find(prop => prop.id === 'Properties');
    if (!propertiesNode || !propertiesNode.children) return false;
    
    const property = propertiesNode.children.find(prop => prop.id === propertyName);
    if (!property) return false;
    
    return !!property.isComplex || 
           (property.children && property.children.length > 0 && 
            property.children.some(child => !!child.isComplex));
  }
  
  getResourcePropertyValue(resource: TemplateNode, propertyName: string): string {
    // Verificar si es una propiedad de nivel superior
    if (propertyName === 'DependsOn') {
      const property = resource.children.find(prop => prop.id === propertyName);
      return property ? property.value || '' : '';
    }
    
    // Verificar si es Properties
    if (propertyName === 'Properties') {
      return '(objeto complejo)';
    }
    
    const propertiesNode = resource.children.find(prop => prop.id === 'Properties');
    if (!propertiesNode || !propertiesNode.children) return '';
    
    const property = propertiesNode.children.find(prop => prop.id === propertyName);
    return property ? property.value || '' : '';
  }
  
  getResourcePropertyList(resource: TemplateNode, propertyName: string): string[] {
    // Verificar si es una propiedad de nivel superior
    if (propertyName === 'DependsOn') {
      const property = resource.children.find(prop => prop.id === propertyName);
      if (!property || !property.children) return [];
      return property.children.map(child => child.value || child.id);
    }
    
    const propertiesNode = resource.children.find(prop => prop.id === 'Properties');
    if (!propertiesNode || !propertiesNode.children) return [];
    
    const property = propertiesNode.children.find(prop => prop.id === propertyName);
    if (!property || !property.children) return [];
    
    return property.children.map(child => child.value || child.id);
  }
  
  getResourcePropertyExtract(resource: TemplateNode, propertyName: string): string {
    // Verificar si es Properties
    if (propertyName === 'Properties') {
      const propertiesNode = resource.children.find(prop => prop.id === 'Properties');
      return propertiesNode ? propertiesNode.extract || JSON.stringify(propertiesNode, null, 2) : '';
    }
    
    const propertiesNode = resource.children.find(prop => prop.id === 'Properties');
    if (!propertiesNode || !propertiesNode.children) return '';
    
    const property = propertiesNode.children.find(prop => prop.id === propertyName);
    return property ? property.extract || JSON.stringify(property, null, 2) : '';
  }
  
  getResourcePropertySummary(resource: TemplateNode, propertyName: string): string {
    // Obtener el extracto completo
    const extract = this.getResourcePropertyExtract(resource, propertyName);
    
    // Intentar formatear como JSON para mejor legibilidad
    try {
      const obj = JSON.parse(extract);
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      // Si no es JSON válido, devolver el extracto tal cual
      return extract;
    }
  }
  
  getParameterComponents(): TemplateNode[] {
    if (!this.templateContent) return [];
    return this.hierarchy.getHierarchicalComponents(this.templateContent, 'Parameters');
  }
  
  getParameterProperty(param: TemplateNode, propertyName: string): string {
    const property = param.children.find(prop => prop.id === propertyName);
    return property && property.value ? property.value : '';
  }
  
  getParameterAllowedValues(param: TemplateNode): string[] {
    const allowedValuesNode = param.children.find(prop => prop.id === 'AllowedValues');
    if (!allowedValuesNode || !allowedValuesNode.children) return [];
    
    return allowedValuesNode.children.map(child => child.value || child.id);
  }
  
  getOutputComponents(): TemplateNode[] {
    if (!this.templateContent) return [];
    return this.hierarchy.getHierarchicalComponents(this.templateContent, 'Outputs');
  }
  
  getOutputProperty(output: TemplateNode, propertyName: string): string {
    const property = output.children.find(prop => prop.id === propertyName);
    return property ? property.value : '';
  }
  
  getOutputPropertyExtract(output: TemplateNode, propertyName: string): string {
    const property = output.children.find(prop => prop.id === propertyName);
    return property ? property.extract : '';
  }
  
  isComplexValue(node: TemplateNode, propertyName: string): boolean {
    const property = node.children.find(prop => prop.id === propertyName);
    return property ? !!property.isComplex : false;
  }
  
  getOutputExportName(output: TemplateNode): string {
    const exportNode = output.children.find(prop => prop.id === 'Export');
    if (!exportNode || !exportNode.children) return '';
    
    const nameNode = exportNode.children.find(child => child.id === 'Name');
    return nameNode ? nameNode.value : '';
  }
  
  expandedMappings: Set<string> = new Set();
  
  getMappingComponents(): TemplateNode[] {
    if (!this.templateContent) return [];
    return this.hierarchy.getHierarchicalComponents(this.templateContent, 'Mappings');
  }
  
  getMappingKeys(mapping: TemplateNode): string[] {
    return mapping.children.map(child => child.id);
  }
  
  getMappingStructure(mapping: TemplateNode): string {
    // Usar directamente el extracto para preservar la estructura exacta
    return mapping.extract || '';
  }
  
  toggleMappingDetails(mappingId: string): void {
    if (this.expandedMappings.has(mappingId)) {
      this.expandedMappings.delete(mappingId);
    } else {
      this.expandedMappings.add(mappingId);
    }
  }
  
  isExpandedMapping(mappingId: string): boolean {
    return this.expandedMappings.has(mappingId);
  }
  
  getConditionComponents(): TemplateNode[] {
    if (!this.templateContent) return [];
    return this.hierarchy.getHierarchicalComponents(this.templateContent, 'Conditions');
  }
  
  getConditionType(condition: TemplateNode): string {
    if (!condition.children || condition.children.length === 0) return 'Desconocido';
    
    // Buscar operadores intrínsecos comunes en condiciones
    const firstChild = condition.children[0];
    if (firstChild.id.startsWith('Fn::')) {
      return firstChild.id.substring(4); // Quitar el prefijo 'Fn::'
    } else if (firstChild.id.startsWith('!')) {
      return firstChild.id; // Devolver la forma abreviada
    }
    
    return 'Personalizada';
  }
  
  getConditionExpression(condition: TemplateNode): string {
    if (!condition.children || condition.children.length === 0) return '';
    
    // Convertir la condición a un formato JSON legible
    const conditionObj: any = {};
    condition.children.forEach(child => {
      if (child.children && child.children.length > 0) {
        const nestedValues: any = {};
        child.children.forEach(grandChild => {
          if (grandChild.children && grandChild.children.length > 0) {
            const deepValues: any = {};
            grandChild.children.forEach(greatGrandChild => {
              deepValues[greatGrandChild.id] = greatGrandChild.value || '';
            });
            nestedValues[grandChild.id] = deepValues;
          } else {
            nestedValues[grandChild.id] = grandChild.value || '';
          }
        });
        conditionObj[child.id] = nestedValues;
      } else {
        conditionObj[child.id] = child.value || '';
      }
    });
    
    return JSON.stringify(conditionObj, null, 2);
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
  
  showExtract(title: string, content: string): void {
    this.modalService.show(title, content);
  }
  
  showGlobalExtract(key: string, value: any): void {
    const jsonContent = JSON.stringify(value, null, 2);
    this.modalService.show(key, jsonContent);
  }
  
  copyModalContent(): void {
    this.modalService.copyContent()
      .then(() => {
        alert('Código copiado al portapapeles');
      })
      .catch(err => {
        console.error('Error al copiar el código: ', err);
      });
  }
}