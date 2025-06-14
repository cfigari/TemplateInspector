import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Template } from '../../services/template-storage.service';
import JSZip from 'jszip';

interface FileNode {
  name: string;
  isDirectory: boolean;
  children?: FileNode[];
  content?: string;
  path: string;
}

declare var bootstrap: any;

@Component({
  selector: 'app-template-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './template-viewer.component.html',
  styleUrl: './template-viewer.component.css'
})
export class TemplateViewerComponent implements OnInit {
  @Input() template: Template | null = null;
  
  fileTree: FileNode[] = [];
  selectedFile: FileNode | null = null;
  fileContent: string = '';
  isLoading: boolean = false;
  
  modal: any;

  constructor() {}

  ngOnInit(): void {
    // Inicializar el modal cuando el componente se carga
    const modalElement = document.getElementById('templateViewerModal');
    if (modalElement) {
      this.modal = new bootstrap.Modal(modalElement);
    }
  }

  show(): void {
    if (this.modal) {
      this.modal.show();
      this.processTemplate();
    }
  }

  hide(): void {
    if (this.modal) {
      this.modal.hide();
    }
  }

  processTemplate(): void {
    if (!this.template) return;
    
    this.isLoading = true;
    this.fileTree = [];
    this.selectedFile = null;
    this.fileContent = '';
    
    if (this.template.type === 'YAML') {
      // Para archivos YAML, crear un nodo simple
      const node: FileNode = {
        name: this.template.name,
        isDirectory: false,
        path: this.template.name,
        content: typeof this.template.content === 'string' ? this.template.content : ''
      };
      
      this.fileTree = [node];
      this.selectedFile = node;
      this.fileContent = node.content || '';
      this.isLoading = false;
    } else if (this.template.type === 'ZIP') {
      // Para archivos ZIP, procesarlos para extraer la estructura
      this.processZipFile();
    }
  }

  async processZipFile(): Promise<void> {
    if (!this.template || typeof this.template.content !== 'object') {
      this.isLoading = false;
      return;
    }
    
    try {
      // Crear una instancia de JSZip
      const zip = new JSZip();
      
      // Cargar el archivo ZIP
      const zipContent = await zip.loadAsync(this.template.content);
      
      // Crear la estructura de árbol
      const rootNode: FileNode = {
        name: this.template.name.replace('.zip', ''),
        isDirectory: true,
        path: '/',
        children: []
      };
      
      // Procesar todos los archivos en el ZIP
      const promises: Promise<void>[] = [];
      
      zipContent.forEach((relativePath: string, zipEntry: JSZip.JSZipObject) => {
        if (!zipEntry.dir) {
          // Es un archivo
          const promise = zipEntry.async('string').then((content: string) => {
            this.addFileToTree(rootNode, relativePath, content);
          });
          promises.push(promise);
        } else {
          // Es un directorio
          this.addDirectoryToTree(rootNode, relativePath);
        }
      });
      
      // Esperar a que se procesen todos los archivos
      await Promise.all(promises);
      
      // Actualizar el árbol de archivos
      this.fileTree = [rootNode];
      
      // Seleccionar el primer archivo por defecto
      const firstFile = this.findFirstFile(this.fileTree);
      if (firstFile) {
        this.selectFile(firstFile);
      }
      
    } catch (error) {
      console.error('Error al procesar el archivo ZIP:', error);
    }
    
    this.isLoading = false;
  }

  addFileToTree(root: FileNode, path: string, content: string): void {
    const parts = path.split('/');
    let currentNode = root;
    
    // Navegar/crear la estructura de directorios
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!part) continue; // Saltar partes vacías
      
      let found = false;
      if (!currentNode.children) {
        currentNode.children = [];
      }
      
      for (const child of currentNode.children) {
        if (child.name === part && child.isDirectory) {
          currentNode = child;
          found = true;
          break;
        }
      }
      
      if (!found) {
        const newDir: FileNode = {
          name: part,
          isDirectory: true,
          path: currentNode.path + part + '/',
          children: []
        };
        if (!currentNode.children) {
          currentNode.children = [];
        }
        currentNode.children.push(newDir);
        currentNode = newDir;
      }
    }
    
    // Añadir el archivo
    const fileName = parts[parts.length - 1];
    if (!fileName) return; // Evitar nombres vacíos
    
    if (!currentNode.children) {
      currentNode.children = [];
    }
    
    currentNode.children.push({
      name: fileName,
      isDirectory: false,
      path: currentNode.path + fileName,
      content: content
    });
  }

  addDirectoryToTree(root: FileNode, path: string): void {
    const parts = path.split('/').filter(p => p); // Eliminar partes vacías
    let currentNode = root;
    
    // Crear la estructura de directorios
    for (const part of parts) {
      if (!currentNode.children) {
        currentNode.children = [];
      }
      
      let found = false;
      for (const child of currentNode.children) {
        if (child.name === part && child.isDirectory) {
          currentNode = child;
          found = true;
          break;
        }
      }
      
      if (!found) {
        const newDir: FileNode = {
          name: part,
          isDirectory: true,
          path: currentNode.path + part + '/',
          children: []
        };
        if (!currentNode.children) {
          currentNode.children = [];
        }
        currentNode.children.push(newDir);
        currentNode = newDir;
      }
    }
  }

  findFirstFile(nodes: FileNode[]): FileNode | null {
    for (const node of nodes) {
      if (!node.isDirectory) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const file = this.findFirstFile(node.children);
        if (file) return file;
      }
    }
    return null;
  }

  selectFile(file: FileNode | null): void {
    if (!file || file.isDirectory) return;
    
    this.selectedFile = file;
    this.fileContent = file.content || '';
  }

  toggleFolder(folder: FileNode): void {
    if (!folder.isDirectory) return;
    
    // Aquí se podría implementar la lógica para expandir/colapsar carpetas
    // Por simplicidad, no lo implementamos en este ejemplo
  }

  copyContent(): void {
    if (this.fileContent) {
      navigator.clipboard.writeText(this.fileContent)
        .then(() => {
          // Mostrar un mensaje de éxito
          alert('Contenido copiado al portapapeles');
        })
        .catch(err => {
          console.error('Error al copiar el contenido: ', err);
        });
    }
  }
}