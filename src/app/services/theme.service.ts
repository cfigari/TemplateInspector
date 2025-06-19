import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
  
  public currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    this.loadSavedTheme();
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
    this.saveTheme(palette);
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

  private saveTheme(palette: ColorPalette): void {
    const config = {
      selectedTheme: palette.id,
      customPalettes: this.getCustomPalettes()
    };
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
  }

  private loadSavedTheme(): void {
    try {
      const saved = localStorage.getItem(this.CONFIG_KEY);
      if (saved) {
        const config = JSON.parse(saved);
        const allPalettes = [...this.getDefaultPalettes(), ...config.customPalettes || []];
        const savedPalette = allPalettes.find(p => p.id === config.selectedTheme);
        
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

  addCustomPalette(palette: ColorPalette): void {
    const customPalettes = this.getCustomPalettes();
    customPalettes.push(palette);
    
    const config = {
      selectedTheme: this.getCurrentTheme().id,
      customPalettes: customPalettes
    };
    
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
  }

  removeCustomPalette(paletteId: string): void {
    const customPalettes = this.getCustomPalettes().filter(p => p.id !== paletteId);
    
    const config = {
      selectedTheme: this.getCurrentTheme().id,
      customPalettes: customPalettes
    };
    
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(config));
  }

  getCustomPalettes(): ColorPalette[] {
    try {
      const saved = localStorage.getItem(this.CONFIG_KEY);
      if (saved) {
        const config = JSON.parse(saved);
        return config.customPalettes || [];
      }
    } catch (error) {
      console.error('Error loading custom palettes:', error);
    }
    return [];
  }

  getAllPalettes(): ColorPalette[] {
    return [...this.getDefaultPalettes(), ...this.getCustomPalettes()];
  }

  generatePaletteId(): string {
    return 'custom-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}