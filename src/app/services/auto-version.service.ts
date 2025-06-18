import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { VersionInfo } from './version.service';

@Injectable({
  providedIn: 'root'
})
export class AutoVersionService {
  private apiUrl = 'http://localhost:3001/api';
  
  constructor(private http: HttpClient) {}

  checkAndUpdateVersion(): Observable<VersionInfo> {
    return this.http.get<{updated: boolean, version: VersionInfo}>(`${this.apiUrl}/version/check`).pipe(
      map(response => response.version),
      catchError(error => {
        console.error('Error connecting to version API:', error);
        // Fallback: cargar desde archivo local
        return this.http.get<VersionInfo>('assets/version.json').pipe(
          catchError(() => of({
            version: '0.1.0',
            build: 1,
            lastCommit: '',
            date: new Date().toISOString().split('T')[0]
          }))
        );
      })
    );
  }
}