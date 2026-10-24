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

try {
  // 3. Descompactar (unzip no Linux/Ubuntu do GitHub Actions, tar no Windows)
  console.log('📂 Descompactando conteúdo do design...');
  if (process.platform === 'win32') {
    run(`tar -xf "${targetZip}" -C "${TEMP_DIR}"`);
  } else {
    run(`unzip -q -o "${targetZip}" -d "${TEMP_DIR}"`);
  }

  // 4. Copiar assets para public/ (com suporte recursivo a diretórios)
  const tempPublicDir = path.join(TEMP_DIR, 'public');
  if (fs.existsSync(tempPublicDir)) {
    console.log('🖼️ Copiando assets de public/...');
    for (const item of fs.readdirSync(tempPublicDir)) {
      const src = path.join(tempPublicDir, item);
      const dest = path.join(PUBLIC_DIR, item);
      if (fs.statSync(src).isDirectory()) {
        fs.cpSync(src, dest, { recursive: true });
      } else {
        fs.copyFileSync(src, dest);
      }
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

  // 6. Copiar protótipos e relatórios para docs/design/ (incluindo .md)
  for (const item of fs.readdirSync(TEMP_DIR)) {
    const ext = path.extname(item).toLowerCase();
    if (['.html', '.pdf', '.json', '.md'].includes(ext)) {
      const src = path.join(TEMP_DIR, item);
      const dest = path.join(DOCS_DESIGN_DIR, item);
      if (!fs.statSync(src).isDirectory()) {
        fs.copyFileSync(src, dest);
        console.log(`   + docs/design/${item}`);
      }
    }
  }

  // Mover relatórios soltos em PDF na raiz
  for (const f of files.filter(f => f.toLowerCase().endsWith('.pdf'))) {
    const src = path.join(ROOT_DIR, f);
    const dest = path.join(DOCS_DESIGN_DIR, f);
    fs.renameSync(src, dest);
    console.log(`📄 Movido relatório para docs/design/${f}`);
  }

  // 7. Remover o .zip apenas após o sucesso
  console.log(`🗑️ Removendo arquivo .zip bruto: ${targetZip}`);
  fs.rmSync(path.join(ROOT_DIR, targetZip), { force: true });
  fs.rmSync(TEMP_DIR, { recursive: true, force: true });

  console.log('✅ Assets, mídias e protótipos organizados com sucesso!');
} catch (error) {
  console.error('❌ Erro durante o processamento do design:', error);
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
  process.exit(1);
}
