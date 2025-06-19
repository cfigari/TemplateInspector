import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { PaletteStorageService } from './palette-storage.service';

export interface ColorPalette {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    danger: string;
    warning: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly CONFIG_KEY = 'theme-config';
  private currentThemeSubject = new BehaviorSubject<ColorPalette>(this.getDefaultPalettes()[0]);
  private customPalettesCache: ColorPalette[] = [];
  
  public currentTheme$ = this.currentThemeSubject.asObservable();

  constructor(private paletteStorage: PaletteStorageService) {
    this.loadCustomPalettes().then(() => {
      this.loadSavedTheme();
    });
  }

  getDefaultPalettes(): ColorPalette[] {
    return [
      {
        id: 'aws-orange',
        name: 'AWS Naranja',
        colors: {
          primary: '#FF9900',
          secondary: '#232F3E',
          accent: '#3498db',
          success: '#28a745',
          danger: '#dc3545',
          warning: '#ffc107',
          background: '#f8f9fa',
          surface: '#ffffff',
          text: '#333333',
          textSecondary: '#6c757d'
        }
      },
      {
        id: 'aws-blue',
        name: 'AWS Azul',
        colors: {
          primary: '#232F3E',
          secondary: '#FF9900',
          accent: '#17a2b8',
          success: '#28a745',
          danger: '#dc3545',
          warning: '#ffc107',
          background: '#f8f9fa',
          surface: '#ffffff',
          text: '#333333',
          textSecondary: '#6c757d'
        }
      },
      {
        id: 'modern-dark',
        name: 'Moderno Oscuro',
        colors: {
          primary: '#6366f1',
          secondary: '#1f2937',
          accent: '#10b981',
          success: '#10b981',
          danger: '#ef4444',
          warning: '#f59e0b',
          background: '#111827',
          surface: '#1f2937',
          text: '#f9fafb',
          textSecondary: '#9ca3af'
        }
      },
      {
        id: 'ocean-blue',
        name: 'Azul Océano',
        colors: {
          primary: '#0ea5e9',
          secondary: '#0f172a',
          accent: '#06b6d4',
          success: '#059669',
          danger: '#dc2626',
          warning: '#d97706',
          background: '#f0f9ff',
          surface: '#ffffff',
          text: '#0f172a',
          textSecondary: '#64748b'
        }
      },
      {
        id: 'forest-green',
        name: 'Verde Bosque',
        colors: {
          primary: '#059669',
          secondary: '#064e3b',
          accent: '#10b981',
          success: '#10b981',
          danger: '#dc2626',
          warning: '#d97706',
          background: '#f0fdf4',
          surface: '#ffffff',
          text: '#064e3b',
          textSecondary: '#6b7280'
        }
      }
    ];
  }

  getCurrentTheme(): ColorPalette {
    return this.currentThemeSubject.value;
  }

  setTheme(palette: ColorPalette): void {
    this.currentThemeSubject.next(palette);
    this.applyTheme(palette);
    this.saveCurrentTheme(palette.id);
  }

  private applyTheme(palette: ColorPalette): void {
    const root = document.documentElement;
    
    // Aplicar variables CSS
    root.style.setProperty('--primary-color', palette.colors.primary);
    root.style.setProperty('--secondary-color', palette.colors.secondary);
    root.style.setProperty('--accent-color', palette.colors.accent);
    root.style.setProperty('--success-color', palette.colors.success);
    root.style.setProperty('--danger-color', palette.colors.danger);
    root.style.setProperty('--warning-color', palette.colors.warning);
    root.style.setProperty('--background-color', palette.colors.background);
    root.style.setProperty('--surface-color', palette.colors.surface);
    root.style.setProperty('--text-color', palette.colors.text);
    root.style.setProperty('--text-secondary-color', palette.colors.textSecondary);
    
    // Actualizar colores existentes
    root.style.setProperty('--content-bg', palette.colors.background);
    root.style.setProperty('--header-bg', palette.colors.surface);
    root.style.setProperty('--sidebar-bg', palette.colors.secondary);
  }

  private saveCurrentTheme(paletteId: string): void {
    localStorage.setItem(this.CONFIG_KEY, paletteId);
  }

  private loadSavedTheme(): void {
    try {
      const savedThemeId = localStorage.getItem(this.CONFIG_KEY);
      if (savedThemeId) {
        const allPalettes = this.getAllPalettes();
        const savedPalette = allPalettes.find(p => p.id === savedThemeId);
        
        if (savedPalette) {
          this.setTheme(savedPalette);
          return;
        }
      }
    } catch (error) {
      console.error('Error loading saved theme:', error);
    }
    
    // Aplicar tema por defecto
    this.applyTheme(this.getDefaultPalettes()[0]);
  }

  private async loadCustomPalettes(): Promise<void> {
    try {
      this.customPalettesCache = await this.paletteStorage.getAllPalettes().toPromise() || [];
    } catch (error) {
      console.error('Error loading custom palettes:', error);
      this.customPalettesCache = [];
    }
  }

  async addCustomPalette(palette: ColorPalette): Promise<void> {
    try {
      await this.paletteStorage.savePalette(palette).toPromise();
      this.customPalettesCache.push(palette);
    } catch (error) {
      console.error('Error adding custom palette:', error);
    }
  }

  async removeCustomPalette(paletteId: string): Promise<void> {
    try {
      await this.paletteStorage.deletePalette(paletteId).toPromise();
      this.customPalettesCache = this.customPalettesCache.filter(p => p.id !== paletteId);
    } catch (error) {
      console.error('Error removing custom palette:', error);
    }
  }

  getCustomPalettes(): ColorPalette[] {
    return this.customPalettesCache;
  }

  getAllPalettes(): ColorPalette[] {
    return [...this.getDefaultPalettes(), ...this.customPalettesCache];
  }

  generatePaletteId(): string {
    return 'custom-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}