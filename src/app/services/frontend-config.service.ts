import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FrontendConfigStorageService } from './frontend-config-storage.service';

export interface ComponentConfig {
  fontSize: string;
  fontFamily: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  textTransform: string;
  color: string;
  backgroundColor: string;
  borderRadius: string;
  padding: string;
  margin: string;
  border: string;
  boxShadow: string;
}

export interface FrontendConfig {
  id: string;
  name: string;
  components: {
    titles: ComponentConfig;
    subtitles: ComponentConfig;
    buttons: ComponentConfig;
    tabs: ComponentConfig;
    tables: ComponentConfig;
    tableHeaders: ComponentConfig;
    cards: ComponentConfig;
    cardHeaders: ComponentConfig;
    forms: ComponentConfig;
    badges: ComponentConfig;
    alerts: ComponentConfig;
    modals: ComponentConfig;
  };
  global: {
    animations: boolean;
    shadows: boolean;
    compactMode: boolean;
    sidebarWidth: string;
    headerHeight: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class FrontendConfigService {
  private readonly CONFIG_KEY = 'frontend-config';
  private currentConfigSubject = new BehaviorSubject<FrontendConfig>(this.getDefaultConfigs()[0]);
  private customConfigsCache: FrontendConfig[] = [];
  
  public currentConfig$ = this.currentConfigSubject.asObservable();

  constructor(private configStorage: FrontendConfigStorageService) {
    this.loadCustomConfigs().then(() => {
      this.loadSavedConfig();
    });
  }

  getFontFamilies(): { name: string; value: string }[] {
    return [
      { name: 'Segoe UI', value: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" },
      { name: 'Inter', value: "'Inter', 'Helvetica Neue', Arial, sans-serif" },
      { name: 'Roboto', value: "'Roboto', Arial, sans-serif" },
      { name: 'Open Sans', value: "'Open Sans', Arial, sans-serif" },
      { name: 'Lato', value: "'Lato', Arial, sans-serif" },
      { name: 'Poppins', value: "'Poppins', Arial, sans-serif" },
      { name: 'Montserrat', value: "'Montserrat', Arial, sans-serif" },
      { name: 'Source Sans Pro', value: "'Source Sans Pro', Arial, sans-serif" },
      { name: 'Nunito', value: "'Nunito', Arial, sans-serif" },
      { name: 'Raleway', value: "'Raleway', Arial, sans-serif" },
      { name: 'JetBrains Mono', value: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace" },
      { name: 'Fira Code', value: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace" },
      { name: 'Consolas', value: "'Consolas', 'Monaco', 'Courier New', monospace" },
      { name: 'Source Code Pro', value: "'Source Code Pro', 'Monaco', 'Courier New', monospace" },
      { name: 'Georgia', value: "'Georgia', 'Times New Roman', serif" },
      { name: 'Times New Roman', value: "'Times New Roman', Georgia, serif" },
      { name: 'Playfair Display', value: "'Playfair Display', Georgia, serif" },
      { name: 'Merriweather', value: "'Merriweather', Georgia, serif" }
    ];
  }

  getComponentDisplayNames(): { [key: string]: string } {
    return {
      titles: 'Títulos (H1, H2)',
      subtitles: 'Subtítulos (H3, H4, H5)',
      buttons: 'Botones',
      tabs: 'Pestañas de Navegación',
      tables: 'Tablas/Grillas',
      tableHeaders: 'Encabezados de Tabla',
      cards: 'Tarjetas de Contenido',
      cardHeaders: 'Encabezados de Tarjeta',
      forms: 'Formularios (Inputs, Selects)',
      badges: 'Etiquetas/Badges',
      alerts: 'Mensajes de Alerta',
      modals: 'Ventanas Modales'
    };
  }

  getDefaultConfigs(): FrontendConfig[] {
    return [
      {
        id: 'default',
        name: 'Por Defecto',
        components: {
          titles: {
            fontSize: '2rem',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: '700',
            lineHeight: '1.2',
            letterSpacing: '-0.025em',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'transparent',
            borderRadius: '0',
            padding: '0',
            margin: '0 0 1.5rem 0',
            border: 'none',
            boxShadow: 'none'
          },
          subtitles: {
            fontSize: '1.25rem',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: '600',
            lineHeight: '1.3',
            letterSpacing: '-0.01em',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'transparent',
            borderRadius: '0',
            padding: '0',
            margin: '0 0 1rem 0',
            border: 'none',
            boxShadow: 'none'
          },
          buttons: {
            fontSize: '0.875rem',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: '500',
            lineHeight: '1.4',
            letterSpacing: '0.01em',
            textTransform: 'none',
            color: 'white',
            backgroundColor: 'var(--primary-color)',
            borderRadius: '6px',
            padding: '0.75rem 1.5rem',
            margin: '0',
            border: '1px solid var(--primary-color)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          },
          tabs: {
            fontSize: '0.875rem',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: '500',
            lineHeight: '1.4',
            letterSpacing: '0.01em',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'transparent',
            borderRadius: '6px 6px 0 0',
            padding: '0.75rem 1rem',
            margin: '0',
            border: '1px solid #dee2e6',
            boxShadow: 'none'
          },
          tables: {
            fontSize: '0.875rem',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: '400',
            lineHeight: '1.5',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'var(--surface-color)',
            borderRadius: '8px',
            padding: '0',
            margin: '0',
            border: '1px solid #dee2e6',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
          },
          tableHeaders: {
            fontSize: '0.8rem',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: '600',
            lineHeight: '1.4',
            letterSpacing: '0.025em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary-color)',
            backgroundColor: '#f8f9fa',
            borderRadius: '0',
            padding: '0.75rem',
            margin: '0',
            border: 'none',
            boxShadow: 'none'
          },
          cards: {
            fontSize: '0.875rem',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: '400',
            lineHeight: '1.5',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'var(--surface-color)',
            borderRadius: '8px',
            padding: '1.5rem',
            margin: '0 0 1.5rem 0',
            border: '1px solid #e9ecef',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
          },
          cardHeaders: {
            fontSize: '1.125rem',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: '600',
            lineHeight: '1.3',
            letterSpacing: '-0.01em',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'transparent',
            borderRadius: '0',
            padding: '0 0 1rem 0',
            margin: '0',
            border: 'none',
            boxShadow: 'none'
          },
          forms: {
            fontSize: '0.875rem',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: '400',
            lineHeight: '1.5',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'var(--surface-color)',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            margin: '0',
            border: '1px solid #ced4da',
            boxShadow: 'none'
          },
          badges: {
            fontSize: '0.75rem',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: '500',
            lineHeight: '1.2',
            letterSpacing: '0.025em',
            textTransform: 'uppercase',
            color: 'white',
            backgroundColor: 'var(--primary-color)',
            borderRadius: '12px',
            padding: '0.25rem 0.75rem',
            margin: '0',
            border: 'none',
            boxShadow: 'none'
          },
          alerts: {
            fontSize: '0.875rem',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: '400',
            lineHeight: '1.5',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            padding: '1rem',
            margin: '0 0 1rem 0',
            border: '1px solid #dee2e6',
            boxShadow: 'none'
          },
          modals: {
            fontSize: '0.875rem',
            fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: '400',
            lineHeight: '1.5',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'var(--surface-color)',
            borderRadius: '12px',
            padding: '0',
            margin: '0',
            border: 'none',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
          }
        },
        global: {
          animations: true,
          shadows: true,
          compactMode: false,
          sidebarWidth: '60px',
          headerHeight: '60px'
        }
      },
      {
        id: 'elegant',
        name: 'Elegante',
        components: {
          titles: {
            fontSize: '2.25rem',
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: '700',
            lineHeight: '1.2',
            letterSpacing: '-0.02em',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'transparent',
            borderRadius: '0',
            padding: '0',
            margin: '0 0 2rem 0',
            border: 'none',
            boxShadow: 'none'
          },
          subtitles: {
            fontSize: '1.375rem',
            fontFamily: "'Merriweather', Georgia, serif",
            fontWeight: '600',
            lineHeight: '1.4',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'transparent',
            borderRadius: '0',
            padding: '0',
            margin: '0 0 1.5rem 0',
            border: 'none',
            boxShadow: 'none'
          },
          buttons: {
            fontSize: '0.875rem',
            fontFamily: "'Lato', Arial, sans-serif",
            fontWeight: '500',
            lineHeight: '1.4',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            color: 'white',
            backgroundColor: 'var(--primary-color)',
            borderRadius: '4px',
            padding: '0.7rem 1.4rem',
            margin: '0',
            border: '1px solid var(--primary-color)',
            boxShadow: '0 3px 8px rgba(0, 0, 0, 0.15)'
          },
          tabs: {
            fontSize: '0.875rem',
            fontFamily: "'Lato', Arial, sans-serif",
            fontWeight: '500',
            lineHeight: '1.4',
            letterSpacing: '0.01em',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'transparent',
            borderRadius: '4px 4px 0 0',
            padding: '0.7rem 1.1rem',
            margin: '0',
            border: '1px solid #dee2e6',
            boxShadow: 'none'
          },
          tables: {
            fontSize: '0.875rem',
            fontFamily: "'Open Sans', Arial, sans-serif",
            fontWeight: '400',
            lineHeight: '1.5',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'var(--surface-color)',
            borderRadius: '6px',
            padding: '0',
            margin: '0',
            border: '1px solid #dee2e6',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
          },
          tableHeaders: {
            fontSize: '0.8rem',
            fontFamily: "'Lato', Arial, sans-serif",
            fontWeight: '700',
            lineHeight: '1.4',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary-color)',
            backgroundColor: '#f5f5f5',
            borderRadius: '0',
            padding: '0.8rem',
            margin: '0',
            border: 'none',
            boxShadow: 'none'
          },
          cards: {
            fontSize: '0.9rem',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontWeight: '400',
            lineHeight: '1.6',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'var(--surface-color)',
            borderRadius: '8px',
            padding: '1.8rem',
            margin: '0 0 1.8rem 0',
            border: '1px solid #e5e5e5',
            boxShadow: '0 6px 18px rgba(0, 0, 0, 0.08)'
          },
          cardHeaders: {
            fontSize: '1.25rem',
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: '600',
            lineHeight: '1.3',
            letterSpacing: '-0.01em',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'transparent',
            borderRadius: '0',
            padding: '0 0 1.2rem 0',
            margin: '0',
            border: 'none',
            boxShadow: 'none'
          },
          forms: {
            fontSize: '0.9rem',
            fontFamily: "'Open Sans', Arial, sans-serif",
            fontWeight: '400',
            lineHeight: '1.5',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'var(--surface-color)',
            borderRadius: '4px',
            padding: '0.8rem 1rem',
            margin: '0',
            border: '1px solid #ccc',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)'
          },
          badges: {
            fontSize: '0.75rem',
            fontFamily: "'Lato', Arial, sans-serif",
            fontWeight: '600',
            lineHeight: '1.2',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'white',
            backgroundColor: 'var(--primary-color)',
            borderRadius: '6px',
            padding: '0.3rem 0.7rem',
            margin: '0',
            border: 'none',
            boxShadow: 'none'
          },
          alerts: {
            fontSize: '0.9rem',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontWeight: '400',
            lineHeight: '1.6',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            padding: '1.2rem',
            margin: '0 0 1.3rem 0',
            border: '1px solid #dee2e6',
            boxShadow: '0 3px 10px rgba(0, 0, 0, 0.06)'
          },
          modals: {
            fontSize: '0.9rem',
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontWeight: '400',
            lineHeight: '1.6',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'var(--surface-color)',
            borderRadius: '10px',
            padding: '0',
            margin: '0',
            border: 'none',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
          }
        },
        global: {
          animations: true,
          shadows: true,
          compactMode: false,
          sidebarWidth: '60px',
          headerHeight: '65px'
        }
      },
      {
        id: 'developer',
        name: 'Desarrollador',
        components: {
          titles: {
            fontSize: '1.75rem',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontWeight: '700',
            lineHeight: '1.2',
            letterSpacing: '0',
            textTransform: 'uppercase',
            color: 'var(--text-color)',
            backgroundColor: 'transparent',
            borderRadius: '0',
            padding: '0',
            margin: '0 0 1.5rem 0',
            border: 'none',
            boxShadow: 'none'
          },
          subtitles: {
            fontSize: '1.125rem',
            fontFamily: "'Source Code Pro', 'Monaco', 'Courier New', monospace",
            fontWeight: '600',
            lineHeight: '1.3',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'transparent',
            borderRadius: '0',
            padding: '0',
            margin: '0 0 1rem 0',
            border: 'none',
            boxShadow: 'none'
          },
          buttons: {
            fontSize: '0.8rem',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontWeight: '500',
            lineHeight: '1.4',
            letterSpacing: '0',
            textTransform: 'uppercase',
            color: 'white',
            backgroundColor: 'var(--primary-color)',
            borderRadius: '2px',
            padding: '0.6rem 1.2rem',
            margin: '0',
            border: '2px solid var(--primary-color)',
            boxShadow: 'none'
          },
          tabs: {
            fontSize: '0.8rem',
            fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
            fontWeight: '400',
            lineHeight: '1.4',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'transparent',
            borderRadius: '2px 2px 0 0',
            padding: '0.6rem 0.9rem',
            margin: '0',
            border: '1px solid #ccc',
            boxShadow: 'none'
          },
          tables: {
            fontSize: '0.8rem',
            fontFamily: "'Source Code Pro', 'Monaco', 'Courier New', monospace",
            fontWeight: '400',
            lineHeight: '1.4',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'var(--surface-color)',
            borderRadius: '2px',
            padding: '0',
            margin: '0',
            border: '1px solid #ddd',
            boxShadow: 'none'
          },
          tableHeaders: {
            fontSize: '0.75rem',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontWeight: '700',
            lineHeight: '1.3',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            color: 'var(--text-secondary-color)',
            backgroundColor: '#f0f0f0',
            borderRadius: '0',
            padding: '0.6rem',
            margin: '0',
            border: 'none',
            boxShadow: 'none'
          },
          cards: {
            fontSize: '0.85rem',
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
            fontWeight: '400',
            lineHeight: '1.4',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'var(--surface-color)',
            borderRadius: '2px',
            padding: '1.2rem',
            margin: '0 0 1.2rem 0',
            border: '1px solid #ddd',
            boxShadow: 'none'
          },
          cardHeaders: {
            fontSize: '1rem',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontWeight: '600',
            lineHeight: '1.3',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'transparent',
            borderRadius: '0',
            padding: '0 0 0.8rem 0',
            margin: '0',
            border: 'none',
            boxShadow: 'none'
          },
          forms: {
            fontSize: '0.8rem',
            fontFamily: "'Source Code Pro', 'Monaco', 'Courier New', monospace",
            fontWeight: '400',
            lineHeight: '1.4',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'var(--surface-color)',
            borderRadius: '2px',
            padding: '0.6rem',
            margin: '0',
            border: '1px solid #ccc',
            boxShadow: 'none'
          },
          badges: {
            fontSize: '0.7rem',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontWeight: '600',
            lineHeight: '1.2',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            color: 'white',
            backgroundColor: 'var(--primary-color)',
            borderRadius: '2px',
            padding: '0.25rem 0.5rem',
            margin: '0',
            border: 'none',
            boxShadow: 'none'
          },
          alerts: {
            fontSize: '0.85rem',
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
            fontWeight: '400',
            lineHeight: '1.4',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: '#f5f5f5',
            borderRadius: '2px',
            padding: '1rem',
            margin: '0 0 1rem 0',
            border: '1px solid #ddd',
            boxShadow: 'none'
          },
          modals: {
            fontSize: '0.85rem',
            fontFamily: "'Source Code Pro', 'Monaco', 'Courier New', monospace",
            fontWeight: '400',
            lineHeight: '1.4',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'var(--surface-color)',
            borderRadius: '2px',
            padding: '0',
            margin: '0',
            border: 'none',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
          }
        },
        global: {
          animations: false,
          shadows: false,
          compactMode: true,
          sidebarWidth: '55px',
          headerHeight: '55px'
        }
      },
      {
        id: 'minimal',
        name: 'Minimalista',
        components: {
          titles: {
            fontSize: '1.875rem',
            fontFamily: "'Nunito', Arial, sans-serif",
            fontWeight: '300',
            lineHeight: '1.2',
            letterSpacing: '-0.02em',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'transparent',
            borderRadius: '0',
            padding: '0',
            margin: '0 0 1.8rem 0',
            border: 'none',
            boxShadow: 'none'
          },
          subtitles: {
            fontSize: '1.125rem',
            fontFamily: "'Raleway', Arial, sans-serif",
            fontWeight: '400',
            lineHeight: '1.4',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'transparent',
            borderRadius: '0',
            padding: '0',
            margin: '0 0 1.2rem 0',
            border: 'none',
            boxShadow: 'none'
          },
          buttons: {
            fontSize: '0.875rem',
            fontFamily: "'Nunito', Arial, sans-serif",
            fontWeight: '400',
            lineHeight: '1.4',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'white',
            backgroundColor: 'var(--primary-color)',
            borderRadius: '0',
            padding: '0.7rem 1.4rem',
            margin: '0',
            border: 'none',
            boxShadow: 'none'
          },
          tabs: {
            fontSize: '0.875rem',
            fontFamily: "'Raleway', Arial, sans-serif",
            fontWeight: '400',
            lineHeight: '1.4',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'transparent',
            borderRadius: '0',
            padding: '0.7rem 1rem',
            margin: '0',
            border: 'none',
            boxShadow: 'none'
          },
          tables: {
            fontSize: '0.875rem',
            fontFamily: "'Open Sans', Arial, sans-serif",
            fontWeight: '400',
            lineHeight: '1.5',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'var(--surface-color)',
            borderRadius: '0',
            padding: '0',
            margin: '0',
            border: '1px solid #eee',
            boxShadow: 'none'
          },
          tableHeaders: {
            fontSize: '0.8rem',
            fontFamily: "'Raleway', Arial, sans-serif",
            fontWeight: '500',
            lineHeight: '1.4',
            letterSpacing: '0.02em',
            textTransform: 'none',
            color: 'var(--text-secondary-color)',
            backgroundColor: '#fafafa',
            borderRadius: '0',
            padding: '0.7rem',
            margin: '0',
            border: 'none',
            boxShadow: 'none'
          },
          cards: {
            fontSize: '0.875rem',
            fontFamily: "'Open Sans', Arial, sans-serif",
            fontWeight: '400',
            lineHeight: '1.6',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'var(--surface-color)',
            borderRadius: '0',
            padding: '1.5rem',
            margin: '0 0 1.5rem 0',
            border: '1px solid #f0f0f0',
            boxShadow: 'none'
          },
          cardHeaders: {
            fontSize: '1.0625rem',
            fontFamily: "'Nunito', Arial, sans-serif",
            fontWeight: '500',
            lineHeight: '1.3',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'transparent',
            borderRadius: '0',
            padding: '0 0 1rem 0',
            margin: '0',
            border: 'none',
            boxShadow: 'none'
          },
          forms: {
            fontSize: '0.875rem',
            fontFamily: "'Open Sans', Arial, sans-serif",
            fontWeight: '400',
            lineHeight: '1.5',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'var(--surface-color)',
            borderRadius: '0',
            padding: '0.7rem 1rem',
            margin: '0',
            border: '1px solid #ddd',
            boxShadow: 'none'
          },
          badges: {
            fontSize: '0.75rem',
            fontFamily: "'Raleway', Arial, sans-serif",
            fontWeight: '500',
            lineHeight: '1.2',
            letterSpacing: '0.02em',
            textTransform: 'none',
            color: 'white',
            backgroundColor: 'var(--primary-color)',
            borderRadius: '0',
            padding: '0.3rem 0.6rem',
            margin: '0',
            border: 'none',
            boxShadow: 'none'
          },
          alerts: {
            fontSize: '0.875rem',
            fontFamily: "'Open Sans', Arial, sans-serif",
            fontWeight: '400',
            lineHeight: '1.5',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: '#f9f9f9',
            borderRadius: '0',
            padding: '1rem',
            margin: '0 0 1rem 0',
            border: '1px solid #eee',
            boxShadow: 'none'
          },
          modals: {
            fontSize: '0.875rem',
            fontFamily: "'Open Sans', Arial, sans-serif",
            fontWeight: '400',
            lineHeight: '1.5',
            letterSpacing: '0',
            textTransform: 'none',
            color: 'var(--text-color)',
            backgroundColor: 'var(--surface-color)',
            borderRadius: '0',
            padding: '0',
            margin: '0',
            border: 'none',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)'
          }
        },
        global: {
          animations: false,
          shadows: false,
          compactMode: false,
          sidebarWidth: '60px',
          headerHeight: '60px'
        }
      }
    ];
  }

  getDefaultComponentConfig(): ComponentConfig {
    return {
      fontSize: '0.875rem',
      fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
      fontWeight: '400',
      lineHeight: '1.5',
      letterSpacing: '0',
      textTransform: 'none',
      color: 'var(--text-color)',
      backgroundColor: 'var(--surface-color)',
      borderRadius: '6px',
      padding: '0.75rem',
      margin: '0',
      border: '1px solid #dee2e6',
      boxShadow: 'none'
    };
  }

  createEmptyConfig(): FrontendConfig {
    const defaultComponent = this.getDefaultComponentConfig();
    return {
      id: '',
      name: '',
      components: {
        titles: { ...defaultComponent },
        subtitles: { ...defaultComponent },
        buttons: { ...defaultComponent },
        tabs: { ...defaultComponent },
        tables: { ...defaultComponent },
        tableHeaders: { ...defaultComponent },
        cards: { ...defaultComponent },
        cardHeaders: { ...defaultComponent },
        forms: { ...defaultComponent },
        badges: { ...defaultComponent },
        alerts: { ...defaultComponent },
        modals: { ...defaultComponent }
      },
      global: {
        animations: true,
        shadows: true,
        compactMode: false,
        sidebarWidth: '60px',
        headerHeight: '60px'
      }
    };
  }

  getCurrentConfig(): FrontendConfig {
    return this.currentConfigSubject.value;
  }

  setConfig(config: FrontendConfig): void {
    this.currentConfigSubject.next(config);
    this.applyConfig(config);
    this.saveCurrentConfig(config.id);
  }

  private applyConfig(config: FrontendConfig): void {
    const root = document.documentElement;
    
    // Aplicar configuraciones por componente
    Object.entries(config.components).forEach(([componentType, componentConfig]) => {
      Object.entries(componentConfig).forEach(([property, value]) => {
        root.style.setProperty(`--${componentType}-${property.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
      });
    });
    
    // Aplicar configuraciones globales
    root.style.setProperty('--sidebar-width', config.global.sidebarWidth);
    root.style.setProperty('--header-height', config.global.headerHeight);
    
    // Aplicar clases condicionales
    document.body.classList.toggle('no-shadows', !config.global.shadows);
    document.body.classList.toggle('no-animations', !config.global.animations);
    document.body.classList.toggle('compact-mode', config.global.compactMode);
  }

  private saveCurrentConfig(configId: string): void {
    localStorage.setItem(this.CONFIG_KEY, configId);
  }

  private loadSavedConfig(): void {
    try {
      const savedConfigId = localStorage.getItem(this.CONFIG_KEY);
      if (savedConfigId) {
        const allConfigs = this.getAllConfigs();
        const savedConfig = allConfigs.find(c => c.id === savedConfigId);
        
        if (savedConfig) {
          this.setConfig(savedConfig);
          return;
        }
      }
    } catch (error) {
      console.error('Error loading saved config:', error);
    }
    
    // Aplicar configuración por defecto
    this.applyConfig(this.getDefaultConfigs()[0]);
  }

  private async loadCustomConfigs(): Promise<void> {
    try {
      this.customConfigsCache = await this.configStorage.getAllConfigs().toPromise() || [];
    } catch (error) {
      console.error('Error loading custom configs:', error);
      this.customConfigsCache = [];
    }
  }

  async addCustomConfig(config: FrontendConfig): Promise<void> {
    try {
      await this.configStorage.saveConfig(config).toPromise();
      this.customConfigsCache.push(config);
    } catch (error) {
      console.error('Error adding custom config:', error);
    }
  }

  async removeCustomConfig(configId: string): Promise<void> {
    try {
      await this.configStorage.deleteConfig(configId).toPromise();
      this.customConfigsCache = this.customConfigsCache.filter(c => c.id !== configId);
    } catch (error) {
      console.error('Error removing custom config:', error);
    }
  }

  getCustomConfigs(): FrontendConfig[] {
    return this.customConfigsCache;
  }

  getAllConfigs(): FrontendConfig[] {
    return [...this.getDefaultConfigs(), ...this.customConfigsCache];
  }

  generateConfigId(): string {
    return 'custom-' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}