import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TemplateStorageService, Template } from '../../services/template-storage.service';
import { TemplateViewerComponent } from '../../shared/template-viewer/template-viewer.component';

declare var bootstrap: any;

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, TemplateViewerComponent],
  templateUrl: './templates.component.html',
  styleUrl: './templates.component.css'
})
export class TemplatesComponent implements OnInit {
  selectedFile: File | null = null;
  isUploading = false;
  uploadProgress = 0;
  uploadSuccess = false;
  uploadError = false;
  errorMessage = '';
  isDragging = false;
  
  // Para el modal de confirmación
  templateToDelete: Template | null = null;
  deleteModal: any;
  
  // Para el visualizador de templates
  @ViewChild(TemplateViewerComponent) templateViewer!: TemplateViewerComponent;
  
  // Lista de templates
  templates: Template[] = [];

  constructor(private templateStorage: TemplateStorageService) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.templateStorage.getAllTemplates().subscribe(templates => {
      this.templates = templates;
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }
  }

  // Manejar el evento dragover
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  // Manejar el evento dragleave
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  // Manejar el evento drop
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExt === 'yaml' || fileExt === 'yml' || fileExt === 'zip') {
        this.selectedFile = file;
      } else {
        this.uploadError = true;
        this.errorMessage = 'Formato de archivo no válido. Por favor, sube un archivo YAML o ZIP.';
      }
    }
  }

  uploadFile(): void {
    if (!this.selectedFile) return;
    
    // Iniciar proceso de carga
    this.isUploading = true;
    this.uploadProgress = 0;
    this.uploadSuccess = false;
    this.uploadError = false;
    
    // Verificar si es un archivo válido (YAML o ZIP)
    const fileExt = this.selectedFile.name.split('.').pop()?.toLowerCase();
    if (fileExt !== 'yaml' && fileExt !== 'yml' && fileExt !== 'zip') {
      this.isUploading = false;
      this.uploadError = true;
      this.errorMessage = 'Formato de archivo no válido. Por favor, sube un archivo YAML o ZIP.';
      return;
    }

    // Simular progreso de carga
    const interval = setInterval(() => {
      this.uploadProgress += 10;
      if (this.uploadProgress >= 100) {
        clearInterval(interval);
        this.processFile();
      }
    }, 200);
  }

  processFile(): void {
    if (!this.selectedFile) return;

    // Leer el contenido del archivo
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result;
      if (content) {
        // Crear objeto template
        const template: Template = {
          name: this.selectedFile!.name,
          type: this.getFileType(this.selectedFile!.name),
          size: this.formatFileSize(this.selectedFile!.size),
          date: new Date().toISOString().split('T')[0],
          status: 'Procesando',
          content: content
        };
        
        // Guardar en la base de datos
        this.templateStorage.saveTemplate(template).subscribe({
          next: (savedTemplate) => {
            this.isUploading = false;
            this.uploadSuccess = true;
            
            // Actualizar la lista de templates
            this.loadTemplates();
            
            // Resetear después de 3 segundos
            setTimeout(() => {
              this.uploadSuccess = false;
              this.selectedFile = null;
            }, 3000);
          },
          error: (err) => {
            this.isUploading = false;
            this.uploadError = true;
            this.errorMessage = 'Error al guardar el archivo: ' + err;
          }
        });
      }
    };
    
    reader.onerror = () => {
      this.isUploading = false;
      this.uploadError = true;
      this.errorMessage = 'Error al leer el archivo.';
    };
    
    // Leer como texto para YAML y como ArrayBuffer para ZIP
    const fileExt = this.selectedFile.name.split('.').pop()?.toLowerCase();
    if (fileExt === 'zip') {
      reader.readAsArrayBuffer(this.selectedFile);
    } else {
      reader.readAsText(this.selectedFile);
    }
  }
  
  // Mostrar el modal de confirmación de eliminación
  showDeleteConfirmation(template: Template): void {
    this.templateToDelete = template;
    
    // Inicializar el modal de Bootstrap
    const modalElement = document.getElementById('deleteConfirmationModal');
    if (modalElement) {
      this.deleteModal = new bootstrap.Modal(modalElement);
      this.deleteModal.show();
    }
  }
  
  // Confirmar la eliminación
  confirmDelete(): void {
    if (this.templateToDelete && this.templateToDelete.id !== undefined) {
      this.templateStorage.deleteTemplate(this.templateToDelete.id).subscribe(success => {
        if (success) {
          this.loadTemplates();
          // Cerrar el modal
          if (this.deleteModal) {
            this.deleteModal.hide();
          }
        } else {
          // Mostrar mensaje de error
          alert('Error al eliminar el template.');
        }
      });
    }
  }
  
  viewTemplate(id?: number): void {
    if (id === undefined) return;
    
    this.templateStorage.getTemplateById(id).subscribe(template => {
      if (template && this.templateViewer) {
        this.templateViewer.template = template;
        this.templateViewer.show();
      }
    });
  }
  
  downloadTemplate(id?: number): void {
    if (id === undefined) return;
    
    this.templateStorage.getTemplateById(id).subscribe(template => {
      if (template) {
        // Crear un blob y descargarlo
        let blob;
        if (typeof template.content === 'string') {
          blob = new Blob([template.content], { type: 'text/yaml' });
        } else {
          blob = new Blob([template.content], { type: 'application/zip' });
        }
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = template.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  }
  
  getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    return ext === 'zip' ? 'ZIP' : 'YAML';
  }
  
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  }
}