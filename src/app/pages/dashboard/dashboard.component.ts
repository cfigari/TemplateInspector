import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  // Datos de ejemplo para el dashboard de CloudFormation
  stats = [
    { title: 'Templates Analizados', value: 24, icon: 'bi bi-file-code' },
    { title: 'Recursos AWS', value: 156, icon: 'bi bi-hdd-stack' },
    { title: 'Problemas Detectados', value: 7, icon: 'bi bi-exclamation-triangle' },
    { title: 'Costo Estimado', value: '$1,245', icon: 'bi bi-currency-dollar' }
  ];
}