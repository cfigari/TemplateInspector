import { Injectable } from '@angular/core';

export interface CloudFormationResource {
  type: string;
  logicalId: string;
  properties: any;
  dependsOn?: string[];
  metadata?: any;
  condition?: string;
}

export interface CloudFormationParameter {
  type: string;
  description?: string;
  default?: any;
  allowedValues?: string[];
  constraintDescription?: string;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  allowedPattern?: string;
  noEcho?: boolean;
  rawContent?: string;
}

export interface CloudFormationOutput {
  description?: string;
  value: any;
  export?: {
    name: string;
  };
  condition?: string;
}

export interface CloudFormationMapping {
  [key: string]: {
    [key: string]: any;
  };
}

export interface CloudFormationCondition {
  condition: any;
}

export interface CloudFormationGlobal {
  [key: string]: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  resources: CloudFormationResource[];
  parameters: { [key: string]: CloudFormationParameter };
  outputs: { [key: string]: CloudFormationOutput };
  mappings: { [key: string]: CloudFormationMapping };
  conditions: { [key: string]: CloudFormationCondition };
  globals?: { [key: string]: CloudFormationGlobal };
}

@Injectable({
  providedIn: 'root'
})
export class TemplateValidatorService {

  validateTemplate(templateContent: string): ValidationResult {
    console.log('Iniciando validación del template');
    
    const result: ValidationResult = {
      isValid: false,
      errors: [],
      resources: [],
      parameters: {},
      outputs: {},
      mappings: {},
      conditions: {},
      globals: {}
    };

    try {
      // Parsear el template directamente
      const parsedTemplate = this.parseTemplate(templateContent);
      console.log('Template parseado:', parsedTemplate);
      
      // Validar formato AWSTemplateFormatVersion
      if (parsedTemplate['AWSTemplateFormatVersion']) {
        const version = parsedTemplate['AWSTemplateFormatVersion'].replace(/['"]/g, '');
        if (version !== '2010-09-09') {
          console.log('Versión no soportada:', version);
          result.errors.push(`Versión de template no soportada: ${version}`);
        }
      }

      // Procesar recursos
      if (parsedTemplate['Resources']) {
        console.log('Procesando recursos...', Object.keys(parsedTemplate['Resources']).length);
        for (const logicalId in parsedTemplate['Resources']) {
          const resourceContent = parsedTemplate['Resources'][logicalId].content || '';
          let resourceType = 'Unknown';
          
          const typeMatch = resourceContent.match(/Type:\s*([^\s\n]+)/);
          if (typeMatch && typeMatch[1]) {
            resourceType = typeMatch[1];
          }
          
          result.resources.push({
            logicalId,
            type: resourceType,
            properties: { content: resourceContent }
          });
        }
        console.log(`Recursos procesados: ${result.resources.length}`);
      }

      // Procesar parámetros
      if (parsedTemplate['Parameters']) {
        console.log('Procesando parámetros...', Object.keys(parsedTemplate['Parameters']).length);
        for (const paramName in parsedTemplate['Parameters']) {
          const paramContent = parsedTemplate['Parameters'][paramName].content || '';
          let paramType = 'String';
          let paramDesc = '';
          let paramDefault = undefined;
          
          const typeMatch = paramContent.match(/Type:\s*([^\s\n]+)/);
          if (typeMatch && typeMatch[1]) {
            paramType = typeMatch[1].trim();
          }
          
          const descMatch = paramContent.match(/Description:\s*(.+?)(\n|$)/);
          if (descMatch && descMatch[1]) {
            paramDesc = descMatch[1].trim();
          }
          
          const defaultMatch = paramContent.match(/Default:\s*(.+?)(\n|$)/);
          if (defaultMatch && defaultMatch[1]) {
            paramDefault = defaultMatch[1].trim();
          }
          
          const paramAllowedValues: string[] = [];
          if (paramContent.includes('AllowedValues:')) {
            const allowedValuesRegex = /AllowedValues:[\s\S]*?(?:- (.+?)(?:\n|$))/g;
            let allowedMatch;
            while ((allowedMatch = allowedValuesRegex.exec(paramContent)) !== null) {
              if (allowedMatch[1]) {
                paramAllowedValues.push(allowedMatch[1].trim());
              }
            }
          }
          
          result.parameters[paramName] = {
            type: paramType,
            description: paramDesc,
            default: paramDefault,
            allowedValues: paramAllowedValues,
            rawContent: paramContent
          };
        }
        console.log(`Parámetros procesados: ${Object.keys(result.parameters).length}`);
      }

      // Procesar outputs
      if (parsedTemplate['Outputs']) {
        console.log('Procesando outputs...', Object.keys(parsedTemplate['Outputs']).length);
        for (const outputName in parsedTemplate['Outputs']) {
          const outputContent = parsedTemplate['Outputs'][outputName].content || '';
          let outputValue = 'Unknown';
          let outputDesc = '';
          let outputExport = undefined;
          
          const valueMatch = outputContent.match(/Value:\s*(.+?)(\n|$)/);
          if (valueMatch && valueMatch[1]) {
            outputValue = valueMatch[1].trim();
          }
          
          const descMatch = outputContent.match(/Description:\s*(.+?)(\n|$)/);
          if (descMatch && descMatch[1]) {
            outputDesc = descMatch[1].trim();
          }
          
          const exportMatch = outputContent.match(/Export:[\s\S]*?Name:\s*(.+?)(\n|$)/);
          if (exportMatch && exportMatch[1]) {
            outputExport = { name: exportMatch[1].trim() };
          }
          
          result.outputs[outputName] = {
            value: outputValue,
            description: outputDesc,
            export: outputExport
          };
        }
        console.log(`Outputs procesados: ${Object.keys(result.outputs).length}`);
      }

      // Procesar mappings
      if (parsedTemplate['Mappings']) {
        console.log('Procesando mappings...', Object.keys(parsedTemplate['Mappings']).length);
        for (const mappingName in parsedTemplate['Mappings']) {
          result.mappings[mappingName] = {
            content: parsedTemplate['Mappings'][mappingName].content || ''
          };
        }
        console.log(`Mappings procesados: ${Object.keys(result.mappings).length}`);
      }

      // Procesar condiciones
      if (parsedTemplate['Conditions']) {
        console.log('Procesando condiciones...', Object.keys(parsedTemplate['Conditions']).length);
        for (const condName in parsedTemplate['Conditions']) {
          result.conditions[condName] = {
            condition: parsedTemplate['Conditions'][condName].content || ''
          };
        }
        console.log(`Condiciones procesadas: ${Object.keys(result.conditions).length}`);
      }
      
      // Procesar globals
      if (parsedTemplate['Globals']) {
        console.log('Procesando globals...', Object.keys(parsedTemplate['Globals']).length);
        for (const globalName in parsedTemplate['Globals']) {
          result.globals![globalName] = parsedTemplate['Globals'][globalName].content || '';
        }
        console.log(`Globals procesados: ${Object.keys(result.globals || {}).length}`);
      }

      result.isValid = result.errors.length === 0;
      console.log('Validación completada. Template válido:', result.isValid);
      
      return result;
    } catch (error) {
      console.error('Error durante la validación:', error);
      result.errors.push(`Error al validar el template: ${error}`);
      return result;
    }
  }

  private parseTemplate(templateContent: string): { [key: string]: any } {
    const result: { [key: string]: any } = {
      Parameters: {},
      Mappings: {},
      Resources: {},
      Outputs: {},
      Conditions: {},
      Globals: {}
    };

    try {
      const topLevelRegex = /^([A-Za-z0-9]+):\s*$/gm;
      let match;
      let sections = [];
      
      while ((match = topLevelRegex.exec(templateContent)) !== null) {
        sections.push({
          name: match[1],
          position: match.index
        });
      }
      
      sections.sort((a, b) => a.position - b.position);
      
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
      
      if (extractedSections['Parameters']) {
        result['Parameters'] = this.parseSection(extractedSections['Parameters']);
      }
      
      if (extractedSections['Resources']) {
        result['Resources'] = this.parseSection(extractedSections['Resources']);
      }
      
      if (extractedSections['Mappings']) {
        result['Mappings'] = this.parseSection(extractedSections['Mappings']);
      }
      
      if (extractedSections['Outputs']) {
        result['Outputs'] = this.parseSection(extractedSections['Outputs']);
      }
      
      if (extractedSections['Conditions']) {
        result['Conditions'] = this.parseSection(extractedSections['Conditions']);
      }
      
      if (extractedSections['Globals']) {
        result['Globals'] = this.parseSection(extractedSections['Globals']);
      }
      
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

  private parseSection(content: string): { [key: string]: any } {
    const items: { [key: string]: any } = {};
    
    try {
      const lines = content.split('\n');
      let currentItem = '';
      let itemContent = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith(' ') && trimmedLine.includes(':')) {
          if (currentItem) {
            items[currentItem] = { content: itemContent };
          }
          
          const parts = trimmedLine.split(':');
          currentItem = parts[0].trim();
          itemContent = parts.slice(1).join(':').trim() + '\n';
        } else if (currentItem) {
          itemContent += line + '\n';
        }
      }
      
      if (currentItem) {
        items[currentItem] = { content: itemContent };
      }
    } catch (e) {
      console.error('Error al procesar sección:', e);
    }
    
    return items;
  }
}