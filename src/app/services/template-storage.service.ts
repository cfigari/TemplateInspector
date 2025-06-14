import { Injectable } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

export interface Template {
  id?: number;
  name: string;
  type: string;
  size: string;
  date: string;
  status: string;
  content: string | ArrayBuffer;
}

@Injectable({
  providedIn: 'root'
})
export class TemplateStorageService {
  private dbName = 'templateInspectorDB';
  private storeName = 'templates';
  private dbVersion = 1;

  constructor() {
    this.initDB();
  }

  private initDB(): void {
    const request = indexedDB.open(this.dbName, this.dbVersion);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(this.storeName)) {
        const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
        store.createIndex('name', 'name', { unique: false });
        store.createIndex('date', 'date', { unique: false });
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

  saveTemplate(template: Template): Observable<Template> {
    return from(this.getDB()).pipe(
      switchMap(db => {
        return new Promise<Template>((resolve, reject) => {
          try {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            
            let request;
            if (template.id !== undefined) {
              // Actualizar template existente
              request = store.put(template);
            } else {
              // Añadir nuevo template
              request = store.add(template);
            }
            
            request.onsuccess = (event) => {
              if (template.id === undefined) {
                template.id = (event.target as IDBRequest).result as number;
              }
              resolve(template);
            };
            
            request.onerror = (event) => {
              reject('Error al guardar el template: ' + (event.target as IDBRequest).error);
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
        console.error('Error en saveTemplate:', error);
        return of({ ...template, status: 'Error' });
      })
    );
  }

  getAllTemplates(): Observable<Template[]> {
    return from(this.getDB()).pipe(
      switchMap(db => {
        return new Promise<Template[]>((resolve, reject) => {
          try {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();
            
            request.onsuccess = () => {
              resolve(request.result);
            };
            
            request.onerror = () => {
              reject('Error al obtener los templates');
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
        console.error('Error en getAllTemplates:', error);
        return of([]);
      })
    );
  }

  getTemplateById(id: number): Observable<Template | undefined> {
    return from(this.getDB()).pipe(
      switchMap(db => {
        return new Promise<Template | undefined>((resolve, reject) => {
          try {
            const transaction = db.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);
            
            request.onsuccess = () => {
              resolve(request.result);
            };
            
            request.onerror = () => {
              reject('Error al obtener el template');
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
        console.error('Error en getTemplateById:', error);
        return of(undefined);
      })
    );
  }

  deleteTemplate(id: number): Observable<boolean> {
    return from(this.getDB()).pipe(
      switchMap(db => {
        return new Promise<boolean>((resolve, reject) => {
          try {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => {
              resolve(true);
            };
            
            request.onerror = () => {
              reject('Error al eliminar el template');
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
        console.error('Error en deleteTemplate:', error);
        return of(false);
      })
    );
  }
}