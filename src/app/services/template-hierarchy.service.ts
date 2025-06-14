import { Injectable } from '@angular/core';
import { TemplateExtractorService } from './template-extractor.service';

export interface TemplateNode {
  id: string;
  level: number;
  extract: string;
  value: any;
  isComplex?: boolean;
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
        let nodeValue = parts.length > 1 ? parts[1].trim() : null;
        
        // Extraer el contenido completo para este nodo
        let fullExtract = line + '\n';
        let j = i + 1;
        let isComplex = false;
        
        // Verificar si es un elemento complejo (lista o mapa)
        if (trimmedLine.endsWith(':') || 
            nodeValue === null || 
            ['vpcConfig', 'events', 'tags', 'Properties', 'Metadata'].includes(nodeName)) {
          isComplex = true;
        }
        
        // Recopilar todas las líneas que pertenecen a este nodo
        while (j < lines.length) {
          const nextLine = lines[j];
          const nextIndent = nextLine.search(/\S/);
          
          if (!nextLine.trim() || nextIndent > indent) {
            fullExtract += nextLine + '\n';
            j++;
          } else {
            break;
          }
        }
        
        currentNode = {
          id: nodeName,
          level: indent,
          extract: fullExtract.trim(),
          value: nodeValue,
          isComplex: isComplex,
          children: []
        };
        
        parent.children.push(currentNode);
        
        // Buscar hijos de este nodo
        const childLines: string[] = [];
        let k = i + 1;
        
        while (k < j) {
          const childLine = lines[k];
          const childIndent = childLine.search(/\S/);
          
          if (!childLine.trim() || childIndent > indent) {
            childLines.push(childLine);
          }
          k++;
        }
        
        if (childLines.length > 0) {
          this.parseLines(childLines, currentNode, indent);
        }
        
        i = j;
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
  
  /**
   * Extrae el contenido completo de un nodo específico, incluyendo todos sus hijos
   */
  getNodeExtract(node: TemplateNode): string {
    if (!node) return '';
    
    // Si ya tiene un extracto completo, devolverlo
    if (node.extract) return node.extract;
    
    // Construir el extracto basado en el ID y valor
    let extract = node.id + ':';
    if (node.value) {
      extract += ' ' + node.value;
    }
    
    // Si tiene hijos, añadirlos con la indentación adecuada
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const childExtract = this.getNodeExtract(child);
        const indentedChildExtract = childExtract.split('\n')
          .map(line => '  ' + line)
          .join('\n');
        extract += '\n' + indentedChildExtract;
      }
    }
    
    return extract;
  }
}