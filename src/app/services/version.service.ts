import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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

  constructor(private http: HttpClient) {}

  getVersion(): Observable<VersionInfo> {
    if (this.versionInfo) {
      return of(this.versionInfo);
    }

    return this.http.get<VersionInfo>('assets/version.json').pipe(
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