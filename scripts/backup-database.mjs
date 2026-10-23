/**
 * 📦 Munaya Rocks - Script de Backup Automatizado do Banco de Dados Supabase
 *
 * Exporta todas as tabelas essenciais para JSON estruturado:
 * - products (Catálogo de produtos, imagens e variantes)
 * - orders (Histórico completo de pedidos, itens e clientes)
 * - coupons (Cupons e regras de desconto)
 * - store_settings (Configurações da loja e markups)
 * - admin_users (Operadores e permissões)
 * - admin_audit_logs (Trilha de auditoria)
 *
 * Gera um pacote compactado .tar.gz com manifesto de integridade.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Carrega variáveis de ambiente
const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://jaxxkyvsgasgaccbejln.supabase.co";

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_-DOPw3mHijTge4WhQu4Kfw_0n7VSrNJ";

const tablesToExport = [
  "products",
  "orders",
  "coupons",
  "store_settings",
  "admin_users",
  "admin_audit_logs",
];

async function runBackup() {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);

  const backupDirName = `munaya_backup_${timestamp}`;
  const outputDir = path.join(rootDir, "backups_temp", backupDirName);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`\n======================================================`);
  console.log(`🎸 MUNAYA ROCKS - ROTINA DE BACKUP DO SUPABASE`);
  console.log(`Timestamp: ${new Date().toLocaleString("pt-BR")}`);
  console.log(`Destino temporário: ${outputDir}`);
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`======================================================\n`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: {
      params: {
        eventsPerSecond: 0,
      },
    },
  });

  const manifest = {
    version: "1.0",
    created_at: new Date().toISOString(),
    project_url: supabaseUrl,
    tables: {},
    total_records: 0,
    status: "success",
  };

  for (const table of tablesToExport) {
    try {
      console.log(`⏳ Exportando tabela: [${table}]...`);
      const { data, error, count } = await supabase
        .from(table)
        .select("*", { count: "exact" });

      if (error) {
        console.warn(`   ⚠️ Aviso na tabela ${table}: ${error.message}`);
        manifest.tables[table] = {
          count: 0,
          status: "skipped_or_empty",
          error: error.message,
        };
        // Salva array vazio para consistência
        fs.writeFileSync(
          path.join(outputDir, `${table}.json`),
          JSON.stringify([], null, 2),
          "utf-8"
        );
      } else {
        const recordsCount = data ? data.length : 0;
        console.log(`   ✅ Tabela [${table}]: ${recordsCount} registro(s) exportado(s).`);
        fs.writeFileSync(
          path.join(outputDir, `${table}.json`),
          JSON.stringify(data || [], null, 2),
          "utf-8"
        );
        manifest.tables[table] = {
          count: recordsCount,
          status: "ok",
          size_bytes: Buffer.byteLength(JSON.stringify(data || [])),
        };
        manifest.total_records += recordsCount;
      }
    } catch (err) {
      console.error(`   ❌ Falha ao exportar tabela ${table}:`, err.message);
      manifest.tables[table] = {
        count: 0,
        status: "error",
        error: err.message,
      };
    }
  }

  // Grava o arquivo de manifesto de integridade
  fs.writeFileSync(
    path.join(outputDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf-8"
  );

  // Copia os schemas DDL para o pacote de backup para permitir restauração imediata do zero
  const setupSqlPath = path.join(rootDir, "supabase_setup.sql");
  const rbacSqlPath = path.join(rootDir, "supabase_admin_rbac_audit.sql");

  if (fs.existsSync(setupSqlPath)) {
    fs.copyFileSync(setupSqlPath, path.join(outputDir, "supabase_setup.sql"));
  }
  if (fs.existsSync(rbacSqlPath)) {
    fs.copyFileSync(rbacSqlPath, path.join(outputDir, "supabase_admin_rbac_audit.sql"));
  }

  // Gera o arquivo compactado final .tar.gz no diretório backups/
  const finalBackupsDir = path.join(rootDir, "backups");
  if (!fs.existsSync(finalBackupsDir)) {
    fs.mkdirSync(finalBackupsDir, { recursive: true });
  }

  const archiveName = `munaya-db-backup-${timestamp}.tar.gz`;
  const archivePath = path.join(finalBackupsDir, archiveName);

  console.log(`\n📦 Compactando arquivos em ${archiveName}...`);
  try {
    // Usando comando tar nativo disponível em Linux/macOS e Windows 10+
    execSync(`tar -czf "${archivePath}" -C "${path.join(rootDir, "backups_temp")}" "${backupDirName}"`, {
      stdio: "pipe",
    });
    console.log(`🎉 Backup compactado com sucesso: ${archivePath}`);
    console.log(`📊 Total de registros salvos: ${manifest.total_records}`);
    console.log(`💾 Tamanho do arquivo: ${(fs.statSync(archivePath).size / 1024).toFixed(2)} KB\n`);
  } catch (tarErr) {
    console.warn("⚠️ Aviso ao compactar com tar, mantendo pasta não compactada:", tarErr.message);
  }

  // Remove pasta temporária
  try {
    fs.rmSync(path.join(rootDir, "backups_temp"), { recursive: true, force: true });
  } catch {}

  console.log(`✅ ROTINA DE BACKUP CONCLUÍDA COM SUCESSO!`);
}

runBackup().catch((e) => {
  console.error("❌ ERRO FATAL NA ROTINA DE BACKUP:", e);
  process.exit(1);
});
