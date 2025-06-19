import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TemplateExtractorService {

  constructor() { }

  /**
   * Extrae una sección completa de nivel superior del template (Parameters, Resources, etc.)
   */
  extractSection(templateContent: string, sectionName: string): string {
    console.log(`Extrayendo sección: ${sectionName}`);
    
    const lines = templateContent.split('\n');
    let sectionContent = '';
    let inSection = false;
    let sectionIndentation = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      const lineIndentation = line.search(/\S/);
      
      // Detectar inicio de la sección
      if (trimmedLine === `${sectionName}:` || trimmedLine.startsWith(`${sectionName}:`)) {
        console.log(`Encontrada sección ${sectionName} en línea ${i + 1}`);
        inSection = true;
        sectionContent = line + '\n';
        sectionIndentation = lineIndentation;
        continue;
      }
      
      // Si estamos dentro de la sección
      if (inSection) {
        // Si encontramos otra sección de nivel superior o menor indentación, salimos
        if (trimmedLine && lineIndentation !== -1 && lineIndentation <= sectionIndentation && 
            /^[A-Za-z0-9]+:/.test(trimmedLine)) {
          console.log(`Fin de sección ${sectionName} en línea ${i + 1}: ${trimmedLine}`);
          break;
        }
        
        // Añadir la línea al contenido de la sección
        sectionContent += line + '\n';
      }
    }
    
    const result = sectionContent.trim();
    console.log(`Sección ${sectionName} extraída, longitud: ${result.length}`);
    console.log(`Primeros 200 caracteres: ${result.substring(0, 200)}`);
    
    return result;
  }
  
  /**
   * Extrae un elemento específico de una sección
   */
  extractElement(sectionContent: string, elementName: string): string {
    const lines = sectionContent.split('\n');
    let elementContent = '';
    let inElement = false;
    let indentation = -1;
    
    // Saltar la primera línea que es el nombre de la sección
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Detectar inicio del elemento
      if (trimmedLine.startsWith(`${elementName}:`)) {
        inElement = true;
        elementContent = `${elementName}:` + trimmedLine.substring(elementName.length + 1) + '\n';
        
        // Determinar la indentación del elemento
        indentation = line.search(/\S/);
        continue;
      }
      
      // Si estamos dentro del elemento
      if (inElement) {
        // Si encontramos otro elemento del mismo nivel, salimos
        const currentIndent = line.search(/\S/);
        if (line.trim() && currentIndent <= indentation && i > 0) {
          break;
        }
        
        // Añadir la línea al contenido del elemento
        elementContent += line + '\n';
      }
    }
    
    return elementContent.trim();
  }
  
  /**
   * Extrae todos los nombres de elementos de una sección
   */
  extractElementNames(sectionContent: string): string[] {
    const lines = sectionContent.split('\n');
    const elementNames: string[] = [];
    const baseIndent = lines[0].search(/\S/);
    
    // Saltar la primera línea que es el nombre de la sección
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const indent = line.search(/\S/);
      const trimmedLine = line.trim();
      
      // Si es un elemento de primer nivel dentro de la sección
      if (trimmedLine && indent === baseIndent + 2 && trimmedLine.includes(':')) {
        const elementName = trimmedLine.split(':')[0].trim();
        elementNames.push(elementName);
      }
    }
    
    return elementNames;
  }
  
  /**
   * Extrae un parámetro específico
   */
  extractParameter(templateContent: string, paramName: string): string {
    const parametersSection = this.extractSection(templateContent, 'Parameters');
    return this.extractElement(parametersSection, paramName);
  }
  
  /**
   * Extrae un recurso específico
   */
  extractResource(templateContent: string, resourceName: string): string {
    const resourcesSection = this.extractSection(templateContent, 'Resources');
    return this.extractElement(resourcesSection, resourceName);
  }
  
  /**
   * Extrae un mapping específico
   */
  extractMapping(templateContent: string, mappingName: string): string {
    const mappingsSection = this.extractSection(templateContent, 'Mappings');
    return this.extractElement(mappingsSection, mappingName);
  }
  
  /**
   * Extrae un output específico
   */
  extractOutput(templateContent: string, outputName: string): string {
    const outputsSection = this.extractSection(templateContent, 'Outputs');
    return this.extractElement(outputsSection, outputName);
  }
  
  /**
   * Extrae una condición específica
   */
  extractCondition(templateContent: string, conditionName: string): string {
    const conditionsSection = this.extractSection(templateContent, 'Conditions');
    return this.extractElement(conditionsSection, conditionName);
  }
  
  /**
   * Lista todos los nombres de parámetros
   */
  listParameters(templateContent: string): string[] {
    const parametersSection = this.extractSection(templateContent, 'Parameters');
    return this.extractElementNames(parametersSection);
  }
  
  /**
   * Lista todos los nombres de recursos
   */
  listResources(templateContent: string): string[] {
    const resourcesSection = this.extractSection(templateContent, 'Resources');
    return this.extractElementNames(resourcesSection);
  }
  
  /**
   * Lista todos los nombres de mappings
   */
  listMappings(templateContent: string): string[] {
    const mappingsSection = this.extractSection(templateContent, 'Mappings');
    return this.extractElementNames(mappingsSection);
  }
  
  /**
   * Lista todos los nombres de outputs
   */
  listOutputs(templateContent: string): string[] {
    const outputsSection = this.extractSection(templateContent, 'Outputs');
    return this.extractElementNames(outputsSection);
  }
  
  /**
   * Lista todos los nombres de condiciones
   */
  listConditions(templateContent: string): string[] {
    const conditionsSection = this.extractSection(templateContent, 'Conditions');
    return this.extractElementNames(conditionsSection);
  }
}