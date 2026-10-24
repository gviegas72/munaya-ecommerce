import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const TEMP_DIR = path.join(ROOT_DIR, '_temp_claude_extracted');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const PUBLIC_UPLOADS_DIR = path.join(ROOT_DIR, 'public', 'uploads');
const DOCS_DESIGN_DIR = path.join(ROOT_DIR, 'docs', 'design');

function run(cmd) {
  console.log(`> ${cmd}`);
  return execSync(cmd, { stdio: 'inherit' });
}

function runCapture(cmd) {
  return execSync(cmd, { encoding: 'utf-8' }).trim();
}

console.log('🎸 [Munaya Rocks] Processador Automático de Design Claude');
console.log('========================================================');

// 1. Localizar arquivos .zip no repositório
const files = fs.readdirSync(ROOT_DIR);
const zipFiles = files.filter(f => f.toLowerCase().endsWith('.zip'));

if (zipFiles.length === 0) {
  console.log('ℹ️ Nenhum arquivo .zip encontrado na raiz para processar.');
  process.exit(0);
}

const targetZip = zipFiles[0];
console.log(`📦 Encontrado pacote de design: ${targetZip}`);

// 2. Criar diretórios de destino
fs.mkdirSync(PUBLIC_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true });
fs.mkdirSync(DOCS_DESIGN_DIR, { recursive: true });
if (fs.existsSync(TEMP_DIR)) {
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEMP_DIR, { recursive: true });

// 3. Descompactar via tar nativo (funciona em Windows, Mac e Linux)
console.log('📂 Descompactando conteúdo do design...');
run(`tar -xf "${targetZip}" -C "${TEMP_DIR}"`);

// 4. Copiar assets para public/
const tempPublicDir = path.join(TEMP_DIR, 'public');
if (fs.existsSync(tempPublicDir)) {
  console.log('🖼️ Copiando assets de public/...');
  for (const item of fs.readdirSync(tempPublicDir)) {
    const src = path.join(tempPublicDir, item);
    const dest = path.join(PUBLIC_DIR, item);
    fs.copyFileSync(src, dest);
    console.log(`   + public/${item}`);
  }
}

// 5. Copiar uploads/ para public/uploads/
const tempUploadsDir = path.join(TEMP_DIR, 'uploads');
if (fs.existsSync(tempUploadsDir)) {
  console.log('🎥 Copiando mídias e vídeos de uploads/...');
  for (const item of fs.readdirSync(tempUploadsDir)) {
    const src = path.join(tempUploadsDir, item);
    const dest = path.join(PUBLIC_UPLOADS_DIR, item);
    if (fs.statSync(src).isDirectory()) {
      fs.cpSync(src, dest, { recursive: true });
    } else {
      fs.copyFileSync(src, dest);
    }
    console.log(`   + public/uploads/${item}`);
  }
}

// 6. Copiar protótipos e relatórios para docs/design/
for (const item of fs.readdirSync(TEMP_DIR)) {
  if (item.endsWith('.html') || item.endsWith('.pdf') || item.endsWith('.json')) {
    const src = path.join(TEMP_DIR, item);
    const dest = path.join(DOCS_DESIGN_DIR, item);
    fs.copyFileSync(src, dest);
    console.log(`   + docs/design/${item}`);
  }
}

// Também mover PDFs soltos na raiz (ex: relatórios de fidelidade)
for (const f of files.filter(f => f.toLowerCase().endsWith('.pdf'))) {
  const src = path.join(ROOT_DIR, f);
  const dest = path.join(DOCS_DESIGN_DIR, f);
  fs.renameSync(src, dest);
  console.log(`📄 Movido relatório para docs/design/${f}`);
}

// 7. Remover o .zip para não inflar o Git
console.log(`🗑️ Removendo arquivo .zip bruto: ${targetZip}`);
fs.rmSync(path.join(ROOT_DIR, targetZip), { force: true });
fs.rmSync(TEMP_DIR, { recursive: true, force: true });

console.log('✅ Assets, mídias e protótipos organizados com sucesso!');
