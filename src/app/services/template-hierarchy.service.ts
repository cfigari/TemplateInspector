import { Injectable } from '@angular/core';
import { TemplateExtractorService } from './template-extractor.service';

export interface TemplateNode {
  id: string;
  level: number;
  extract: string;
  value: any;
  children: TemplateNode[];
}

@Injectable({
  providedIn: 'root'
})
export class TemplateHierarchyService {

  constructor(private extractor: TemplateExtractorService) { }

  /**
   * Construye una estructura jerárquica a partir del contenido de un template
   */
  buildHierarchy(templateContent: string, section: string): TemplateNode {
    const sectionContent = this.extractor.extractSection(templateContent, section);
    const lines = sectionContent.split('\n');
    
    // Crear nodo raíz
    const root: TemplateNode = {
      id: section,
      level: 0,
      extract: sectionContent,
      value: null,
      children: []
    };
    
    // Procesar líneas para construir la jerarquía
    this.parseLines(lines, root, 0);
    
    return root;
  }
  
  /**
   * Procesa las líneas del template para construir la jerarquía
   */
  private parseLines(lines: string[], parent: TemplateNode, baseIndent: number): void {
    let currentNode: TemplateNode | null = null;
    let i = 1; // Empezar desde la segunda línea (saltando la línea del nombre de sección)
    
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) {
        i++;
        continue;
      }
      
      const indent = line.search(/\S/);
      const trimmedLine = line.trim();
      
      // Si es un nuevo nodo del mismo nivel que estamos procesando
      if (indent === baseIndent + 2 && trimmedLine.includes(':')) {
        const parts = trimmedLine.split(':');
        const nodeName = parts[0].trim();
        const nodeValue = parts.length > 1 ? parts[1].trim() : null;
        
        currentNode = {
          id: nodeName,
          level: indent,
          extract: line,
          value: nodeValue,
          children: []
        };
        
        parent.children.push(currentNode);
        
        // Buscar hijos de este nodo
        let j = i + 1;
        const childLines: string[] = [];
        
        while (j < lines.length) {
          const childLine = lines[j];
          const childIndent = childLine.search(/\S/);
          
          if (!childLine.trim() || childIndent > indent) {
            childLines.push(childLine);
            j++;
          } else {
            break;
          }
        }
        
        if (childLines.length > 0) {
          this.parseLines(childLines, currentNode, indent);
          i = j;
        } else {
          i++;
        }
      } else {
        i++;
      }
    }
  }
  
  /**
   * Obtiene los componentes jerárquicos para una sección específica
   */
  getHierarchicalComponents(templateContent: string, section: string): TemplateNode[] {
    const hierarchy = this.buildHierarchy(templateContent, section);
    return hierarchy.children;
  }
}