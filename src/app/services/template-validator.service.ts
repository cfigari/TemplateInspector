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
      // Intentar parsear el YAML/JSON
      let template: any;
      
      try {
        // Intentar parsear como JSON primero
        template = JSON.parse(templateContent);
      } catch (e) {
        // Si falla, intentar parsear como YAML
        // En una implementación real, usaríamos js-yaml
        // Por ahora, usamos una solución simple para YAML básico
        template = this.parseYaml(templateContent);
      }

      // Verificar si es un template de CloudFormation
      if (!template.Resources) {
        result.errors.push('No se encontró la sección "Resources" en el template.');
        return result;
      }

      // Validar formato AWSTemplateFormatVersion
      if (template.AWSTemplateFormatVersion) {
        // Eliminar comillas si existen
        const version = template.AWSTemplateFormatVersion.replace(/['"]/g, '');
        if (version !== '2010-09-09') {
          result.errors.push(`Versión de template no soportada: ${version}`);
        }
      }

      // Procesar recursos
      for (const logicalId in template.Resources) {
        const resource = template.Resources[logicalId];
        
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

      // Procesar parámetros
      if (template.Parameters) {
        for (const paramName in template.Parameters) {
          const param = template.Parameters[paramName];
          
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

      // Procesar outputs
      if (template.Outputs) {
        for (const outputName in template.Outputs) {
          const output = template.Outputs[outputName];
          
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

      // Procesar mappings
      if (template.Mappings) {
        result.mappings = template.Mappings;
      }

      // Procesar condiciones
      if (template.Conditions) {
        for (const condName in template.Conditions) {
          result.conditions[condName] = {
            condition: template.Conditions[condName]
          };
        }
      }

      // Si llegamos hasta aquí sin errores críticos, el template es válido
      result.isValid = result.errors.length === 0;
      
      return result;
    } catch (error) {
      result.errors.push(`Error al validar el template: ${error}`);
      return result;
    }
  }

  // Implementación básica de un parser YAML
  // Nota: Esto es una implementación muy simple y no maneja todos los casos de YAML
  // En una aplicación real, deberías usar una biblioteca como js-yaml
  private parseYaml(yamlString: string): any {
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
      
      return JSON.parse(jsonString);
    } catch (e) {
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
      
      return result;
    }
  }
}