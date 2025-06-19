import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-extract-block',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './extract-block.component.html',
  styleUrl: './extract-block.component.css'
})
export class ExtractBlockComponent implements OnInit {
  @Input() blockName: string = '';
  @Input() blockContent: string = '';
  
  modalId: string = '';
  modalLabelId: string = '';
  modal: any;
  
  ngOnInit() {
    // Generar IDs únicos para el modal
    const safeBlockName = this.blockName ? this.blockName.replace(/[^a-zA-Z0-9]/g, '_') : 'unnamed';
    this.modalId = `extractModal_${safeBlockName}_${Math.random().toString(36).substring(2, 9)}`;
    this.modalLabelId = `extractModalLabel_${safeBlockName}`;
    
    // Inicializar el modal cuando el componente se carga
    setTimeout(() => {
      const modalElement = document.getElementById(this.modalId);
      
      if (typeof window !== 'undefined' && (window as any).bootstrap && modalElement) {
        this.modal = new (window as any).bootstrap.Modal(modalElement);
      }
    }, 100);
  }
  
  extractBlock() {
    if (this.modal) {
      this.modal.show();
    } else {
      console.error('Modal no inicializado para', this.blockName);
      
      // Reintentar inicializar el modal
      const modalElement = document.getElementById(this.modalId);
      if (typeof window !== 'undefined' && (window as any).bootstrap && modalElement) {
        this.modal = new (window as any).bootstrap.Modal(modalElement);
        setTimeout(() => {
          this.modal.show();
        }, 50);
      }
    }
  }
  
  copyBlockContent() {
    if (this.blockContent) {
      navigator.clipboard.writeText(this.blockContent)
        .then(() => {
          alert(`Código copiado al portapapeles`);
        })
        .catch(err => {
          console.error('Error al copiar el código: ', err);
        });
    }
  }
}