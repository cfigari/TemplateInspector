import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modal: any;
  private initialized = false;
  
  title: string = '';
  content: string = '';
  
  initialize() {
    if (this.initialized) return;
    
    setTimeout(() => {
      const modalElement = document.getElementById('extractModal');
      
      if (typeof window !== 'undefined' && (window as any).bootstrap && modalElement) {
        this.modal = new (window as any).bootstrap.Modal(modalElement);
        this.initialized = true;
      }
    }, 100);
  }
  
  show(title: string, content: string) {
    this.title = title;
    this.content = content;
    
    if (!this.initialized) {
      this.initialize();
      setTimeout(() => {
        if (this.modal) this.modal.show();
      }, 150);
    } else {
      if (this.modal) this.modal.show();
    }
  }
  
  copyContent(): Promise<void> {
    if (!this.content) return Promise.resolve();
    
    return navigator.clipboard.writeText(this.content);
  }
}