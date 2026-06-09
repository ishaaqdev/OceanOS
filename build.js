const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');

// Recursive copy helper
function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      if (element !== 'node_modules' && element !== 'dist') {
        copyFolderSync(fromPath, toPath);
      }
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

// Clear target directory
function cleanDist() {
  if (fs.existsSync(distDir)) {
    console.log('Cleaning existing dist directory...');
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });
}

function buildViteProject(folderName, targetSubdir) {
  const dirPath = path.join(rootDir, folderName);
  console.log(`\n--- Building Vite Project: ${folderName} ---`);
  
  try {
    console.log(`Installing dependencies in ${folderName}...`);
    execSync('npm install', { cwd: dirPath, stdio: 'inherit' });
    
    console.log(`Running build in ${folderName}...`);
    execSync('npm run build', { cwd: dirPath, stdio: 'inherit' });
    
    const buildOutDir = path.join(dirPath, 'dist');
    const targetOutDir = path.join(distDir, targetSubdir);
    
    console.log(`Copying built assets from ${buildOutDir} to ${targetOutDir}...`);
    copyFolderSync(buildOutDir, targetOutDir);
  } catch (err) {
    console.error(`Error building project ${folderName}:`, err.message);
    process.exit(1);
  }
}

function copyStaticApp(folderName, targetSubdir) {
  const dirPath = path.join(rootDir, folderName);
  const targetOutDir = path.join(distDir, targetSubdir);
  console.log(`Copying static application ${folderName} to ${targetOutDir}...`);
  
  if (fs.existsSync(dirPath)) {
    copyFolderSync(dirPath, targetOutDir);
  } else {
    console.error(`Static directory not found: ${folderName}`);
  }
}

function main() {
  console.log('Starting OceanOS Production Build Process...');
  cleanDist();

  // 1. Compile Vite Applications
  buildViteProject('river simulator', 'river-simulator');
  buildViteProject('ocean clean', 'ocean-clean');

  // 2. Copy Static Applications
  copyStaticApp('dashboard', 'dashboard');
  copyStaticApp('fisherman-app', 'fisherman-app');
  copyStaticApp('simulation', 'simulation');
  copyStaticApp('ocean-drone-sim', 'ocean-drone-sim');
  copyStaticApp('ocean-pollution-sim', 'ocean-pollution-sim');
  copyStaticApp('shared', 'shared');

  // 3. Copy Landing Page to Root of dist
  console.log('\nCopying main landing page assets...');
  if (fs.existsSync(path.join(rootDir, 'index.html'))) {
    fs.copyFileSync(path.join(rootDir, 'index.html'), path.join(distDir, 'index.html'));
  }
  if (fs.existsSync(path.join(rootDir, 'style.css'))) {
    fs.copyFileSync(path.join(rootDir, 'style.css'), path.join(distDir, 'style.css'));
  }

  console.log('\nOceanOS Build Completed Successfully! Output located at:', distDir);
}

main();
