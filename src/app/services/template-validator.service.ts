import { Injectable } from '@angular/core';
import { TemplateParserService } from './template-parser.service';

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

  constructor(private parser: TemplateParserService) { }

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
      // Parsear el template usando el servicio de parseo
      const parsedTemplate = this.parser.parseTemplate(templateContent);
      console.log('Template parseado:', parsedTemplate);
      
      // Validar formato AWSTemplateFormatVersion
      if (parsedTemplate['AWSTemplateFormatVersion']) {
        // Eliminar comillas si existen
        const version = parsedTemplate['AWSTemplateFormatVersion'].replace(/['\"]/g, '');
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
          
          // Extraer el tipo del recurso
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
          let paramType = 'String'; // Tipo por defecto
          let paramDesc = '';
          let paramDefault = undefined;
          
          // Extraer el tipo del parámetro
          const typeMatch = paramContent.match(/Type:\s*([^\s\n]+)/);
          if (typeMatch && typeMatch[1]) {
            paramType = typeMatch[1].trim();
          }
          
          // Extraer la descripción
          const descMatch = paramContent.match(/Description:\s*(.+?)(\n|$)/);
          if (descMatch && descMatch[1]) {
            paramDesc = descMatch[1].trim();
          }
          
          // Extraer el valor por defecto
          const defaultMatch = paramContent.match(/Default:\s*(.+?)(\n|$)/);
          if (defaultMatch && defaultMatch[1]) {
            paramDefault = defaultMatch[1].trim();
          }
          
          // Extraer valores permitidos (AllowedValues)
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
          
          // Extraer otros atributos
          let minValue = undefined;
          let maxValue = undefined;
          let minLength = undefined;
          let maxLength = undefined;
          let allowedPattern = undefined;
          let noEcho = undefined;
          let constraintDescription = undefined;
          
          const minValueMatch = paramContent.match(/MinValue:\s*(.+?)(\n|$)/);
          if (minValueMatch && minValueMatch[1]) {
            minValue = Number(minValueMatch[1].trim());
          }
          
          const maxValueMatch = paramContent.match(/MaxValue:\s*(.+?)(\n|$)/);
          if (maxValueMatch && maxValueMatch[1]) {
            maxValue = Number(maxValueMatch[1].trim());
          }
          
          const minLengthMatch = paramContent.match(/MinLength:\s*(.+?)(\n|$)/);
          if (minLengthMatch && minLengthMatch[1]) {
            minLength = Number(minLengthMatch[1].trim());
          }
          
          const maxLengthMatch = paramContent.match(/MaxLength:\s*(.+?)(\n|$)/);
          if (maxLengthMatch && maxLengthMatch[1]) {
            maxLength = Number(maxLengthMatch[1].trim());
          }
          
          const allowedPatternMatch = paramContent.match(/AllowedPattern:\s*(.+?)(\n|$)/);
          if (allowedPatternMatch && allowedPatternMatch[1]) {
            allowedPattern = allowedPatternMatch[1].trim();
          }
          
          const noEchoMatch = paramContent.match(/NoEcho:\s*(.+?)(\n|$)/);
          if (noEchoMatch && noEchoMatch[1]) {
            noEcho = noEchoMatch[1].trim().toLowerCase() === 'true';
          }
          
          const constraintDescMatch = paramContent.match(/ConstraintDescription:\s*(.+?)(\n|$)/);
          if (constraintDescMatch && constraintDescMatch[1]) {
            constraintDescription = constraintDescMatch[1].trim();
          }
          
          result.parameters[paramName] = {
            type: paramType,
            description: paramDesc,
            default: paramDefault,
            allowedValues: paramAllowedValues,
            minValue: minValue,
            maxValue: maxValue,
            minLength: minLength,
            maxLength: maxLength,
            allowedPattern: allowedPattern,
            noEcho: noEcho,
            constraintDescription: constraintDescription,
            rawContent: paramContent // Guardar el contenido completo para extracción
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
          
          // Extraer el valor
          const valueMatch = outputContent.match(/Value:\s*(.+?)(\n|$)/);
          if (valueMatch && valueMatch[1]) {
            outputValue = valueMatch[1].trim();
          }
          
          // Extraer la descripción
          const descMatch = outputContent.match(/Description:\s*(.+?)(\n|$)/);
          if (descMatch && descMatch[1]) {
            outputDesc = descMatch[1].trim();
          }
          
          // Extraer la exportación
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

      // Si llegamos hasta aquí sin errores críticos, el template es válido
      result.isValid = result.errors.length === 0;
      console.log('Validación completada. Template válido:', result.isValid);
      
      return result;
    } catch (error) {
      console.error('Error durante la validación:', error);
      result.errors.push(`Error al validar el template: ${error}`);
      return result;
    }
  }
}