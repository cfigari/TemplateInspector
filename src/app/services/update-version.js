const fs = require('fs');
const { execSync } = require('child_process');

// Leer el archivo de versión actual desde assets
const versionFile = './src/assets/version.json';
const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));

// Incrementar el número de build
versionData.build += 1;

// Obtener el hash del último commit
try {
  versionData.lastCommit = execSync('git rev-parse --short HEAD').toString().trim();
} catch (error) {
  console.error('Error al obtener el hash del commit:', error);
}

// Obtener la fecha del último commit
try {
  versionData.date = execSync('git log -1 --pretty=%cd --date=short').toString().trim();
} catch (error) {
  console.error('Error al obtener la fecha del commit:', error);
  // Fallback a fecha actual si falla
  versionData.date = new Date().toISOString().split('T')[0];
}

// Guardar los cambios directamente en assets
fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2));

console.log(`Versión actualizada: ${versionData.version} (build ${versionData.build})`);