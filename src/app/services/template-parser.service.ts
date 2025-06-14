import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TemplateParserService {

  constructor() { }

  /**
   * Extrae las secciones de nivel superior de un template CloudFormation
   */
  parseTemplate(templateContent: string): { [key: string]: any } {
    const result: { [key: string]: any } = {
      Parameters: {},
      Mappings: {},
      Resources: {},
      Outputs: {},
      Conditions: {},
      Globals: {}
    };

    try {
      // Detectar secciones de nivel superior en el template
      const topLevelRegex = /^([A-Za-z0-9]+):\s*$/gm;
      let match;
      let sections = [];
      
      while ((match = topLevelRegex.exec(templateContent)) !== null) {
        sections.push({
          name: match[1],
          position: match.index
        });
      }
      
      // Ordenar secciones por posición
      sections.sort((a, b) => a.position - b.position);
      
      // Extraer contenido de cada sección
      const extractedSections: any = {};
      
      for (let i = 0; i < sections.length; i++) {
        const currentSection = sections[i];
        const nextSection = sections[i + 1];
        
        const startPos = templateContent.indexOf(':', currentSection.position) + 1;
        const endPos = nextSection ? nextSection.position : templateContent.length;
        
        let sectionContent = templateContent.substring(startPos, endPos).trim();
        extractedSections[currentSection.name] = sectionContent;
      }
      
      console.log('Secciones de nivel superior extraídas:', Object.keys(extractedSections));
      
      // Procesar cada sección extraída
      if (extractedSections['Parameters']) {
        result['Parameters'] = this.parseParametersSection(extractedSections['Parameters']);
      }
      
      if (extractedSections['Resources']) {
        result['Resources'] = this.parseResourcesSection(extractedSections['Resources']);
      }
      
      if (extractedSections['Mappings']) {
        result['Mappings'] = this.parseMappingsSection(extractedSections['Mappings']);
      }
      
      if (extractedSections['Outputs']) {
        result['Outputs'] = this.parseOutputsSection(extractedSections['Outputs']);
      }
      
      if (extractedSections['Conditions']) {
        result['Conditions'] = this.parseConditionsSection(extractedSections['Conditions']);
      }
      
      if (extractedSections['Globals']) {
        result['Globals'] = this.parseGlobalsSection(extractedSections['Globals']);
      }
      
      // Extraer otras propiedades de nivel superior
      if (extractedSections['AWSTemplateFormatVersion']) {
        result['AWSTemplateFormatVersion'] = extractedSections['AWSTemplateFormatVersion'].trim();
      }
      
      if (extractedSections['Transform']) {
        result['Transform'] = extractedSections['Transform'].trim();
      }
      
      if (extractedSections['Description']) {
        result['Description'] = extractedSections['Description'].trim();
      }
      
      return result;
    } catch (error) {
      console.error('Error al parsear el template:', error);
      return result;
    }
  }

  /**
   * Parsea la sección Parameters
   */
  private parseParametersSection(content: string): { [key: string]: any } {
    const parameters: { [key: string]: any } = {};
    
    try {
      const lines = content.split('\n');
      let currentParam = '';
      let paramContent = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith(' ') && trimmedLine.includes(':')) {
          // Nueva entrada de parámetro
          if (currentParam) {
            // Guardar parámetro anterior
            parameters[currentParam] = { content: paramContent };
          }
          
          // Iniciar nuevo parámetro
          const parts = trimmedLine.split(':');
          currentParam = parts[0].trim();
          paramContent = parts.slice(1).join(':').trim() + '\n';
        } else if (currentParam) {
          // Añadir línea al parámetro actual
          paramContent += line + '\n';
        }
      }
      
      // Procesar el último parámetro
      if (currentParam) {
        parameters[currentParam] = { content: paramContent };
      }
    } catch (e) {
      console.error('Error al procesar Parameters:', e);
    }
    
    return parameters;
  }

  /**
   * Parsea la sección Resources
   */
  private parseResourcesSection(content: string): { [key: string]: any } {
    const resources: { [key: string]: any } = {};
    
    try {
      const lines = content.split('\n');
      let currentResource = '';
      let resourceContent = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith(' ') && trimmedLine.includes(':')) {
          // Nueva entrada de recurso
          if (currentResource) {
            // Guardar recurso anterior
            resources[currentResource] = { content: resourceContent };
          }
          
          // Iniciar nuevo recurso
          const parts = trimmedLine.split(':');
          currentResource = parts[0].trim();
          resourceContent = parts.slice(1).join(':').trim() + '\n';
        } else if (currentResource) {
          // Añadir línea al recurso actual
          resourceContent += line + '\n';
        }
      }
      
      // Procesar el último recurso
      if (currentResource) {
        resources[currentResource] = { content: resourceContent };
      }
    } catch (e) {
      console.error('Error al procesar Resources:', e);
    }
    
    return resources;
  }

  /**
   * Parsea la sección Mappings
   */
  private parseMappingsSection(content: string): { [key: string]: any } {
    const mappings: { [key: string]: any } = {};
    
    try {
      const lines = content.split('\n');
      let currentMapping = '';
      let mappingContent = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith(' ') && trimmedLine.includes(':')) {
          // Nueva entrada de mapping
          if (currentMapping) {
            // Guardar mapping anterior
            mappings[currentMapping] = { content: mappingContent };
          }
          
          // Iniciar nuevo mapping
          const parts = trimmedLine.split(':');
          currentMapping = parts[0].trim();
          mappingContent = parts.slice(1).join(':').trim() + '\n';
        } else if (currentMapping) {
          // Añadir línea al mapping actual
          mappingContent += line + '\n';
        }
      }
      
      // Procesar el último mapping
      if (currentMapping) {
        mappings[currentMapping] = { content: mappingContent };
      }
    } catch (e) {
      console.error('Error al procesar Mappings:', e);
    }
    
    return mappings;
  }

  /**
   * Parsea la sección Outputs
   */
  private parseOutputsSection(content: string): { [key: string]: any } {
    const outputs: { [key: string]: any } = {};
    
    try {
      const lines = content.split('\n');
      let currentOutput = '';
      let outputContent = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith(' ') && trimmedLine.includes(':')) {
          // Nueva entrada de output
          if (currentOutput) {
            // Guardar output anterior
            outputs[currentOutput] = { content: outputContent };
          }
          
          // Iniciar nuevo output
          const parts = trimmedLine.split(':');
          currentOutput = parts[0].trim();
          outputContent = parts.slice(1).join(':').trim() + '\n';
        } else if (currentOutput) {
          // Añadir línea al output actual
          outputContent += line + '\n';
        }
      }
      
      // Procesar el último output
      if (currentOutput) {
        outputs[currentOutput] = { content: outputContent };
      }
    } catch (e) {
      console.error('Error al procesar Outputs:', e);
    }
    
    return outputs;
  }

  /**
   * Parsea la sección Conditions
   */
  private parseConditionsSection(content: string): { [key: string]: any } {
    const conditions: { [key: string]: any } = {};
    
    try {
      const lines = content.split('\n');
      let currentCondition = '';
      let conditionContent = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith(' ') && trimmedLine.includes(':')) {
          // Nueva entrada de condición
          if (currentCondition) {
            // Guardar condición anterior
            conditions[currentCondition] = { content: conditionContent };
          }
          
          // Iniciar nueva condición
          const parts = trimmedLine.split(':');
          currentCondition = parts[0].trim();
          conditionContent = parts.slice(1).join(':').trim() + '\n';
        } else if (currentCondition) {
          // Añadir línea a la condición actual
          conditionContent += line + '\n';
        }
      }
      
      // Procesar la última condición
      if (currentCondition) {
        conditions[currentCondition] = { content: conditionContent };
      }
    } catch (e) {
      console.error('Error al procesar Conditions:', e);
    }
    
    return conditions;
  }

  /**
   * Parsea la sección Globals
   */
  private parseGlobalsSection(content: string): { [key: string]: any } {
    const globals: { [key: string]: any } = {};
    
    try {
      const lines = content.split('\n');
      let currentGlobal = '';
      let globalContent = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith(' ') && trimmedLine.includes(':')) {
          // Nueva entrada global
          if (currentGlobal) {
            // Guardar global anterior
            globals[currentGlobal] = { content: globalContent };
          }
          
          // Iniciar nuevo global
          const parts = trimmedLine.split(':');
          currentGlobal = parts[0].trim();
          globalContent = parts.slice(1).join(':').trim() + '\n';
        } else if (currentGlobal) {
          // Añadir línea al global actual
          globalContent += line + '\n';
        }
      }
      
      // Procesar el último global
      if (currentGlobal) {
        globals[currentGlobal] = { content: globalContent };
      }
    } catch (e) {
      console.error('Error al procesar Globals:', e);
    }
    
    return globals;
  }
}