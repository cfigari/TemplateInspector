import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TemplateValidatorService, ValidationResult } from '../../services/template-validator.service';
import { TemplateExtractorService } from '../../services/template-extractor.service';

export interface AnalyzerResource {
  logicalId: string;
  type: string;
  properties: any;
  templateContent?: string;
}

@Component({
  selector: 'app-template-analyzer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './template-analyzer.component.html',
  styleUrl: './template-analyzer.component.css'
})
export class TemplateAnalyzerComponent implements OnInit {
  @Input() resource!: AnalyzerResource;
  @Input() templateContent: string = '';
  
  activeTab = 'extractor';
  
  // Extractor
  extractorFunctions = [
    { id: 'validateTemplate', name: 'Validar Template Completo', params: ['templateContent'] },
    { id: 'extractResource', name: 'Extraer Recurso', params: ['templateContent', 'resourceName'] },
    { id: 'extractParameter', name: 'Extraer Parámetro', params: ['templateContent', 'paramName'] },
    { id: 'extractOutput', name: 'Extraer Output', params: ['templateContent', 'outputName'] },
    { id: 'extractMapping', name: 'Extraer Mapping', params: ['templateContent', 'mappingName'] },
    { id: 'extractCondition', name: 'Extraer Condición', params: ['templateContent', 'conditionName'] }
  ];
  
  selectedExtractorFunction = '';
  extractorParams: { [key: string]: any } = {};
  extractorResult: any = null;
  extractorError: string = '';
  
  // Validator
  validatorFunctions = [
    { id: 'validateTemplate', name: 'Validar Template', params: ['templateContent'] },
    { id: 'validateResource', name: 'Validar Recurso Específico', params: ['resourceContent'] },
    { id: 'checkSyntax', name: 'Verificar Sintaxis', params: ['templateContent'] }
  ];
  
  selectedValidatorFunction = '';
  validatorParams: { [key: string]: any } = {};
  validatorResult: any = null;
  validatorError: string = '';

  constructor(
    private templateValidator: TemplateValidatorService,
    private templateExtractor: TemplateExtractorService
  ) {}

  ngOnInit(): void {
    this.extractorParams['templateContent'] = this.templateContent;
    this.extractorParams['resourceContent'] = this.resource?.properties?.content || '';
    this.extractorParams['resourceName'] = this.resource?.logicalId || '';
    this.extractorParams['paramName'] = '';
    this.extractorParams['outputName'] = '';
    this.extractorParams['mappingName'] = '';
    this.extractorParams['conditionName'] = '';
    
    this.validatorParams['templateContent'] = this.templateContent;
    this.validatorParams['resourceContent'] = this.resource?.properties?.content || '';
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  onExtractorFunctionChange(): void {
    this.extractorResult = null;
    this.extractorError = '';
  }

  onValidatorFunctionChange(): void {
    this.validatorResult = null;
    this.validatorError = '';
  }

  executeExtractorFunction(): void {
    if (!this.selectedExtractorFunction) {
      this.extractorError = 'Selecciona una función';
      return;
    }

    try {
      this.extractorError = '';
      this.extractorResult = null;

      switch (this.selectedExtractorFunction) {
        case 'validateTemplate':
          this.extractorResult = this.templateValidator.validateTemplate(this.extractorParams['templateContent']);
          break;
        case 'extractResource':
          this.extractorResult = this.templateExtractor.extractResource(
            this.extractorParams['templateContent'], 
            this.extractorParams['resourceName']
          );
          break;
        case 'extractParameter':
          this.extractorResult = this.templateExtractor.extractParameter(
            this.extractorParams['templateContent'], 
            this.extractorParams['paramName']
          );
          break;
        case 'extractOutput':
          this.extractorResult = this.templateExtractor.extractOutput(
            this.extractorParams['templateContent'], 
            this.extractorParams['outputName']
          );
          break;
        case 'extractMapping':
          this.extractorResult = this.templateExtractor.extractMapping(
            this.extractorParams['templateContent'], 
            this.extractorParams['mappingName']
          );
          break;
        case 'extractCondition':
          this.extractorResult = this.templateExtractor.extractCondition(
            this.extractorParams['templateContent'], 
            this.extractorParams['conditionName']
          );
          break;
        default:
          this.extractorError = 'Función no implementada';
      }
    } catch (error) {
      this.extractorError = `Error: ${error}`;
    }
  }

  executeValidatorFunction(): void {
    if (!this.selectedValidatorFunction) {
      this.validatorError = 'Selecciona una función';
      return;
    }

    try {
      this.validatorError = '';
      this.validatorResult = null;

      switch (this.selectedValidatorFunction) {
        case 'validateTemplate':
          this.validatorResult = this.templateValidator.validateTemplate(this.validatorParams['templateContent']);
          break;
        case 'validateResource':
          this.validatorResult = {
            isValid: true,
            resource: this.resource,
            content: this.validatorParams['resourceContent']
          };
          break;
        case 'checkSyntax':
          this.validatorResult = {
            syntaxValid: true,
            lines: this.validatorParams['templateContent'].split('\n').length,
            message: 'Sintaxis YAML válida'
          };
          break;
        default:
          this.validatorError = 'Función no implementada';
      }
    } catch (error) {
      this.validatorError = `Error: ${error}`;
    }
  }

  formatJson(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }
}