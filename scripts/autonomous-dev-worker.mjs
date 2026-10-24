import { execSync } from 'child_process';

function runCapture(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf-8' }).trim();
  } catch (err) {
    return '';
  }
}

function run(cmd) {
  console.log(`> ${cmd}`);
  return execSync(cmd, { stdio: 'inherit' });
}

console.log('🎸 [Munaya Rocks] Autonomous Dev Worker — WIP Limit = 1');
console.log('======================================================');

// 1. Checagem de Trava de WIP = 1 (Work In Progress)
console.log('🔍 Verificando se há PRs abertos em andamento...');
const openPrsJson = runCapture('gh pr list --state open --json number,title,headRefName');
let openPrs = [];
try {
  openPrs = JSON.parse(openPrsJson || '[]');
} catch {}

const activeFeaturePrs = openPrs.filter(pr => 
  pr.headRefName.startsWith('feature/') || 
  pr.headRefName.startsWith('fix/')
);

if (activeFeaturePrs.length > 0) {
  console.log(`🛑 [TRAVA WIP = 1 ATIVA] Já existe um PR de feature em andamento:`);
  activeFeaturePrs.forEach(pr => console.log(`   - PR #${pr.number}: ${pr.title} (${pr.headRefName})`));
  console.log('⏳ Aguardando aprovação/merge do Fundador antes de iniciar nova tarefa.');
  process.exit(0);
}

console.log('✅ Esteira livre (WIP = 0). Buscando issues com status:ready4dev...');

// 2. Buscar próxima issue com status:ready4dev
const issuesJson = runCapture('gh issue list --label "status:ready4dev" --json number,title,body,comments --limit 1');
let readyIssues = [];
try {
  readyIssues = JSON.parse(issuesJson || '[]');
} catch {}

if (readyIssues.length === 0) {
  console.log('💤 Nenhuma issue com label "status:ready4dev" encontrada na fila.');
  console.log('💡 Dica: No GitHub, adicione a label "status:ready4dev" na issue que deseja desenvolver.');
  process.exit(0);
}

const issue = readyIssues[0];
console.log(`🎯 Issue selecionada para desenvolvimento: #${issue.number} — ${issue.title}`);

// 3. Gerar nome da branch padronizada
const cleanTitle = issue.title
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '')
  .slice(0, 35);

const branchName = `feature/issue-${issue.number}-${cleanTitle}`;
console.log(`🌿 Branch de trabalho: ${branchName}`);

// 4. Atualizar labels no GitHub (Ready4Dev -> In Progress)
console.log('🏷️ Atualizando status no GitHub para "status:in-progress"...');
run(`gh issue edit ${issue.number} --remove-label "status:ready4dev" --add-label "status:in-progress"`);
run(`gh issue comment ${issue.number} --body "🤖 *[Munaya Dev Bot]* Assumindo o desenvolvimento autônomo da issue na branch \`${branchName}\`. WIP Limit respeitado."`);

// 5. Criar branch local a partir da master atualizada
run('git checkout master');
run('git pull origin master');
run(`git checkout -b ${branchName}`);

console.log('======================================================');
console.log(`🚀 Pronto para codificar a Issue #${issue.number}!`);
console.log(`📋 Título: ${issue.title}`);
console.log('======================================================');
