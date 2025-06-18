import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { VersionService } from '../../../services/version.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  menuItems = [
    { icon: 'bi bi-house', title: 'Dashboard', route: '/dashboard' },
    { icon: 'bi bi-file-code', title: 'Templates', route: '/templates' },
    { icon: 'bi bi-check-circle', title: 'Validación', route: '/validation' },
    { icon: 'bi bi-shield-check', title: 'Seguridad', route: '/security' },
    { icon: 'bi bi-graph-up', title: 'Costos', route: '/costs' },
    { icon: 'bi bi-gear', title: 'Configuración', route: '/settings' }
  ];

  version = {
    number: '0.1.0',
    build: '1',
    commit: '',
    date: ''
  };

  constructor(private versionService: VersionService) {}

  ngOnInit() {
    this.versionService.getVersion().subscribe(versionInfo => {
      this.version.number = versionInfo.version;
      this.version.build = versionInfo.build.toString();
      this.version.commit = versionInfo.lastCommit;
      this.version.date = versionInfo.date;
    });
  }
}