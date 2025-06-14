import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-extract-block',
  standalone: true,
  imports: [CommonModule],
  template: `
    <a href="javascript:void(0)" class="text-primary extract-link" title="Extraer {{ blockName }}" (click)="extractBlock()">
      <i class="bi bi-box-arrow-up-right"></i>
    </a>
    
    <!-- Modal para mostrar el bloque extraído -->
    <div class="modal fade" [id]="modalId" tabindex="-1" [attr.aria-labelledby]="modalLabelId" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" [id]="modalLabelId">{{ blockName }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <pre class="bg-light p-3 rounded" style="max-height: 500px; overflow-y: auto;"><code>{{ blockContent }}</code></pre>
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
  styles: [`
    .extract-link {
      text-decoration: none;
      cursor: pointer;
      margin-left: 5px;
      font-size: 0.8rem;
    }
    .extract-link:hover {
      text-decoration: underline;
    }
  `]
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