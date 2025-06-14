import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-extract-block',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="btn btn-sm btn-outline-secondary" title="Extraer" (click)="extractBlock()">
      <i class="bi bi-box-arrow-up-right"></i>
    </button>
    
    <!-- Modal para mostrar el bloque extraído -->
    <div class="modal fade" [id]="modalId" tabindex="-1" [attr.aria-labelledby]="modalLabelId" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" [id]="modalLabelId">{{ blockName }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <pre class="bg-light p-3 rounded"><code>{{ blockContent }}</code></pre>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" (click)="copyBlockContent()">
              <i class="bi bi-clipboard"></i> Copiar Código
            </button>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ExtractBlockComponent implements OnInit {
  @Input() blockName: string = '';
  @Input() blockContent: string = '';
  
  modalId: string = '';
  modalLabelId: string = '';
  modal: any;
  
  ngOnInit() {
    // Generar IDs únicos para el modal
    this.modalId = `extractModal_${this.blockName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    this.modalLabelId = `extractModalLabel_${this.blockName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    // Inicializar el modal cuando el componente se carga
    setTimeout(() => {
      const modalElement = document.getElementById(this.modalId);
      
      if (typeof window !== 'undefined' && (window as any).bootstrap && modalElement) {
        this.modal = new (window as any).bootstrap.Modal(modalElement);
      }
    }, 500);
  }
  
  extractBlock() {
    if (this.modal) {
      this.modal.show();
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