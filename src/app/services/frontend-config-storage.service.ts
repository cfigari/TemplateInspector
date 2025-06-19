import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { FrontendConfig } from './frontend-config.service';

@Injectable({
  providedIn: 'root'
})
export class FrontendConfigStorageService {
  private dbName = 'templateInspectorDB';
  private storeName = 'frontendConfigs';
  private dbVersion = 2;

  constructor() {
    this.initDB();
  }

  private initDB(): void {
    const request = indexedDB.open(this.dbName, this.dbVersion);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Crear store de configuraciones frontend si no existe
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

  saveConfig(config: FrontendConfig): Observable<FrontendConfig> {
    return from(this.getDB()).pipe(
      switchMap(db => {
        return new Promise<FrontendConfig>((resolve, reject) => {
          try {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(config);
            
            request.onsuccess = () => {
              resolve(config);
            };
            
            request.onerror = (event) => {
              reject('Error al guardar la configuración: ' + (event.target as IDBRequest).error);
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
        console.error('Error en saveConfig:', error);
        return of(config);
      })
    );
  }

  getAllConfigs(): Observable<FrontendConfig[]> {
    return from(this.getDB()).pipe(
      switchMap(db => {
        return new Promise<FrontendConfig[]>((resolve, reject) => {
          try {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
              resolve(request.result);
            };
            
            request.onerror = () => {
              reject('Error al obtener las configuraciones');
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
        console.error('Error en getAllConfigs:', error);
        return of([]);
      })
    );
  }

  deleteConfig(configId: string): Observable<boolean> {
    return from(this.getDB()).pipe(
      switchMap(db => {
        return new Promise<boolean>((resolve, reject) => {
          try {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(configId);
            
            request.onsuccess = () => {
              resolve(true);
            };
            
            request.onerror = () => {
              reject('Error al eliminar la configuración');
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
        console.error('Error en deleteConfig:', error);
        return of(false);
      })
    );
  }
}