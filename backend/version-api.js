const express = require('express');
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta del archivo version.json
const versionFilePath = path.join(__dirname, '../src/assets/version.json');

// Endpoint para verificar y actualizar versión
app.get('/api/version/check', (req, res) => {
  try {
    // Leer version.json actual
    const currentVersion = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
    
    // Obtener último commit desde Git
    const gitCommit = execSync('git rev-parse --short HEAD').toString().trim();
    
    // Si el commit es diferente, actualizar
    if (gitCommit !== currentVersion.lastCommit) {
      const updatedVersion = {
        ...currentVersion,
        build: currentVersion.build + 1,
        lastCommit: gitCommit,
        date: execSync('git log -1 --pretty=%cd --date=short').toString().trim()
      };
      
      // Guardar archivo actualizado
      fs.writeFileSync(versionFilePath, JSON.stringify(updatedVersion, null, 2));
      
      res.json({
        updated: true,
        version: updatedVersion
      });
    } else {
      res.json({
        updated: false,
        version: currentVersion
      });
    }
  } catch (error) {
    console.error('Error checking version:', error);
    res.status(500).json({ error: 'Error checking version' });
  }
});

// Endpoint para obtener versión actual
app.get('/api/version', (req, res) => {
  try {
    const version = JSON.parse(fs.readFileSync(versionFilePath, 'utf8'));
    res.json(version);
  } catch (error) {
    console.error('Error reading version:', error);
    res.status(500).json({ error: 'Error reading version' });
  }
});

app.listen(PORT, () => {
  console.log(`Version API running on http://localhost:${PORT}`);
});