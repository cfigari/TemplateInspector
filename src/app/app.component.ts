import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './core/layout/header/header.component';
import { SidebarComponent } from './core/layout/sidebar/sidebar.component';
import { ThemeService } from './services/theme.service';
import { FrontendConfigService } from './services/frontend-config.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, HeaderComponent, SidebarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'TemplateInspector';

  constructor(
    private themeService: ThemeService,
    private frontendConfigService: FrontendConfigService
  ) {}

  ngOnInit(): void {
    // Los servicios se inicializan automáticamente y cargan las configuraciones guardadas
  }
}