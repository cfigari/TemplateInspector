const fs = require('fs');
const { execSync } = require('child_process');

// Leer el archivo de versión actual
const versionFile = './version.json';
const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));

// Incrementar el número de build
versionData.build += 1;

// Obtener el hash del último commit
try {
  versionData.lastCommit = execSync('git rev-parse --short HEAD').toString().trim();
} catch (error) {
  console.error('Error al obtener el hash del commit:', error);
}

// Actualizar la fecha
versionData.date = new Date().toISOString().split('T')[0];

// Guardar los cambios en el archivo principal
fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2));

// Crear directorio assets si no existe
const assetsDir = './src/assets';
if (!fs.existsSync(assetsDir)) {
  try {
    fs.mkdirSync(assetsDir, { recursive: true });
  } catch (error) {
    console.error('Error al crear el directorio assets:', error);
  }
}

// Guardar también en assets para que sea accesible desde la aplicación
try {
  fs.writeFileSync('./src/assets/version.json', JSON.stringify(versionData, null, 2));
} catch (error) {
  console.error('Error al guardar el archivo de versión en assets:', error);
}

console.log(`Versión actualizada: ${versionData.version} (build ${versionData.build})`);