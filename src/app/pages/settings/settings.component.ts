import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ThemeService, ColorPalette } from '../../services/theme.service';
import { FrontendConfigService, FrontendConfig } from '../../services/frontend-config.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  // Paletas de colores
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

  // Configuraciones de frontend
  availableConfigs: FrontendConfig[] = [];
  currentConfig: FrontendConfig | null = null;
  selectedConfig: FrontendConfig | null = null;
  showCustomConfigForm = false;
  editingConfig = false;
  
  customConfig!: FrontendConfig;

  activeTab = 'colors';

  constructor(
    private themeService: ThemeService,
    private frontendConfigService: FrontendConfigService
  ) {
    this.customConfig = this.frontendConfigService.createEmptyConfig();
  }

  ngOnInit(): void {
    this.loadPalettes();
    this.loadConfigs();
    
    this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
      this.selectedPalette = theme;
    });

    this.frontendConfigService.currentConfig$.subscribe(config => {
      this.currentConfig = config;
      this.selectedConfig = config;
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Métodos para paletas
  loadPalettes(): void {
    this.availablePalettes = this.themeService.getAllPalettes();
  }

  selectPalette(palette: ColorPalette): void {
    this.selectedPalette = palette;
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

  async saveCustomPalette(): Promise<void> {
    if (!this.customPalette.name.trim()) {
      alert('Por favor ingresa un nombre para la paleta');
      return;
    }

    this.customPalette.id = this.themeService.generatePaletteId();
    await this.themeService.addCustomPalette({ ...this.customPalette });
    this.loadPalettes();
    this.hideCustomPaletteForm();
  }

  async removeCustomPalette(palette: ColorPalette): Promise<void> {
    if (confirm(`¿Estás seguro de eliminar la paleta "${palette.name}"?`)) {
      await this.themeService.removeCustomPalette(palette.id);
      this.loadPalettes();
      
      if (this.selectedPalette?.id === palette.id) {
        this.selectedPalette = this.themeService.getDefaultPalettes()[0];
      }
      
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

  // Métodos para configuraciones de frontend
  loadConfigs(): void {
    this.availableConfigs = this.frontendConfigService.getAllConfigs();
  }

  selectConfig(config: FrontendConfig): void {
    this.selectedConfig = config;
    if (!this.isCustomConfig(config)) {
      this.frontendConfigService.setConfig(config);
    }
  }

  applySelectedConfig(): void {
    if (this.selectedConfig) {
      this.frontendConfigService.setConfig(this.selectedConfig);
    }
  }

  isCurrentConfig(config: FrontendConfig): boolean {
    return this.currentConfig?.id === config.id;
  }

  showAddCustomConfig(): void {
    this.editingConfig = false;
    this.showCustomConfigForm = true;
    this.resetCustomConfig();
  }

  editCustomConfig(config: FrontendConfig): void {
    this.editingConfig = true;
    this.showCustomConfigForm = true;
    this.customConfig = JSON.parse(JSON.stringify(config)); // Deep copy
  }

  hideCustomConfigForm(): void {
    this.showCustomConfigForm = false;
    this.editingConfig = false;
  }

  async saveCustomConfig(): Promise<void> {
    if (!this.customConfig.name.trim()) {
      alert('Por favor ingresa un nombre para la configuración');
      return;
    }

    if (this.editingConfig) {
      // Actualizar configuración existente
      await this.frontendConfigService.removeCustomConfig(this.customConfig.id);
      await this.frontendConfigService.addCustomConfig({ ...this.customConfig });
    } else {
      // Crear nueva configuración
      this.customConfig.id = this.frontendConfigService.generateConfigId();
      await this.frontendConfigService.addCustomConfig({ ...this.customConfig });
    }
    
    this.loadConfigs();
    this.hideCustomConfigForm();
  }

  async removeCustomConfig(config: FrontendConfig): Promise<void> {
    if (confirm(`¿Estás seguro de eliminar la configuración "${config.name}"?`)) {
      await this.frontendConfigService.removeCustomConfig(config.id);
      this.loadConfigs();
      
      if (this.selectedConfig?.id === config.id) {
        this.selectedConfig = this.frontendConfigService.getDefaultConfigs()[0];
      }
      
      if (this.isCurrentConfig(config)) {
        this.frontendConfigService.setConfig(this.frontendConfigService.getDefaultConfigs()[0]);
      }
    }
  }

  isCustomConfig(config: FrontendConfig): boolean {
    return config.id.startsWith('custom-');
  }

  updateCustomConfigComponent(componentKey: string, propertyKey: string, value: any): void {
    (this.customConfig.components as any)[componentKey][propertyKey] = value;
  }

  updateCustomConfigGlobal(propertyKey: string, value: any): void {
    (this.customConfig.global as any)[propertyKey] = value;
  }

  getFontFamilies(): { name: string; value: string }[] {
    return this.frontendConfigService.getFontFamilies();
  }

  getComponentDisplayNames(): { [key: string]: string } {
    return this.frontendConfigService.getComponentDisplayNames();
  }

  getPreviewText(componentKey: string): string {
    const previewTexts: { [key: string]: string } = {
      titles: 'Título Principal H1',
      subtitles: 'Subtítulo H3',
      buttons: 'Botón de Acción',
      tabs: 'Pestaña',
      tables: 'Contenido de Tabla',
      tableHeaders: 'ENCABEZADO',
      cards: 'Contenido de tarjeta con texto descriptivo',
      cardHeaders: 'Encabezado de Tarjeta',
      forms: 'Campo de formulario',
      badges: 'BADGE',
      alerts: 'Mensaje de alerta informativo',
      modals: 'Contenido de modal'
    };
    return previewTexts[componentKey] || 'Texto de ejemplo';
  }

  private resetCustomConfig(): void {
    this.customConfig = this.frontendConfigService.createEmptyConfig();
  }
}