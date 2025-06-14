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
  allowedValues?: any[];
  constraintDescription?: string;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  allowedPattern?: string;
  noEcho?: boolean;
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

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  resources: CloudFormationResource[];
  parameters: { [key: string]: CloudFormationParameter };
  outputs: { [key: string]: CloudFormationOutput };
  mappings: { [key: string]: CloudFormationMapping };
  conditions: { [key: string]: CloudFormationCondition };
}

@Injectable({
  providedIn: 'root'
})
export class TemplateValidatorService {

  constructor() { }

  validateTemplate(templateContent: string): ValidationResult {
    console.log('Iniciando validación del template');
    
    const result: ValidationResult = {
      isValid: false,
      errors: [],
      resources: [],
      parameters: {},
      outputs: {},
      mappings: {},
      conditions: {}
    };

    try {
      // Solución alternativa: Usar el parseo anterior pero reorganizar los datos
      let template: any;
      
      try {
        // Intentar parsear como JSON primero
        console.log('Intentando parsear como JSON');
        template = JSON.parse(templateContent);
        console.log('Parseado como JSON exitoso');
      } catch (e) {
        // Si falla, intentar parsear como YAML
        console.log('Parseado JSON falló, intentando como YAML');
        template = this.parseYaml(templateContent);
        console.log('Parseado como YAML exitoso');
      }

      console.log('Template parseado:', template);
      
      // Identificar las secciones principales
      const mainSections = ['Resources', 'Parameters', 'Outputs', 'Mappings', 'Conditions'];
      const organizedTemplate: any = {};
      
      // Extraer propiedades de nivel superior conocidas
      if (template.AWSTemplateFormatVersion) {
        organizedTemplate.AWSTemplateFormatVersion = template.AWSTemplateFormatVersion;
      }
      if (template.Transform) {
        organizedTemplate.Transform = template.Transform;
      }
      if (template.Description) {
        organizedTemplate.Description = template.Description;
      }
      
      // Inicializar secciones principales
      mainSections.forEach(section => {
        organizedTemplate[section] = {};
      });
      
      // Identificar recursos por convención de nombres
      // Los recursos típicamente tienen Type y Properties
      for (const key in template) {
        if (mainSections.includes(key)) {
          // Ya es una sección principal
          organizedTemplate[key] = template[key];
        } else if (template[key] && typeof template[key] === 'object') {
          // Verificar si parece un recurso
          if (template[key].Type && template[key].Type.startsWith('AWS::')) {
            if (!organizedTemplate.Resources) {
              organizedTemplate.Resources = {};
            }
            organizedTemplate.Resources[key] = template[key];
          }
        }
      }
      
      // Buscar recursos adicionales basados en patrones comunes
      for (const key in template) {
        if (!mainSections.includes(key) && 
            !['AWSTemplateFormatVersion', 'Transform', 'Description'].includes(key) &&
            !organizedTemplate.Resources[key]) {
          
          // Verificar si el nombre sigue patrones comunes de recursos
          const isLikelyResource = /^[A-Z][a-zA-Z0-9]*$/.test(key) || // PascalCase
                                  key.includes('Lambda') ||
                                  key.includes('Role') ||
                                  key.includes('Policy') ||
                                  key.includes('Function') ||
                                  key.includes('Bucket') ||
                                  key.includes('Table') ||
                                  key.includes('Queue') ||
                                  key.includes('Topic');
          
          if (isLikelyResource) {
            // Asumir que es un recurso
            if (!organizedTemplate.Resources) {
              organizedTemplate.Resources = {};
            }
            
            // Si no tiene Type, intentar inferirlo
            if (!template[key].Type) {
              let inferredType = 'AWS::CloudFormation::CustomResource';
              
              if (key.includes('Lambda') || key.includes('Function')) {
                inferredType = 'AWS::Lambda::Function';
              } else if (key.includes('Role')) {
                inferredType = 'AWS::IAM::Role';
              } else if (key.includes('Policy')) {
                inferredType = 'AWS::IAM::Policy';
              } else if (key.includes('Bucket')) {
                inferredType = 'AWS::S3::Bucket';
              } else if (key.includes('Table')) {
                inferredType = 'AWS::DynamoDB::Table';
              } else if (key.includes('Queue')) {
                inferredType = 'AWS::SQS::Queue';
              } else if (key.includes('Topic')) {
                inferredType = 'AWS::SNS::Topic';
              }
              
              organizedTemplate.Resources[key] = {
                Type: inferredType,
                Properties: template[key]
              };
            } else {
              organizedTemplate.Resources[key] = template[key];
            }
          }
        }
      }
      
      console.log('Template organizado:', organizedTemplate);

      // Verificar si es un template de CloudFormation
      if (!organizedTemplate.Resources || Object.keys(organizedTemplate.Resources).length === 0) {
        console.log('No se encontró la sección Resources o está vacía');
        result.errors.push('No se encontró la sección "Resources" en el template.');
        return result;
      }

      // Validar formato AWSTemplateFormatVersion
      if (organizedTemplate.AWSTemplateFormatVersion) {
        // Eliminar comillas si existen
        const version = organizedTemplate.AWSTemplateFormatVersion.replace(/['"]/g, '');
        if (version !== '2010-09-09') {
          console.log('Versión no soportada:', version);
          result.errors.push(`Versión de template no soportada: ${version}`);
        }
      }

      // Procesar recursos
      console.log('Procesando recursos...', Object.keys(organizedTemplate.Resources).length);
      for (const logicalId in organizedTemplate.Resources) {
        const resource = organizedTemplate.Resources[logicalId];
        
        if (!resource.Type) {
          result.errors.push(`El recurso "${logicalId}" no tiene un tipo definido.`);
          continue;
        }

        result.resources.push({
          logicalId,
          type: resource.Type,
          properties: resource.Properties || {},
          dependsOn: resource.DependsOn,
          metadata: resource.Metadata,
          condition: resource.Condition
        });
      }
      console.log(`Recursos procesados: ${result.resources.length}`);

      // Procesar parámetros
      console.log('Procesando parámetros...', organizedTemplate.Parameters ? Object.keys(organizedTemplate.Parameters).length : 0);
      if (organizedTemplate.Parameters) {
        for (const paramName in organizedTemplate.Parameters) {
          const param = organizedTemplate.Parameters[paramName];
          
          if (!param.Type) {
            result.errors.push(`El parámetro "${paramName}" no tiene un tipo definido.`);
            continue;
          }

          result.parameters[paramName] = {
            type: param.Type,
            description: param.Description,
            default: param.Default,
            allowedValues: param.AllowedValues,
            constraintDescription: param.ConstraintDescription,
            minValue: param.MinValue,
            maxValue: param.MaxValue,
            minLength: param.MinLength,
            maxLength: param.MaxLength,
            allowedPattern: param.AllowedPattern,
            noEcho: param.NoEcho
          };
        }
      }
      console.log(`Parámetros procesados: ${Object.keys(result.parameters).length}`);

      // Procesar outputs
      console.log('Procesando outputs...', organizedTemplate.Outputs ? Object.keys(organizedTemplate.Outputs).length : 0);
      if (organizedTemplate.Outputs) {
        for (const outputName in organizedTemplate.Outputs) {
          const output = organizedTemplate.Outputs[outputName];
          
          if (output.Value === undefined) {
            result.errors.push(`El output "${outputName}" no tiene un valor definido.`);
            continue;
          }

          result.outputs[outputName] = {
            description: output.Description,
            value: output.Value,
            export: output.Export,
            condition: output.Condition
          };
        }
      }
      console.log(`Outputs procesados: ${Object.keys(result.outputs).length}`);

      // Procesar mappings
      console.log('Procesando mappings...', organizedTemplate.Mappings ? Object.keys(organizedTemplate.Mappings).length : 0);
      if (organizedTemplate.Mappings) {
        result.mappings = organizedTemplate.Mappings;
      }
      console.log(`Mappings procesados: ${Object.keys(result.mappings).length}`);

      // Procesar condiciones
      console.log('Procesando condiciones...', organizedTemplate.Conditions ? Object.keys(organizedTemplate.Conditions).length : 0);
      if (organizedTemplate.Conditions) {
        for (const condName in organizedTemplate.Conditions) {
          result.conditions[condName] = {
            condition: organizedTemplate.Conditions[condName]
          };
        }
      }
      console.log(`Condiciones procesadas: ${Object.keys(result.conditions).length}`);

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

  // Implementación básica de un parser YAML
  private parseYaml(yamlString: string): any {
    console.log('Parseando YAML...');
    try {
      // Eliminar comentarios
      const lines = yamlString.split('\n').map(line => {
        const commentIndex = line.indexOf('#');
        return commentIndex >= 0 ? line.substring(0, commentIndex) : line;
      });
      
      // Convertir a JSON
      const jsonString = lines.join('\n')
        .replace(/(\w+):/g, '"$1":')  // Convertir claves a formato JSON
        .replace(/: (\w+)/g, ': "$1"')  // Convertir valores simples a strings
        .replace(/'/g, '"');  // Reemplazar comillas simples por dobles
      
      console.log('YAML convertido a JSON string, intentando parsear...');
      return JSON.parse(jsonString);
    } catch (e) {
      console.log('Primer intento de parseo YAML falló, intentando enfoque alternativo');
      // Si falla, intentar un enfoque más simple
      const result: any = {};
      let currentSection: string | null = null;
      
      yamlString.split('\n').forEach(line => {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        
        if (!line.startsWith(' ') && line.includes(':')) {
          // Es una sección de nivel superior
          const [key, value] = line.split(':');
          currentSection = key.trim();
          result[currentSection] = value ? value.trim() : {};
        } else if (currentSection && line.includes(':')) {
          // Es una subsección
          if (typeof result[currentSection] !== 'object') {
            result[currentSection] = {};
          }
          
          const indent = line.search(/\S/);
          const [key, value] = line.trim().split(':');
          
          if (key && value) {
            result[currentSection][key.trim()] = value.trim();
          }
        }
      });
      
      console.log('Enfoque alternativo de parseo YAML completado');
      return result;
    }
  }
}