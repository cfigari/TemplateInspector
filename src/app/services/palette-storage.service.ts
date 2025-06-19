import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { ColorPalette } from './theme.service';

@Injectable({
  providedIn: 'root'
})
export class PaletteStorageService {
  private dbName = 'templateInspectorDB';
  private storeName = 'palettes';
  private dbVersion = 2; // Incrementamos la versión

  constructor() {
    this.initDB();
  }

  private initDB(): void {
    const request = indexedDB.open(this.dbName, this.dbVersion);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Crear store de paletas si no existe
      if (!db.objectStoreNames.contains(this.storeName)) {
        const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
      }
    };

    request.onerror = (event) => {
      console.error('Error al abrir la base de datos:', (event.target as IDBOpenDBRequest).error);
    };
  }

  private getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };
      
      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  savePalette(palette: ColorPalette): Observable<ColorPalette> {
    return from(this.getDB()).pipe(
      switchMap(db => {
        return new Promise<ColorPalette>((resolve, reject) => {
          try {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(palette);
            
            request.onsuccess = () => {
              resolve(palette);
            };
            
            request.onerror = (event) => {
              reject('Error al guardar la paleta: ' + (event.target as IDBRequest).error);
            };
            
            transaction.oncomplete = () => {
              db.close();
            };
          } catch (error) {
            reject('Error en la transacción: ' + error);
          }
        });
      }),
      catchError(error => {
        console.error('Error en savePalette:', error);
        return of(palette);
      })
    );
  }

  getAllPalettes(): Observable<ColorPalette[]> {
    return from(this.getDB()).pipe(
      switchMap(db => {
        return new Promise<ColorPalette[]>((resolve, reject) => {
          try {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
              resolve(request.result);
            };
            
            request.onerror = () => {
              reject('Error al obtener las paletas');
            };
            
            transaction.oncomplete = () => {
              db.close();
            };
          } catch (error) {
            reject('Error en la transacción: ' + error);
          }
        });
      }),
      catchError(error => {
        console.error('Error en getAllPalettes:', error);
        return of([]);
      })
    );
  }

  deletePalette(paletteId: string): Observable<boolean> {
    return from(this.getDB()).pipe(
      switchMap(db => {
        return new Promise<boolean>((resolve, reject) => {
          try {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(paletteId);
            
            request.onsuccess = () => {
              resolve(true);
            };
            
            request.onerror = () => {
              reject('Error al eliminar la paleta');
            };
            
            transaction.oncomplete = () => {
              db.close();
            };
          } catch (error) {
            reject('Error en la transacción: ' + error);
          }
        });
      }),
      catchError(error => {
        console.error('Error en deletePalette:', error);
        return of(false);
      })
    );
  }
}