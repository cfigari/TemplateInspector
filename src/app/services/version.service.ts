import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AutoVersionService } from './auto-version.service';

export interface VersionInfo {
  version: string;
  build: number;
  lastCommit: string;
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class VersionService {
  private versionInfo: VersionInfo | null = null;

  constructor(
    private http: HttpClient,
    private autoVersion: AutoVersionService
  ) {}

  getVersion(): Observable<VersionInfo> {
    if (this.versionInfo) {
      return of(this.versionInfo);
    }

    // Verificar y actualizar versión automáticamente
    return this.autoVersion.checkAndUpdateVersion().pipe(
      tap(versionInfo => {
        this.versionInfo = versionInfo;
      }),
      catchError(error => {
        console.error('Error al cargar la información de versión:', error);
        return of({
          version: '0.1.0',
          build: 1,
          lastCommit: '',
          date: new Date().toISOString().split('T')[0]
        });
      })
    );
  }
}