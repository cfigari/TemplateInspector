import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService, ColorPalette } from '../../services/theme.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  availablePalettes: ColorPalette[] = [];
  currentTheme: ColorPalette | null = null;
  selectedPalette: ColorPalette | null = null;
  showCustomPaletteForm = false;
  
  customPalette: ColorPalette = {
    id: '',
    name: '',
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
  };

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.loadPalettes();
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
      this.selectedPalette = theme;
    });
  }

  loadPalettes(): void {
    this.availablePalettes = this.themeService.getAllPalettes();
  }

  selectPalette(palette: ColorPalette): void {
    this.selectedPalette = palette;
    // Aplicar automáticamente las paletas predefinidas
    if (!this.isCustomPalette(palette)) {
      this.themeService.setTheme(palette);
    }
  }

  applySelectedPalette(): void {
    if (this.selectedPalette) {
      this.themeService.setTheme(this.selectedPalette);
    }
  }

  isCurrentTheme(palette: ColorPalette): boolean {
    return this.currentTheme?.id === palette.id;
  }

  showAddCustomPalette(): void {
    this.showCustomPaletteForm = true;
    this.resetCustomPalette();
  }

  hideCustomPaletteForm(): void {
    this.showCustomPaletteForm = false;
  }

  saveCustomPalette(): void {
    if (!this.customPalette.name.trim()) {
      alert('Por favor ingresa un nombre para la paleta');
      return;
    }

    this.customPalette.id = this.themeService.generatePaletteId();
    this.themeService.addCustomPalette({ ...this.customPalette });
    this.loadPalettes();
    this.hideCustomPaletteForm();
  }

  removeCustomPalette(palette: ColorPalette): void {
    if (confirm(`¿Estás seguro de eliminar la paleta "${palette.name}"?`)) {
      this.themeService.removeCustomPalette(palette.id);
      this.loadPalettes();
      
      // Si era la paleta seleccionada, cambiar a la primera disponible
      if (this.selectedPalette?.id === palette.id) {
        this.selectedPalette = this.themeService.getDefaultPalettes()[0];
      }
      
      // Si era la paleta actual, cambiar a la primera disponible
      if (this.isCurrentTheme(palette)) {
        this.themeService.setTheme(this.themeService.getDefaultPalettes()[0]);
      }
    }
  }

  isCustomPalette(palette: ColorPalette): boolean {
    return palette.id.startsWith('custom-');
  }

  getColorDisplayName(colorKey: string): string {
    const names: { [key: string]: string } = {
      primary: 'Primario',
      secondary: 'Secundario',
      accent: 'Acento',
      success: 'Éxito',
      danger: 'Peligro',
      warning: 'Advertencia',
      background: 'Fondo',
      surface: 'Superficie',
      text: 'Texto',
      textSecondary: 'Texto Secundario'
    };
    return names[colorKey] || colorKey;
  }

  updateCustomColor(colorKey: string, value: string): void {
    (this.customPalette.colors as any)[colorKey] = value;
  }

  private resetCustomPalette(): void {
    this.customPalette = {
      id: '',
      name: '',
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
    };
  }
}