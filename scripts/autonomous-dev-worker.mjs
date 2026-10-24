import { execSync } from 'child_process';

const isWatch = process.argv.includes('--watch');

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

console.log('🎸 [Munaya Rocks] Autonomous Dev Worker — WIP Limit = 1');
console.log('======================================================');

async function main() {
  while (true) {
    // 1. Checagem de Trava de WIP = 1 (Work In Progress)
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
      console.log(`[${new Date().toLocaleTimeString()}] 🛑 [TRAVA WIP = 1] Aguardando merge/homologação de ${activeFeaturePrs.length} PR(s) aberto(s).`);
      if (!isWatch) process.exit(0);
      await sleep(20000);
      continue;
    }

    // 2. Buscar próxima issue com status:ready4dev
    const issuesJson = runCapture('gh issue list --label "status:ready4dev" --json number,title,body,comments --limit 1');
    let readyIssues = [];
    try {
      readyIssues = JSON.parse(issuesJson || '[]');
    } catch {}

    if (readyIssues.length === 0) {
      console.log(`[${new Date().toLocaleTimeString()}] 💤 Monitorando... Nenhuma issue com 'status:ready4dev'.`);
      if (!isWatch) process.exit(0);
      await sleep(15000);
      continue;
    }

    const issue = readyIssues[0];
    console.log(`\n🎯 [NOVA TAREFA DETECTADA] Issue #${issue.number} — ${issue.title}`);

    // 3. Gerar nome da branch padronizada
    const cleanTitle = issue.title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 35);

    const branchName = `feature/issue-${issue.number}-${cleanTitle}`;
    console.log(`🌿 Criando branch: ${branchName}`);

    // 4. Atualizar labels no GitHub (Ready4Dev -> In Progress)
    run(`gh issue edit ${issue.number} --remove-label "status:ready4dev" --add-label "status:in-progress"`);
    run(`gh issue comment ${issue.number} --body "🤖 *[Munaya Dev Bot]* Assumindo o desenvolvimento autônomo da issue na branch \`${branchName}\`. WIP Limit respeitado."`);

    // 5. Criar branch local a partir da master atualizada
    run('git checkout master');
    run('git pull origin master');
    run(`git checkout -b ${branchName}`);

    console.log('======================================================');
    console.log(`🚀 SUCESSO: Issue #${issue.number} puxada com sucesso para desenvolvimento!`);
    console.log(`Branch ativa: ${branchName}`);
    console.log('======================================================');
    process.exit(0);
  }
}

main();
