"""
Script para geração do Diagrama de Arquitetura C4 em PDF da Plataforma Munaya.
Atualizado com Arquitetura de Segurança e Defesa em Profundidade (Fases 0, 1 e 2):
- Rate Limiting por IP (checkout & shipping)
- Validação Criptográfica HMAC-SHA256 em Webhooks (Anti-Spoofing)
- Recálculo de Totais no Backend (Anti-Price Tampering)
- Proteção contra Timing Attacks (crypto.timingSafeEqual)
- Sanitização Estrita de Entradas & Input Validation
- HTTP Security Headers & HSTS (Strict-Transport-Security)
- Trava de Despacho Fabril (Garantia de Liquidação Financeira Prévia)
- Segregação de Chaves Supabase (Anon Key vs Service Role Key)
"""

import os
import re
from playwright.sync_api import sync_playwright

HTML_CONTENT = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Munaya Rocks - Diagrama de Arquitetura C4 com Segurança</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap');

    @page {
      size: A4 landscape;
      margin: 8mm 10mm 8mm 10mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #0f172a;
      background-color: #ffffff;
      -webkit-font-smoothing: antialiased;
    }

    .page {
      page-break-after: always;
      height: 194mm;
      max-height: 194mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      padding: 2mm 0;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    /* Header styling */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }

    .brand-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .badge-c4 {
      background: #0f172a;
      color: #38bdf8;
      font-weight: 800;
      font-size: 11px;
      padding: 5px 12px;
      border-radius: 6px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .badge-sec {
      background: #065f46;
      color: #a7f3d0;
      font-weight: 800;
      font-size: 10px;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .title-group h1 {
      font-size: 17px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
    }

    .title-group p {
      font-size: 11px;
      color: #64748b;
      margin-top: 1px;
    }

    .doc-meta {
      text-align: right;
      font-size: 10px;
      color: #64748b;
      line-height: 1.4;
    }

    .doc-meta strong {
      color: #0f172a;
    }

    /* Footer styling */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
      font-size: 9px;
      color: #94a3b8;
      font-weight: 500;
    }

    /* Diagram Canvas */
    .diagram-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .legend-bar {
      display: flex;
      gap: 12px;
      align-items: center;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 5px 12px;
      margin-bottom: 6px;
      font-size: 10px;
      font-weight: 500;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .legend-color {
      width: 13px;
      height: 13px;
      border-radius: 3px;
    }

    .svg-canvas {
      width: 100%;
      height: 100%;
      flex: 1;
    }

    /* Table styles for specs */
    .spec-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
      margin-top: 4px;
    }

    .spec-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 7px 10px;
      text-align: left;
      font-weight: 700;
      font-size: 9.5px;
    }

    .spec-table td {
      padding: 7px 10px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: top;
      line-height: 1.35;
    }

    .spec-table tr:nth-child(even) {
      background: #f8fafc;
    }

    .badge-ext {
      display: inline-block;
      background: #e2e8f0;
      color: #334155;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 8.5px;
      margin-top: 2px;
    }

    .badge-in {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 8.5px;
      margin-top: 2px;
    }

    .badge-shield {
      display: inline-block;
      background: #dcfce7;
      color: #15803d;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 8.5px;
      margin-top: 2px;
      border: 1px solid #86efac;
    }

    .code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5px;
      background: #f1f5f9;
      padding: 1px 4px;
      border-radius: 3px;
      color: #0f172a;
    }

    .sec-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-top: 8px;
    }

    .sec-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 10px;
      border-top: 3px solid #059669;
    }

    .sec-card h4 {
      font-size: 10px;
      font-weight: 800;
      color: #065f46;
      margin-bottom: 3px;
    }

    .sec-card p {
      font-size: 8.5px;
      color: #475569;
      line-height: 1.35;
    }

    .notes-box {
      background: #f0fdf4;
      border-left: 4px solid #16a34a;
      padding: 7px 12px;
      border-radius: 0 6px 6px 0;
      font-size: 9.5px;
      color: #166534;
      margin-top: 8px;
      line-height: 1.35;
    }
  </style>
</head>
<body>

  <!-- ========================================================================= -->
  <!-- PÁGINA 1: C4 NÍVEL 1 — CONTEXTO & PERÍMETRO DE SEGURANÇA                   -->
  <!-- ========================================================================= -->
  <div class="page">
    <div class="header">
      <div class="brand-title">
        <span class="badge-c4">C4 Nível 1</span>
        <span class="badge-sec">🛡️ Security Hardened</span>
        <div class="title-group">
          <h1>Munaya E-Commerce — Contexto de Sistema & Perímetro de Segurança</h1>
          <p>Visão geral da plataforma, atores, conexões externas e fronteiras de confiança criptográficas</p>
        </div>
      </div>
      <div class="doc-meta">
        <div><strong>Projeto:</strong> Munaya Rocks E-Commerce</div>
        <div><strong>Status:</strong> Produção Hardened | Outubro 2026</div>
      </div>
    </div>

    <div class="diagram-container">
      <div class="legend-bar">
        <div class="legend-item"><span class="legend-color" style="background:#0284c7;"></span> <strong>Pessoa / Usuário</strong> (Cliente, Lojista)</div>
        <div class="legend-item"><span class="legend-color" style="background:#0f172a; border: 1.5px solid #10b981;"></span> <strong>Sistema Seguro</strong> (Plataforma Munaya)</div>
        <div class="legend-item"><span class="legend-color" style="background:#475569;"></span> <strong>Sistemas Externos</strong> (Gateways, Fábrica POD, BaaS)</div>
        <div class="legend-item"><span class="legend-color" style="background:#059669;"></span> <strong>Canal Criptografado</strong> (TLS 1.3 / HMAC)</div>
        <div class="legend-item"><span class="legend-color" style="background:#dc2626;"></span> <strong>Barreira de Proteção</strong> (Anti-Tampering)</div>
      </div>

      <svg class="svg-canvas" viewBox="0 0 1020 440" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="userGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#0369a1"/>
          </linearGradient>
          <linearGradient id="systemGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#1e293b"/>
          </linearGradient>
          <linearGradient id="extGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#475569"/>
            <stop offset="100%" stop-color="#334155"/>
          </linearGradient>
          <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.12"/>
          </filter>
          <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
          </marker>
          <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284c7" />
          </marker>
          <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#16a34a" />
          </marker>
        </defs>

        <!-- ATORES (Esquerda) -->
        <!-- Cliente Final -->
        <g filter="url(#shadow)">
          <rect x="25" y="65" width="165" height="120" rx="8" fill="url(#userGrad)"/>
          <circle cx="107" cy="97" r="14" fill="#ffffff"/>
          <path d="M 91 125 C 91 113 123 113 123 125 Z" fill="#ffffff"/>
          <text x="107" y="145" font-family="Inter" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">Cliente Final</text>
          <text x="107" y="159" font-family="Inter" font-size="9" fill="#e0f2fe" text-anchor="middle">[Pessoa / Consumidor]</text>
          <text x="107" y="172" font-family="Inter" font-size="8" fill="#bae6fd" text-anchor="middle">Navega e compra sob HSTS e TLS 1.3</text>
        </g>

        <!-- Administrador Munaya -->
        <g filter="url(#shadow)">
          <rect x="25" y="245" width="165" height="120" rx="8" fill="url(#userGrad)"/>
          <circle cx="107" cy="277" r="14" fill="#ffffff"/>
          <path d="M 91 305 C 91 293 123 293 123 305 Z" fill="#ffffff"/>
          <text x="107" y="325" font-family="Inter" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">Administrador</text>
          <text x="107" y="339" font-family="Inter" font-size="9" fill="#e0f2fe" text-anchor="middle">[Pessoa / Equipe Munaya]</text>
          <text x="107" y="352" font-family="Inter" font-size="8" fill="#bae6fd" text-anchor="middle">Acesso protegido com timingSafeEqual</text>
        </g>

        <!-- SISTEMA CENTRAL: Plataforma Munaya Hardened -->
        <g filter="url(#shadow)">
          <rect x="330" y="45" width="310" height="345" rx="12" fill="url(#systemGrad)" stroke="#10b981" stroke-width="2"/>
          
          <!-- Badges do Sistema -->
          <rect x="345" y="58" width="100" height="18" rx="4" fill="#0284c7"/>
          <text x="395" y="70" font-family="Inter" font-size="8" font-weight="800" fill="#ffffff" text-anchor="middle">SOFTWARE SYSTEM</text>
          <rect x="452" y="58" width="105" height="18" rx="4" fill="#065f46"/>
          <text x="504" y="70" font-family="Inter" font-size="8" font-weight="800" fill="#a7f3d0" text-anchor="middle">🛡️ DEFENSE-IN-DEPTH</text>
          
          <text x="485" y="102" font-family="Inter" font-size="17" font-weight="800" fill="#ffffff" text-anchor="middle">Plataforma Munaya</text>
          <text x="485" y="118" font-family="Inter" font-size="10.5" font-weight="600" fill="#38bdf8" text-anchor="middle">[Next.js 16 + React 19 Headless E-Commerce]</text>
          
          <rect x="348" y="132" width="274" height="242" rx="8" fill="#1e293b" stroke="#334155" stroke-dasharray="3 3"/>
          <text x="485" y="150" font-family="Inter" font-size="9.5" font-weight="700" fill="#f8fafc" text-anchor="middle">Controles de Segurança Implementados:</text>
          
          <text x="360" y="172" font-family="Inter" font-size="8.5" fill="#a7f3d0">🛡️ Rate Limiting Perimetral por IP (10-30 req/min)</text>
          <text x="360" y="190" font-family="Inter" font-size="8.5" fill="#a7f3d0">🛡️ Validação Criptográfica HMAC-SHA256 (Webhooks)</text>
          <text x="360" y="208" font-family="Inter" font-size="8.5" fill="#a7f3d0">🛡️ Recálculo de Totais no Servidor (Anti-Tampering)</text>
          <text x="360" y="226" font-family="Inter" font-size="8.5" fill="#a7f3d0">🛡️ Trava de Produção: Bloqueio de Despacho Não Pago</text>
          <text x="360" y="244" font-family="Inter" font-size="8.5" fill="#a7f3d0">🛡️ Constant-Time Auth (/admin crypto.timingSafeEqual)</text>
          <text x="360" y="262" font-family="Inter" font-size="8.5" fill="#a7f3d0">🛡️ Sanitização Estrita de Entradas & Anti-XSS</text>
          <text x="360" y="280" font-family="Inter" font-size="8.5" fill="#a7f3d0">🛡️ HSTS Preload & Headers HTTP (DENY, nosniff)</text>
          <text x="360" y="298" font-family="Inter" font-size="8.5" fill="#a7f3d0">🛡️ Segregação de Chaves: Anon vs Service Role Key</text>
          
          <text x="360" y="322" font-family="Inter" font-size="8.5" fill="#94a3b8">• Vitrine Interativa, Carrinho Gaveta & Pix Nativo</text>
          <text x="360" y="338" font-family="Inter" font-size="8.5" fill="#94a3b8">• Cotação de Frete Real integrada à fábrica Dimona</text>
          <text x="360" y="358" font-family="Inter" font-size="8" font-weight="600" fill="#38bdf8">Vercel Edge Global Network • TLS 1.3 End-to-End</text>
        </g>

        <!-- SISTEMAS EXTERNOS (Direita) -->
        <!-- 1. Camisa Dimona -->
        <g filter="url(#shadow)">
          <rect x="760" y="30" width="235" height="85" rx="8" fill="url(#extGrad)" stroke="#16a34a" stroke-width="1.5"/>
          <text x="877" y="53" font-family="Inter" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">Camisa Dimona (API v2)</text>
          <text x="877" y="67" font-family="Inter" font-size="8.5" fill="#86efac" text-anchor="middle">[Fulfillment POD com Trava Financeira]</text>
          <text x="877" y="83" font-family="Inter" font-size="8" fill="#cbd5e1" text-anchor="middle">Acionada exclusivamente após validação</text>
          <text x="877" y="95" font-family="Inter" font-size="8" fill="#cbd5e1" text-anchor="middle">de pagamento 100% liquidado; chave isolada</text>
        </g>

        <!-- 2. Mercado Pago -->
        <g filter="url(#shadow)">
          <rect x="760" y="125" width="235" height="85" rx="8" fill="url(#extGrad)" stroke="#0ea5e9" stroke-width="1.5"/>
          <text x="877" y="148" font-family="Inter" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">Mercado Pago</text>
          <text x="877" y="162" font-family="Inter" font-size="8.5" fill="#38bdf8" text-anchor="middle">[Gateway Pix + Assinatura HMAC]</text>
          <text x="877" y="178" font-family="Inter" font-size="8" fill="#cbd5e1" text-anchor="middle">Geração Pix via Orders API e Webhooks IPN</text>
          <text x="877" y="190" font-family="Inter" font-size="8" fill="#cbd5e1" text-anchor="middle">autenticados com chave secreta criptográfica</text>
        </g>

        <!-- 3. Supabase Cloud -->
        <g filter="url(#shadow)">
          <rect x="760" y="220" width="235" height="85" rx="8" fill="url(#extGrad)" stroke="#14b8a6" stroke-width="1.5"/>
          <text x="877" y="243" font-family="Inter" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">Supabase Cloud (BaaS)</text>
          <text x="877" y="257" font-family="Inter" font-size="8.5" fill="#5eead4" text-anchor="middle">[Postgres + Row Level Security (RLS)]</text>
          <text x="877" y="273" font-family="Inter" font-size="8" fill="#cbd5e1" text-anchor="middle">Tabelas protegidas por políticas RLS;</text>
          <text x="877" y="285" font-family="Inter" font-size="8" fill="#cbd5e1" text-anchor="middle">escrita restrita a Server Role Key privada</text>
        </g>

        <!-- 4. ViaCEP API -->
        <g filter="url(#shadow)">
          <rect x="760" y="315" width="235" height="75" rx="8" fill="url(#extGrad)"/>
          <text x="877" y="338" font-family="Inter" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">ViaCEP API</text>
          <text x="877" y="352" font-family="Inter" font-size="8.5" fill="#fde047" text-anchor="middle">[Serviço Geográfico com Sanitização]</text>
          <text x="877" y="368" font-family="Inter" font-size="8" fill="#cbd5e1" text-anchor="middle">CEP limpo e higienizado antes do envio;</text>
          <text x="877" y="379" font-family="Inter" font-size="8" fill="#cbd5e1" text-anchor="middle">tratamento de falhas e timeout seguro</text>
        </g>

        <!-- CONECTORES & RELACIONAMENTOS -->
        <!-- Cliente -> Munaya -->
        <path d="M 190 105 L 322 105" stroke="#0284c7" stroke-width="1.8" fill="none" marker-end="url(#arrow-blue)"/>
        <rect x="200" y="88" width="115" height="20" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="257" y="101" font-family="Inter" font-size="7.5" fill="#0369a1" text-anchor="middle" font-weight="700">HTTPS / HSTS / TLS</text>

        <!-- Admin -> Munaya -->
        <path d="M 190 285 L 322 285" stroke="#0284c7" stroke-width="1.8" fill="none" marker-end="url(#arrow-blue)"/>
        <rect x="200" y="268" width="115" height="20" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="257" y="281" font-family="Inter" font-size="7" fill="#0369a1" text-anchor="middle" font-weight="700">Auth timingSafeEqual</text>

        <!-- Munaya -> Dimona (Produção protegida) -->
        <path d="M 640 95 L 752 70" stroke="#16a34a" stroke-width="2" fill="none" marker-end="url(#arrow-green)"/>
        <rect x="646" y="64" width="105" height="19" rx="4" fill="#ffffff" stroke="#16a34a"/>
        <text x="698" y="76" font-family="Inter" font-size="7.5" fill="#15803d" text-anchor="middle" font-weight="800">Trava Pré-Despacho</text>

        <!-- Munaya <-> Mercado Pago (HMAC) -->
        <path d="M 640 165 L 752 165" stroke="#0ea5e9" stroke-width="1.8" fill="none" marker-end="url(#arrow)"/>
        <rect x="646" y="152" width="105" height="19" rx="4" fill="#ffffff" stroke="#0ea5e9"/>
        <text x="698" y="164" font-family="Inter" font-size="7.5" fill="#0284c7" text-anchor="middle" font-weight="800">HMAC-SHA256 Auth</text>

        <!-- Munaya -> Supabase (Role Key) -->
        <path d="M 640 240 L 752 250" stroke="#14b8a6" stroke-width="1.8" fill="none" marker-end="url(#arrow)"/>
        <rect x="646" y="232" width="105" height="19" rx="4" fill="#ffffff" stroke="#14b8a6"/>
        <text x="698" y="244" font-family="Inter" font-size="7.5" fill="#0f766e" text-anchor="middle" font-weight="800">Service Role / TLS</text>

        <!-- Munaya -> ViaCEP -->
        <path d="M 640 330 L 752 345" stroke="#475569" stroke-width="1.6" stroke-dasharray="3 3" fill="none" marker-end="url(#arrow)"/>
        <rect x="646" y="327" width="105" height="19" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="698" y="339" font-family="Inter" font-size="7.5" fill="#334155" text-anchor="middle" font-weight="600">Input Sanitizado</text>
      </svg>
    </div>

    <div class="footer">
      <div>Munaya Rocks E-Commerce Architecture • Modelagem C4 Hardened com Defesa em Profundidade</div>
      <div>Página 1 de 4</div>
    </div>
  </div>


  <!-- ========================================================================= -->
  <!-- PÁGINA 2: C4 NÍVEL 2 — CONTÊINERES & TRUST BOUNDARIES                     -->
  <!-- ========================================================================= -->
  <div class="page">
    <div class="header">
      <div class="brand-title">
        <span class="badge-c4">C4 Nível 2</span>
        <span class="badge-sec">🛡️ Trust Boundaries</span>
        <div class="title-group">
          <h1>Munaya E-Commerce — Contêineres & Zonas de Confiança</h1>
          <p>Mapeamento de contêineres, cabeçalhos de segurança, middlewares e isolamento de segredos</p>
        </div>
      </div>
      <div class="doc-meta">
        <div><strong>Perímetro:</strong> Vercel Edge + Supabase Cloud</div>
        <div><strong>HSTS:</strong> max-age=63072000; preload</div>
      </div>
    </div>

    <div class="diagram-container">
      <div class="legend-bar">
        <div class="legend-item"><span class="legend-color" style="background:#0284c7;"></span> <strong>Frontend / SPA</strong> (React 19 / Next.js)</div>
        <div class="legend-item"><span class="legend-color" style="background:#0f172a; border: 1.5px solid #10b981;"></span> <strong>Backend Hardened</strong> (Rate Limit & Auth)</div>
        <div class="legend-item"><span class="legend-color" style="background:#0f766e;"></span> <strong>Banco de Dados (RLS)</strong> (Postgres + CDN)</div>
        <div class="legend-item"><span class="legend-color" style="background:#475569;"></span> <strong>Serviços Externos Validados</strong></div>
      </div>

      <svg class="svg-canvas" viewBox="0 0 1020 440" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="spaGrad2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0284c7"/>
            <stop offset="100%" stop-color="#0369a1"/>
          </linearGradient>
          <linearGradient id="apiGrad2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#1e3a8a"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
          <linearGradient id="dbGrad2" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0f766e"/>
            <stop offset="100%" stop-color="#115e59"/>
          </linearGradient>
        </defs>

        <!-- TRUST BOUNDARY PRINCIPAL -->
        <rect x="175" y="18" width="570" height="400" rx="12" fill="#f8fafc" stroke="#10b981" stroke-width="2" stroke-dasharray="5 5"/>
        <rect x="190" y="26" width="370" height="18" rx="4" fill="#dcfce7"/>
        <text x="375" y="38" font-family="Inter" font-size="9" font-weight="800" fill="#15803d">🛡️ TRUST BOUNDARY: PERÍMETRO PROTEGIDO MUNAYA [Vercel Edge Network]</text>

        <!-- USUÁRIO -->
        <g filter="url(#shadow)">
          <rect x="15" y="100" width="140" height="95" rx="8" fill="url(#userGrad)"/>
          <text x="85" y="132" font-family="Inter" font-size="11.5" font-weight="700" fill="#ffffff" text-anchor="middle">Consumidor</text>
          <text x="85" y="147" font-family="Inter" font-size="8.5" fill="#e0f2fe" text-anchor="middle">Web & Mobile</text>
          <text x="85" y="162" font-family="Inter" font-size="7.5" fill="#bae6fd" text-anchor="middle">Forçado HTTPS via HSTS</text>
        </g>

        <!-- CONTÊINER 1: FRONTEND WEB APP -->
        <g filter="url(#shadow)">
          <rect x="195" y="55" width="240" height="195" rx="8" fill="url(#spaGrad2)"/>
          <text x="315" y="80" font-family="Inter" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">Web Application (Frontend)</text>
          <text x="315" y="94" font-family="Inter" font-size="8" fill="#bae6fd" text-anchor="middle">[Next.js 16, React 19, Tailwind CSS v4]</text>
          
          <rect x="207" y="104" width="216" height="135" rx="5" fill="#0c4a6e" fill-opacity="0.6"/>
          <text x="217" y="122" font-family="Inter" font-size="8" font-weight="700" fill="#a7f3d0">🛡️ Headers Injetados (next.config):</text>
          <text x="217" y="136" font-family="Inter" font-size="7.5" fill="#e0f2fe">• X-Frame-Options: DENY (Anti-Clickjacking)</text>
          <text x="217" y="150" font-family="Inter" font-size="7.5" fill="#e0f2fe">• X-Content-Type-Options: nosniff</text>
          <text x="217" y="164" font-family="Inter" font-size="7.5" fill="#e0f2fe">• Strict-Transport-Security (HSTS Preload)</text>
          <text x="217" y="178" font-family="Inter" font-size="7.5" fill="#e0f2fe">• Referrer-Policy: strict-origin</text>
          <text x="217" y="194" font-family="Inter" font-size="8" font-weight="700" fill="#a7f3d0">Experiência do Consumidor:</text>
          <text x="217" y="208" font-family="Inter" font-size="7.5" fill="#e0f2fe">• Vitrine, Mockups 3D & CartDrawer Seguro</text>
          <text x="217" y="222" font-family="Inter" font-size="7.5" fill="#e0f2fe">• Checkout Pix Nativo com Polling Protegido</text>
        </g>

        <!-- CONTÊINER 2: BACKEND SERVERLESS HARDENED -->
        <g filter="url(#shadow)">
          <rect x="475" y="55" width="255" height="350" rx="8" fill="url(#apiGrad2)" stroke="#10b981" stroke-width="2"/>
          <text x="602" y="78" font-family="Inter" font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">Backend Serverless API</text>
          <text x="602" y="92" font-family="Inter" font-size="8" fill="#a7f3d0" text-anchor="middle">[Hardened Route Handlers / Vercel Edge]</text>
          
          <rect x="487" y="104" width="231" height="288" rx="5" fill="#1e293b"/>
          
          <text x="497" y="122" font-family="Inter" font-size="8.5" font-weight="800" fill="#10b981">🛡️ Camada de Interceptores & Defesa:</text>
          <text x="497" y="138" font-family="Inter" font-size="7.5" fill="#e2e8f0">• rate-limit.ts (Limitação por IP)</text>
          <text x="497" y="152" font-family="Inter" font-size="7.5" fill="#e2e8f0">• sanitize.ts (Higienização contra XSS)</text>
          <text x="497" y="166" font-family="Inter" font-size="7.5" fill="#e2e8f0">• mp-webhook-auth.ts (HMAC-SHA256)</text>
          <text x="497" y="180" font-family="Inter" font-size="7.5" fill="#e2e8f0">• admin-auth.ts (crypto.timingSafeEqual)</text>
          
          <text x="497" y="202" font-family="Inter" font-size="8.5" font-weight="800" fill="#38bdf8">Controladores de Rota Protegidos:</text>
          <text x="497" y="218" font-family="Inter" font-size="7.5" fill="#e2e8f0">• /api/checkout (Recálculo total no servidor)</text>
          <text x="497" y="232" font-family="Inter" font-size="7.5" fill="#e2e8f0">• /api/shipping (Rate limited + sanitização)</text>
          <text x="497" y="246" font-family="Inter" font-size="7.5" fill="#e2e8f0">• /webhooks/mercadopago (Assinatura validada)</text>
          <text x="497" y="260" font-family="Inter" font-size="7.5" fill="#e2e8f0">• /api/orders (Acesso administrativo autenticado)</text>
          
          <text x="497" y="282" font-family="Inter" font-size="8.5" font-weight="800" fill="#38bdf8">Regras de Negócio Seguras:</text>
          <text x="497" y="298" font-family="Inter" font-size="7.5" fill="#cbd5e1">• Trava: Bloqueio estrito de pedidos não pagos</text>
          <text x="497" y="312" font-family="Inter" font-size="7.5" fill="#cbd5e1">• Segregação de segredos: 100% process.env</text>
          <text x="497" y="326" font-family="Inter" font-size="7.5" fill="#cbd5e1">• Mapeamento confiável de arte: artworks.ts</text>
          <text x="497" y="340" font-family="Inter" font-size="7.5" fill="#cbd5e1">• Modo Sandbox/Produção com isolamento</text>
          <text x="497" y="360" font-family="Inter" font-size="7.5" font-weight="700" fill="#a7f3d0">Execução Serverless Segura sem Estado</text>
        </g>

        <!-- CONTÊINER 3: SUPABASE (BD COM RLS) -->
        <g filter="url(#shadow)">
          <rect x="195" y="265" width="240" height="140" rx="8" fill="url(#dbGrad2)"/>
          <text x="315" y="288" font-family="Inter" font-size="11.5" font-weight="700" fill="#ffffff" text-anchor="middle">Supabase Cloud (BaaS)</text>
          <text x="315" y="302" font-family="Inter" font-size="8" fill="#99f6e4" text-anchor="middle">[PostgreSQL Gerenciado + Storage CDN]</text>
          
          <rect x="207" y="312" width="216" height="80" rx="4" fill="#042f2e" fill-opacity="0.6"/>
          <text x="217" y="328" font-family="Inter" font-size="8" font-weight="700" fill="#5eead4">🛡️ Isolamento de Chaves & RLS:</text>
          <text x="217" y="342" font-family="Inter" font-size="7.5" fill="#ccfbf1">• Anon Key: Apenas leitura pública de produtos</text>
          <text x="217" y="356" font-family="Inter" font-size="7.5" fill="#ccfbf1">• Service Role Key: Apenas backend para pedidos</text>
          <text x="217" y="370" font-family="Inter" font-size="7.5" fill="#ccfbf1">• Row Level Security habilitado nas tabelas</text>
          <text x="217" y="384" font-family="Inter" font-size="7.5" fill="#ccfbf1">• Conexão criptografada TLS via SDK seguro</text>
        </g>

        <!-- SERVIÇOS EXTERNOS (Direita) -->
        <g filter="url(#shadow)">
          <rect x="780" y="70" width="220" height="85" rx="6" fill="#475569" stroke="#16a34a" stroke-width="1.5"/>
          <text x="890" y="94" font-family="Inter" font-size="11.5" font-weight="700" fill="#ffffff" text-anchor="middle">Camisa Dimona (API v2)</text>
          <text x="890" y="108" font-family="Inter" font-size="8" fill="#86efac" text-anchor="middle">[Fulfillment POD Seguro]</text>
          <text x="890" y="124" font-family="Inter" font-size="7.5" fill="#cbd5e1" text-anchor="middle">Despacho acionado apenas via backend</text>
          <text x="890" y="137" font-family="Inter" font-size="7.5" fill="#cbd5e1" text-anchor="middle">após validação de pagamento liquidado</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="780" y="180" width="220" height="85" rx="6" fill="#475569" stroke="#0ea5e9" stroke-width="1.5"/>
          <text x="890" y="204" font-family="Inter" font-size="11.5" font-weight="700" fill="#ffffff" text-anchor="middle">Mercado Pago</text>
          <text x="890" y="218" font-family="Inter" font-size="8" fill="#38bdf8" text-anchor="middle">[Assinatura Criptográfica HMAC]</text>
          <text x="890" y="234" font-family="Inter" font-size="7.5" fill="#cbd5e1" text-anchor="middle">Webhook assinado com SHA-256;</text>
          <text x="890" y="247" font-family="Inter" font-size="7.5" fill="#cbd5e1" text-anchor="middle">rejeição instantânea de requisições forjadas</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="780" y="290" width="220" height="80" rx="6" fill="#475569"/>
          <text x="890" y="314" font-family="Inter" font-size="11.5" font-weight="700" fill="#ffffff" text-anchor="middle">ViaCEP API</text>
          <text x="890" y="328" font-family="Inter" font-size="8" fill="#fde047" text-anchor="middle">[Serviço Geográfico]</text>
          <text x="890" y="344" font-family="Inter" font-size="7.5" fill="#cbd5e1" text-anchor="middle">Sanitização de CEP (8 dígitos numéricos)</text>
          <text x="890" y="357" font-family="Inter" font-size="7.5" fill="#cbd5e1" text-anchor="middle">e proteção contra timeouts externos</text>
        </g>

        <!-- RELACIONAMENTOS -->
        <path d="M 155 145 L 192 145" stroke="#0284c7" stroke-width="1.8" fill="none" marker-end="url(#arrow-blue)"/>
        <path d="M 435 145 L 472 145" stroke="#0284c7" stroke-width="1.8" fill="none" marker-end="url(#arrow-blue)"/>
        <rect x="440" y="128" width="30" height="15" rx="3" fill="#ffffff" stroke="#0284c7"/>
        <text x="455" y="139" font-family="Inter" font-size="7" fill="#0284c7" text-anchor="middle" font-weight="700">JSON</text>

        <path d="M 475 340 L 438 340" stroke="#0f766e" stroke-width="1.8" fill="none" marker-end="url(#arrow)"/>
        <rect x="442" y="324" width="30" height="15" rx="3" fill="#ffffff" stroke="#0f766e"/>
        <text x="457" y="335" font-family="Inter" font-size="7" fill="#0f766e" text-anchor="middle" font-weight="700">SQL</text>

        <path d="M 730 112 L 772 112" stroke="#16a34a" stroke-width="1.8" fill="none" marker-end="url(#arrow-green)"/>
        <rect x="734" y="96" width="36" height="15" rx="3" fill="#ffffff" stroke="#16a34a"/>
        <text x="752" y="107" font-family="Inter" font-size="7" fill="#15803d" text-anchor="middle" font-weight="700">HTTPS</text>

        <path d="M 730 222 L 772 222" stroke="#0ea5e9" stroke-width="1.8" fill="none" marker-end="url(#arrow)"/>
        <rect x="734" y="208" width="36" height="15" rx="3" fill="#ffffff" stroke="#0ea5e9"/>
        <text x="752" y="219" font-family="Inter" font-size="7" fill="#0284c7" text-anchor="middle" font-weight="700">HMAC</text>

        <path d="M 730 330 L 772 330" stroke="#475569" stroke-width="1.6" stroke-dasharray="3 3" fill="none" marker-end="url(#arrow)"/>
        <rect x="736" y="318" width="32" height="15" rx="3" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="752" y="329" font-family="Inter" font-size="7" fill="#334155" text-anchor="middle" font-weight="700">GET</text>
      </svg>
    </div>

    <div class="footer">
      <div>Munaya Rocks E-Commerce Architecture • Modelagem C4 Hardened com Defesa em Profundidade</div>
      <div>Página 2 de 4</div>
    </div>
  </div>


  <!-- ========================================================================= -->
  <!-- PÁGINA 3: C4 NÍVEL 3 — COMPONENTES DE SEGURANÇA & ROUTE HANDLERS          -->
  <!-- ========================================================================= -->
  <div class="page">
    <div class="header">
      <div class="brand-title">
        <span class="badge-c4">C4 Nível 3</span>
        <span class="badge-sec">🛡️ Componentes de Segurança</span>
        <div class="title-group">
          <h1>Munaya E-Commerce — Componentes de Segurança e Route Handlers</h1>
          <p>Middlewares perimetrais, validação de tokens, filtros criptográficos e fluxo até a fábrica</p>
        </div>
      </div>
      <div class="doc-meta">
        <div><strong>Módulos:</strong> src/lib/rate-limit, sanitize, mp-webhook-auth, admin-auth</div>
        <div><strong>Padrão:</strong> Interceptor Guardrail Pipeline</div>
      </div>
    </div>

    <div class="diagram-container">
      <div class="legend-bar">
        <div class="legend-item"><span class="legend-color" style="background:#065f46; border: 1px solid #10b981;"></span> <strong>Guardiões de Segurança</strong> (Interceptores)</div>
        <div class="legend-item"><span class="legend-color" style="background:#0284c7;"></span> <strong>API Route Handlers</strong> (Controladores)</div>
        <div class="legend-item"><span class="legend-color" style="background:#1e293b; border: 1px solid #38bdf8;"></span> <strong>Services Internos</strong> (Negócio)</div>
        <div class="legend-item"><span class="legend-color" style="background:#475569;"></span> <strong>Sistemas Terceirizados</strong></div>
      </div>

      <svg class="svg-canvas" viewBox="0 0 1020 440" xmlns="http://www.w3.org/2000/svg">
        <!-- BOUNDARY: APP ROUTER -->
        <rect x="20" y="20" width="710" height="395" rx="10" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 4"/>
        <text x="35" y="38" font-family="Inter" font-size="10" font-weight="700" fill="#475569">PIPELINE INTERNO DA API: GUARDIÕES DE SEGURANÇA E CONTROLADORES [Next.js App Router]</text>

        <!-- COLUNA 1: GUARDIÕES DE SEGURANÇA (Interceptores de Entrada) -->
        <g filter="url(#shadow)">
          <rect x="35" y="55" width="165" height="75" rx="6" fill="#065f46" stroke="#10b981" stroke-width="1.5"/>
          <text x="117" y="76" font-family="Inter" font-size="10.5" font-weight="800" fill="#a7f3d0" text-anchor="middle">🛡️ Rate Limiter</text>
          <text x="117" y="90" font-family="JetBrains Mono" font-size="7.5" fill="#ffffff" text-anchor="middle">src/lib/rate-limit.ts</text>
          <text x="117" y="106" font-family="Inter" font-size="7.5" fill="#e0f2fe" text-anchor="middle">Bloqueio de abuso por IP</text>
          <text x="117" y="118" font-family="Inter" font-size="7.5" fill="#e0f2fe" text-anchor="middle">(10 req/min no checkout)</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="35" y="145" width="165" height="75" rx="6" fill="#065f46" stroke="#10b981" stroke-width="1.5"/>
          <text x="117" y="166" font-family="Inter" font-size="10.5" font-weight="800" fill="#a7f3d0" text-anchor="middle">🛡️ Input Sanitizer</text>
          <text x="117" y="180" font-family="JetBrains Mono" font-size="7.5" fill="#ffffff" text-anchor="middle">src/lib/sanitize.ts</text>
          <text x="117" y="196" font-family="Inter" font-size="7.5" fill="#e0f2fe" text-anchor="middle">Higienização de strings, CEP</text>
          <text x="117" y="208" font-family="Inter" font-size="7.5" fill="#e0f2fe" text-anchor="middle">e proteção contra XSS</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="35" y="235" width="165" height="80" rx="6" fill="#065f46" stroke="#10b981" stroke-width="1.5"/>
          <text x="117" y="256" font-family="Inter" font-size="10.5" font-weight="800" fill="#a7f3d0" text-anchor="middle">🛡️ HMAC Validator</text>
          <text x="117" y="270" font-family="JetBrains Mono" font-size="7.5" fill="#ffffff" text-anchor="middle">src/lib/mp-webhook-auth.ts</text>
          <text x="117" y="286" font-family="Inter" font-size="7.5" fill="#e0f2fe" text-anchor="middle">Validação SHA-256 de</text>
          <text x="117" y="298" font-family="Inter" font-size="7.5" fill="#e0f2fe" text-anchor="middle">x-signature do Mercado Pago</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="35" y="325" width="165" height="75" rx="6" fill="#065f46" stroke="#10b981" stroke-width="1.5"/>
          <text x="117" y="346" font-family="Inter" font-size="10.5" font-weight="800" fill="#a7f3d0" text-anchor="middle">🛡️ Admin Auth Guardian</text>
          <text x="117" y="360" font-family="JetBrains Mono" font-size="7.5" fill="#ffffff" text-anchor="middle">src/lib/admin-auth.ts</text>
          <text x="117" y="376" font-family="Inter" font-size="7.5" fill="#e0f2fe" text-anchor="middle">timingSafeEqual contra</text>
          <text x="117" y="388" font-family="Inter" font-size="7.5" fill="#e0f2fe" text-anchor="middle">ataques de temporização</text>
        </g>

        <!-- COLUNA 2: CONTROLADORES DE ROTA (/app/api) -->
        <g filter="url(#shadow)">
          <rect x="235" y="55" width="170" height="95" rx="6" fill="#0284c7"/>
          <text x="320" y="78" font-family="Inter" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">Checkout Controller</text>
          <text x="320" y="92" font-family="JetBrains Mono" font-size="7.5" fill="#e0f2fe" text-anchor="middle">POST /api/checkout</text>
          <rect x="245" y="100" width="150" height="42" rx="4" fill="#0369a1"/>
          <text x="320" y="114" font-family="Inter" font-size="7" font-weight="700" fill="#a7f3d0" text-anchor="middle">🛡️ Anti-Price Tampering:</text>
          <text x="320" y="126" font-family="Inter" font-size="7" fill="#ffffff" text-anchor="middle">Recalcula preços pelo SKU</text>
          <text x="320" y="136" font-family="Inter" font-size="7" fill="#ffffff" text-anchor="middle">sem confiar no frontend</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="235" y="165" width="170" height="85" rx="6" fill="#0284c7"/>
          <text x="320" y="188" font-family="Inter" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">Shipping Controller</text>
          <text x="320" y="202" font-family="JetBrains Mono" font-size="7.5" fill="#e0f2fe" text-anchor="middle">POST /api/shipping</text>
          <text x="320" y="218" font-family="Inter" font-size="7.5" fill="#bae6fd" text-anchor="middle">CEP sanitizado (8 dígitos)</text>
          <text x="320" y="232" font-family="Inter" font-size="7.5" fill="#bae6fd" text-anchor="middle">Cotação oficial Dimona + ViaCEP</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="235" y="265" width="170" height="110" rx="6" fill="#0284c7"/>
          <text x="320" y="288" font-family="Inter" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">MP Webhook Handler</text>
          <text x="320" y="302" font-family="JetBrains Mono" font-size="7" fill="#e0f2fe" text-anchor="middle">POST /api/webhooks/mercadopago</text>
          <rect x="245" y="312" width="150" height="52" rx="4" fill="#0369a1"/>
          <text x="320" y="326" font-family="Inter" font-size="7" font-weight="700" fill="#a7f3d0" text-anchor="middle">🛡️ Trava de Produção POD:</text>
          <text x="320" y="338" font-family="Inter" font-size="7" fill="#ffffff" text-anchor="middle">1. Verifica assinatura HMAC</text>
          <text x="320" y="348" font-family="Inter" font-size="7.5" fill="#ffffff" text-anchor="middle">2. Checa status 'paid'</text>
          <text x="320" y="358" font-family="Inter" font-size="7" fill="#ffffff" text-anchor="middle">3. Despacha ordem à Dimona</text>
        </g>

        <!-- COLUNA 3: SERVICES & LIBS DE NEGÓCIO (/lib) -->
        <g filter="url(#shadow)">
          <rect x="440" y="55" width="145" height="95" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
          <text x="512" y="78" font-family="Inter" font-size="10.5" font-weight="700" fill="#ffffff" text-anchor="middle">MercadoPago Service</text>
          <text x="512" y="92" font-family="JetBrains Mono" font-size="7.5" fill="#38bdf8" text-anchor="middle">src/lib/mercadopago.ts</text>
          <text x="512" y="110" font-family="Inter" font-size="7.5" fill="#cbd5e1" text-anchor="middle">• createMercadoPagoPixOrder</text>
          <text x="512" y="124" font-family="Inter" font-size="7.5" fill="#cbd5e1" text-anchor="middle">• getMercadoPagoOrder</text>
          <text x="512" y="138" font-family="Inter" font-size="7" fill="#a7f3d0" text-anchor="middle">Token OAuth via process.env</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="440" y="165" width="145" height="110" rx="6" fill="#1e293b" stroke="#16a34a" stroke-width="1.8"/>
          <text x="512" y="188" font-family="Inter" font-size="10.5" font-weight="700" fill="#ffffff" text-anchor="middle">Dimona POD Service</text>
          <text x="512" y="202" font-family="JetBrains Mono" font-size="7.5" fill="#86efac" text-anchor="middle">src/lib/dimona.ts</text>
          <text x="512" y="220" font-family="Inter" font-size="7.5" fill="#cbd5e1" text-anchor="middle">• createDimonaOrder</text>
          <text x="512" y="234" font-family="Inter" font-size="7.5" fill="#cbd5e1" text-anchor="middle">• calculateDimonaShipping</text>
          <text x="512" y="248" font-family="Inter" font-size="7.5" fill="#cbd5e1" text-anchor="middle">• Normalização de SKUs</text>
          <text x="512" y="264" font-family="Inter" font-size="7" fill="#86efac" text-anchor="middle">Sandbox / Prod Isolados</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="600" y="165" width="120" height="110" rx="6" fill="#042f2e" stroke="#0f766e" stroke-width="1.5"/>
          <text x="660" y="188" font-family="Inter" font-size="10" font-weight="700" fill="#ffffff" text-anchor="middle">Database Service</text>
          <text x="660" y="202" font-family="JetBrains Mono" font-size="7" fill="#5eead4" text-anchor="middle">supabase.ts</text>
          <text x="660" y="220" font-family="Inter" font-size="7" fill="#ccfbf1" text-anchor="middle">• saveDatabaseOrder</text>
          <text x="660" y="234" font-family="Inter" font-size="7" fill="#ccfbf1" text-anchor="middle">• Service Role Key</text>
          <text x="660" y="248" font-family="Inter" font-size="7" fill="#ccfbf1" text-anchor="middle">• RLS Policies</text>
          <text x="660" y="264" font-family="Inter" font-size="7" fill="#5eead4" text-anchor="middle">Acesso Seguro</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="440" y="295" width="145" height="65" rx="6" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
          <text x="512" y="318" font-family="Inter" font-size="10.5" font-weight="700" fill="#ffffff" text-anchor="middle">Artwork Resolver</text>
          <text x="512" y="332" font-family="JetBrains Mono" font-size="7.5" fill="#38bdf8" text-anchor="middle">src/lib/artworks.ts</text>
          <text x="512" y="348" font-family="Inter" font-size="7.5" fill="#cbd5e1" text-anchor="middle">• getArtworkUrl(sku)</text>
        </g>

        <!-- DESTINOS EXTERNOS (Direita) -->
        <g filter="url(#shadow)">
          <rect x="755" y="65" width="245" height="75" rx="6" fill="#334155" stroke="#0ea5e9" stroke-width="1.5"/>
          <text x="877" y="90" font-family="Inter" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">Mercado Pago Orders API</text>
          <text x="877" y="104" font-family="Inter" font-size="8" fill="#38bdf8" text-anchor="middle">Geração de Pix dinâmico protegido</text>
          <text x="877" y="118" font-family="Inter" font-size="7.5" fill="#cbd5e1" text-anchor="middle">Notificações assinadas via HMAC-SHA256</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="755" y="170" width="245" height="100" rx="6" fill="#334155" stroke="#16a34a" stroke-width="2"/>
          <text x="877" y="195" font-family="Inter" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">Dimona API v2 (Produção POD)</text>
          <text x="877" y="210" font-family="Inter" font-size="8" fill="#86efac" text-anchor="middle">Esteira Fabril com Barreira Financeira</text>
          <text x="877" y="226" font-family="Inter" font-size="7.5" fill="#cbd5e1" text-anchor="middle">Recepção de artes HD, SKUs e dados postais</text>
          <text x="877" y="240" font-family="Inter" font-size="7.5" fill="#cbd5e1" text-anchor="middle">Emissão de etiqueta e envio ao cliente</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="755" y="295" width="245" height="75" rx="6" fill="#042f2e" stroke="#14b8a6" stroke-width="1.5"/>
          <text x="877" y="320" font-family="Inter" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">Supabase PostgreSQL</text>
          <text x="877" y="335" font-family="Inter" font-size="8" fill="#5eead4" text-anchor="middle">Persistência auditada com RLS</text>
          <text x="877" y="348" font-family="Inter" font-size="7.5" fill="#ccfbf1" text-anchor="middle">Tabela 'orders' gravada com Service Role Key</text>
        </g>

        <!-- LIGAÇÕES ENTRE GUARDIÕES E CONTROLADORES -->
        <!-- Rate Limit -> Checkout -->
        <path d="M 200 90 L 230 90" stroke="#10b981" stroke-width="1.8" fill="none" marker-end="url(#arrow-green)"/>
        <!-- Sanitizer -> Shipping -->
        <path d="M 200 185 L 230 185" stroke="#10b981" stroke-width="1.8" fill="none" marker-end="url(#arrow-green)"/>
        <!-- HMAC -> MP Webhook -->
        <path d="M 200 280 L 230 280" stroke="#10b981" stroke-width="1.8" fill="none" marker-end="url(#arrow-green)"/>

        <!-- Checkout -> MP Service -->
        <path d="M 405 100 L 435 100" stroke="#0284c7" stroke-width="1.8" fill="none" marker-end="url(#arrow-blue)"/>
        <path d="M 585 100 L 748 100" stroke="#0ea5e9" stroke-width="1.8" fill="none" marker-end="url(#arrow)"/>

        <!-- Shipping -> Dimona Service -->
        <path d="M 405 210 L 435 210" stroke="#0284c7" stroke-width="1.8" fill="none" marker-end="url(#arrow-blue)"/>

        <!-- MP Webhook -> Dimona POD Service (trava aprovada) -->
        <path d="M 405 320 L 435 240" stroke="#16a34a" stroke-width="2" fill="none" marker-end="url(#arrow-green)"/>
        <!-- Dimona Service -> Dimona API -->
        <path d="M 585 220 L 748 220" stroke="#16a34a" stroke-width="2" fill="none" marker-end="url(#arrow-green)"/>

        <!-- Dimona Service -> Supabase Service -->
        <path d="M 585 240 L 595 240" stroke="#0f766e" stroke-width="1.8" fill="none" marker-end="url(#arrow)"/>
        <path d="M 720 220 L 748 310" stroke="#14b8a6" stroke-width="1.8" fill="none" marker-end="url(#arrow)"/>
      </svg>
    </div>

    <div class="footer">
      <div>Munaya Rocks E-Commerce Architecture • Modelagem C4 Hardened com Defesa em Profundidade</div>
      <div>Página 3 de 4</div>
    </div>
  </div>


  <!-- ========================================================================= -->
  <!-- PÁGINA 4: MATRIZ DE CONEXÕES & ESPECIFICAÇÃO DE SEGURANÇA                 -->
  <!-- ========================================================================= -->
  <div class="page">
    <div class="header">
      <div class="brand-title">
        <span class="badge-c4">C4 Nível 4 / Matriz</span>
        <span class="badge-sec">🛡️ Matriz de Defesa</span>
        <div class="title-group">
          <h1>Matriz de Conexões Externas & Controles de Segurança</h1>
          <p>Especificações criptográficas, integridade de transações, tolerância a falhas e políticas de defesa</p>
        </div>
      </div>
      <div class="doc-meta">
        <div><strong>Padrão:</strong> REST / HMAC-SHA256 / RLS</div>
        <div><strong>Conformidade:</strong> LGPD & OWASP Top 10</div>
      </div>
    </div>

    <div class="diagram-container">
      <table class="spec-table">
        <thead>
          <tr>
            <th style="width: 13%;">Sistema Externo</th>
            <th style="width: 17%;">Responsabilidade</th>
            <th style="width: 10%;">Protocolo</th>
            <th style="width: 16%;">Mecanismo de Autenticação</th>
            <th style="width: 24%;">Camada de Segurança Específica</th>
            <th style="width: 20%;">Tratamento de Falha / Resiliência</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Camisa Dimona</strong><br>
              <span class="badge-ext">Fulfillment POD</span>
            </td>
            <td>Confecção DTG sob demanda, embalagem, despacho postal e frete fabril.</td>
            <td>HTTPS / REST<br><span class="code">TCP 443</span></td>
            <td>API Key via Header<br><span class="code">Bearer DIMONA_API_KEY</span></td>
            <td>
              <span class="badge-shield">🛡️ Trava Financeira Prévia</span><br>
              A API fabril só é acionada após o webhook validar status de pagamento liquidado no gateway.
            </td>
            <td>Modo Sandbox com bypass controlado se a chave estiver ausente; log de auditoria estruturado.</td>
          </tr>
          <tr>
            <td>
              <strong>Mercado Pago</strong><br>
              <span class="badge-ext">Payment Gateway</span>
            </td>
            <td>Ordens Pix dinâmicas com QR Code Copia e Cola e notificação de liquidação.</td>
            <td>HTTPS / REST<br><span class="code">TCP 443</span></td>
            <td>OAuth Bearer Token<br><span class="code">APP_USR-...</span></td>
            <td>
              <span class="badge-shield">🛡️ HMAC-SHA256 Webhook</span><br>
              Validação estrita de <span class="code">x-signature</span> e <span class="code">x-request-id</span>; rejeição de webhooks forjados.
            </td>
            <td>Processamento idempotente com deduplicação por <span class="code">external_reference</span>; retries automáticos.</td>
          </tr>
          <tr>
            <td>
              <strong>Supabase</strong><br>
              <span class="badge-in">Data & Storage</span>
            </td>
            <td>PostgreSQL relacional e Object Storage público para mockups e imagens.</td>
            <td>HTTPS / WSS<br><span class="code">TCP 443 / 5432</span></td>
            <td>Anon Key (Navegador)<br>Service Role Key (Servidor)</td>
            <td>
              <span class="badge-shield">🛡️ Row Level Security (RLS)</span><br>
              Tabelas de pedidos só aceitam escrita a partir do backend autenticado via Service Role Key.
            </td>
            <td>Fallback seguro para catálogo local se o banco falhar; reconexão automática com backoff via SDK.</td>
          </tr>
          <tr>
            <td>
              <strong>ViaCEP</strong><br>
              <span class="badge-ext">Geolocalização</span>
            </td>
            <td>Resolução instantânea de logradouro e UF para frete e checkout.</td>
            <td>HTTPS / REST<br><span class="code">TCP 443</span></td>
            <td>Pública / Sem Auth</td>
            <td>
              <span class="badge-shield">🛡️ Input Sanitization</span><br>
              Higienização estrita de CEP (<span class="code">replace(/\\D/g, '')</span>) com validação de 8 dígitos.
            </td>
            <td>Falha graciosa: se o ViaCEP estiver indisponível, o cliente digita o endereço sem travar a compra.</td>
          </tr>
        </tbody>
      </table>

      <!-- GRID DE CONTROLES DE SEGURANÇA DETALHADO -->
      <div class="sec-grid">
        <div class="sec-card">
          <h4>🛡️ Anti-Price Tampering</h4>
          <p>O total do pedido é recalculado integralmente no servidor (<span class="code">route.ts</span>) multiplicando os preços oficiais dos SKUs. O valor enviado pelo navegador é ignorado.</p>
        </div>
        <div class="sec-card">
          <h4>🛡️ Rate Limiting por IP</h4>
          <p>Implementado em <span class="code">rate-limit.ts</span>: limita requisições consecutivas nos endpoints de checkout (10/min) e frete (30/min), mitigando ataques de força bruta e DDoS.</p>
        </div>
        <div class="sec-card">
          <h4>🛡️ Constant-Time Auth</h4>
          <p>No painel <span class="code">/admin</span>, a comparação de senhas e tokens utiliza <span class="code">crypto.timingSafeEqual</span> em <span class="code">admin-auth.ts</span>, prevenindo ataques de temporização.</p>
        </div>
        <div class="sec-card">
          <h4>🛡️ Hardening de Headers HTTP</h4>
          <p>Configurado no <span class="code">next.config.ts</span>: HSTS Preload (2 anos), <span class="code">X-Frame-Options: DENY</span> contra Clickjacking, <span class="code">nosniff</span> e políticas restritivas de referrer.</p>
        </div>
      </div>

      <div class="notes-box">
        <strong>Conformidade e Responsabilidade Operacional (Dimona POD):</strong>
        Conforme registrado em <span class="code">docs/fornecedores.md</span>: Defeitos de confecção fabril são cobertos pela Dimona em até 7 dias corridos. Trocas comerciais ou arrependimento (CDC Art. 49) são geridas pela Munaya. O pipeline automatizado garante que nenhum custo de confecção seja gerado antes da liquidação financeira definitiva.
      </div>
    </div>

    <div class="footer">
      <div>Munaya Rocks E-Commerce Architecture • Modelagem C4 Hardened com Defesa em Profundidade</div>
      <div>Página 4 de 4</div>
    </div>
  </div>

</body>
</html>
"""

def generate_pdf():
    output_dir = os.path.join(os.getcwd(), "docs")
    os.makedirs(output_dir, exist_ok=True)
    pdf_path = os.path.join(output_dir, "arquitetura-c4-munaya.pdf")
    html_path = os.path.join(output_dir, "arquitetura-c4-temp.html")

    # Salva o arquivo HTML temporário
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(HTML_CONTENT)

    print(f"Gerando PDF através do Playwright e Microsoft Edge...")
    
    edge_executable = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
    
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=edge_executable)
        page = browser.new_page()
        page.goto(f"file:///{html_path.replace(os.sep, '/')}", wait_until="networkidle")
        
        # Gera o PDF em orientação paisagem A4
        page.pdf(
            path=pdf_path,
            format="A4",
            landscape=True,
            print_background=True,
            margin={"top": "0mm", "right": "0mm", "bottom": "0mm", "left": "0mm"}
        )
        browser.close()

    # Remove o HTML temporário
    if os.path.exists(html_path):
        os.remove(html_path)

    print(f"Sucesso! PDF gerado em: {pdf_path}")
    file_size = os.path.getsize(pdf_path)
    print(f"Tamanho do arquivo: {file_size:,} bytes")

if __name__ == "__main__":
    generate_pdf()
