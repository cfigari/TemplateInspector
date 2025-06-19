import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TemplateViewerComponent } from '../../shared/template-viewer/template-viewer.component';
import { TemplateAnalyzerComponent, AnalyzerResource } from '../../shared/template-analyzer/template-analyzer.component';
import { TemplateStorageService, Template } from '../../services/template-storage.service';

declare var bootstrap: any;

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, TemplateViewerComponent, TemplateAnalyzerComponent],
  templateUrl: './templates.component.html',
  styleUrl: './templates.component.css'
})
export class TemplatesComponent implements OnInit {
  templates: Template[] = [];
  selectedFile: File | null = null;
  isDragging = false;
  isUploading = false;
  uploadProgress = 0;
  uploadSuccess = false;
  uploadError = false;
  errorMessage = '';
  templateToDelete: Template | null = null;
  
  // Para el analizador
  selectedTemplateForAnalysis: AnalyzerResource | null = null;
  selectedTemplateContent = '';

  constructor(private templateStorage: TemplateStorageService) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  async loadTemplates(): Promise<void> {
    try {
      const storedTemplates = await this.templateStorage.getAllTemplates().toPromise();
      this.templates = storedTemplates || [];
    } catch (error) {
      console.error('Error loading templates:', error);
      this.templates = [];
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.selectedFile = files[0];
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async uploadFile(): Promise<void> {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadError = false;
    this.uploadSuccess = false;

    try {
      // Simular progreso de subida
      const progressInterval = setInterval(() => {
        this.uploadProgress += 10;
        if (this.uploadProgress >= 90) {
          clearInterval(progressInterval);
        }
      }, 200);

      // Leer el contenido del archivo
      const content = await this.readFileContent(this.selectedFile);
      
      // Guardar en el storage
      const template: Template = {
        name: this.selectedFile.name,
        type: this.selectedFile.name.endsWith('.zip') ? 'ZIP' : 'YAML',
        size: this.formatFileSize(this.selectedFile.size),
        date: new Date().toLocaleDateString(),
        status: 'Válido',
        content: content
      };

      await this.templateStorage.saveTemplate(template).toPromise();
      
      clearInterval(progressInterval);
      this.uploadProgress = 100;
      
      setTimeout(() => {
        this.isUploading = false;
        this.uploadSuccess = true;
        this.selectedFile = null;
        this.loadTemplates();
        
        setTimeout(() => {
          this.uploadSuccess = false;
        }, 3000);
      }, 500);

    } catch (error) {
      this.isUploading = false;
      this.uploadError = true;
      this.errorMessage = 'Error al subir el archivo. Inténtalo de nuevo.';
      console.error('Upload error:', error);
    }
  }

  private readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  viewTemplate(templateId: string): void {
    console.log('Ver template:', templateId);
    // Implementar navegación al visualizador
  }

  analyzeTemplate(template: Template): void {
    this.selectedTemplateForAnalysis = {
      logicalId: template.name,
      type: template.type,
      properties: { content: template.content || '' },
      templateContent: template.content as string || ''
    };
    this.selectedTemplateContent = template.content as string || '';
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('analyzerModal'));
    modal.show();
  }

  downloadTemplate(templateId: string): void {
    const template = this.templates.find(t => t.id?.toString() === templateId);
    if (template && template.content) {
      const blob = new Blob([template.content as string], { type: 'text/yaml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = template.name;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }

  showDeleteConfirmation(template: Template): void {
    this.templateToDelete = template;
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
    modal.show();
  }

  async confirmDelete(): Promise<void> {
    if (this.templateToDelete && this.templateToDelete.id) {
      try {
        await this.templateStorage.deleteTemplate(this.templateToDelete.id).toPromise();
        await this.loadTemplates();
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmationModal'));
        modal?.hide();
        
        this.templateToDelete = null;
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  }
}