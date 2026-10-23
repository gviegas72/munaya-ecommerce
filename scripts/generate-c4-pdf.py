"""
Script para geração do Diagrama de Arquitetura C4 em PDF da Plataforma Munaya.
Atualizado com as Novas Integrações da Plataforma:
1. Evolution API (WhatsApp Transacional v1/v2 para Pix, Confirmação e Rastreio)
2. Resend API (E-mails Transacionais responsivos com templates @react-email)
3. Dimona Inbound Webhook (/api/webhooks/dimona para Ingestão de Rastreio e Status)
4. Supabase Auth & RBAC (Área do Cliente /account e Trilha de Auditoria em audit_logs)
5. Central de Blanks & Mapeamento de SKU desacoplado (dimona-mapping.ts)
6. Módulo de Cupons & Regras de Preço (coupons.ts, pricing.ts)
"""

import os
import re
from playwright.sync_api import sync_playwright

HTML_CONTENT = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Munaya Rocks - Diagrama de Arquitetura C4 Atualizado</title>
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
      gap: 10px;
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

    .badge-feat {
      background: #1e3a8a;
      color: #93c5fd;
      font-weight: 800;
      font-size: 10px;
      padding: 4px 10px;
      border-radius: 6px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .title-group h1 {
      font-size: 16.5px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
    }

    .title-group p {
      font-size: 10.5px;
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
      font-size: 9.5px;
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
      font-size: 9px;
      margin-top: 4px;
    }

    .spec-table th {
      background: #0f172a;
      color: #ffffff;
      padding: 6px 9px;
      text-align: left;
      font-weight: 700;
      font-size: 9px;
    }

    .spec-table td {
      padding: 6px 9px;
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
      font-size: 8px;
      margin-top: 2px;
    }

    .badge-in {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 8px;
      margin-top: 2px;
    }

    .badge-shield {
      display: inline-block;
      background: #dcfce7;
      color: #15803d;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 8px;
      margin-top: 2px;
      border: 1px solid #86efac;
    }

    .badge-new {
      display: inline-block;
      background: #fef3c7;
      color: #b45309;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 8px;
      margin-top: 2px;
      border: 1px solid #fde68a;
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
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      margin-top: 8px;
    }

    .sec-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 7px 9px;
      border-top: 3px solid #0284c7;
    }

    .sec-card.green {
      border-top-color: #059669;
    }

    .sec-card.amber {
      border-top-color: #d97706;
    }

    .sec-card h4 {
      font-size: 9.5px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 2px;
    }

    .sec-card p {
      font-size: 8px;
      color: #475569;
      line-height: 1.35;
    }

    .notes-box {
      background: #f0fdf4;
      border-left: 4px solid #16a34a;
      padding: 6px 12px;
      border-radius: 0 6px 6px 0;
      font-size: 9px;
      color: #166534;
      margin-top: 8px;
      line-height: 1.35;
    }
  </style>
</head>
<body>

  <!-- ========================================================================= -->
  <!-- PÁGINA 1: C4 NÍVEL 1 — CONTEXTO & ECOSSISTEMA COMPLETO                    -->
  <!-- ========================================================================= -->
  <div class="page">
    <div class="header">
      <div class="brand-title">
        <span class="badge-c4">C4 Nível 1</span>
        <span class="badge-feat">✨ Novas Integrações</span>
        <div class="title-group">
          <h1>Munaya E-Commerce — Contexto de Sistema & Conexões Externas</h1>
          <p>Visão geral da plataforma, atores e ecossistema integrado (Fulfillment, Pagamentos, WhatsApp, E-mail, BaaS)</p>
        </div>
      </div>
      <div class="doc-meta">
        <div><strong>Projeto:</strong> Munaya Rocks E-Commerce</div>
        <div><strong>Versão:</strong> Arquitetura Atualizada | Outubro 2026</div>
      </div>
    </div>

    <div class="diagram-container">
      <div class="legend-bar">
        <div class="legend-item"><span class="legend-color" style="background:#0284c7;"></span> <strong>Pessoa / Usuário</strong> (Cliente, Lojista)</div>
        <div class="legend-item"><span class="legend-color" style="background:#0f172a; border: 1.5px solid #38bdf8;"></span> <strong>Sistema Interno</strong> (Plataforma Munaya)</div>
        <div class="legend-item"><span class="legend-color" style="background:#475569;"></span> <strong>Sistemas Externos</strong> (Gateways, POD, Mensageria, BaaS)</div>
        <div class="legend-item"><span class="legend-color" style="background:#16a34a;"></span> <strong>Fulfillment & Webhook</strong> (Esteira Fabril)</div>
        <div class="legend-item"><span class="legend-color" style="background:#25d366;"></span> <strong>Mensageria Transacional</strong> (WhatsApp & E-mail)</div>
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
          <marker id="arrow-wa" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669" />
          </marker>
          <marker id="arrow-email" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#7c3aed" />
          </marker>
        </defs>

        <!-- ATORES (Esquerda) -->
        <!-- Cliente Final -->
        <g filter="url(#shadow)">
          <rect x="25" y="60" width="160" height="125" rx="8" fill="url(#userGrad)"/>
          <circle cx="105" cy="92" r="14" fill="#ffffff"/>
          <path d="M 89 120 C 89 108 121 108 121 120 Z" fill="#ffffff"/>
          <text x="105" y="140" font-family="Inter" font-size="11.5" font-weight="700" fill="#ffffff" text-anchor="middle">Cliente / Consumidor</text>
          <text x="105" y="154" font-family="Inter" font-size="8.5" fill="#e0f2fe" text-anchor="middle">[Pessoa / Usuário da Loja]</text>
          <text x="105" y="167" font-family="Inter" font-size="7.5" fill="#bae6fd" text-anchor="middle">Navega, cria conta, paga via Pix</text>
          <text x="105" y="177" font-family="Inter" font-size="7.5" fill="#bae6fd" text-anchor="middle">e recebe alertas no WhatsApp/E-mail</text>
        </g>

        <!-- Administrador Munaya -->
        <g filter="url(#shadow)">
          <rect x="25" y="240" width="160" height="125" rx="8" fill="url(#userGrad)"/>
          <circle cx="105" cy="272" r="14" fill="#ffffff"/>
          <path d="M 89 300 C 89 288 121 288 121 300 Z" fill="#ffffff"/>
          <text x="105" y="320" font-family="Inter" font-size="11.5" font-weight="700" fill="#ffffff" text-anchor="middle">Administrador / Equipe</text>
          <text x="105" y="334" font-family="Inter" font-size="8.5" fill="#e0f2fe" text-anchor="middle">[Pessoa / Gestão Munaya]</text>
          <text x="105" y="347" font-family="Inter" font-size="7.5" fill="#bae6fd" text-anchor="middle">Painel /admin: Clientes, Cupons,</text>
          <text x="105" y="357" font-family="Inter" font-size="7.5" fill="#bae6fd" text-anchor="middle">Blanks, Trilha RBAC e WhatsApp</text>
        </g>

        <!-- SISTEMA CENTRAL: Plataforma Munaya -->
        <g filter="url(#shadow)">
          <rect x="315" y="45" width="315" height="350" rx="12" fill="url(#systemGrad)" stroke="#38bdf8" stroke-width="2"/>
          
          <!-- Badges do Sistema -->
          <rect x="330" y="58" width="95" height="18" rx="4" fill="#0284c7"/>
          <text x="377" y="70" font-family="Inter" font-size="8" font-weight="800" fill="#ffffff" text-anchor="middle">SOFTWARE SYSTEM</text>
          <rect x="432" y="58" width="85" height="18" rx="4" fill="#065f46"/>
          <text x="474" y="70" font-family="Inter" font-size="8" font-weight="800" fill="#a7f3d0" text-anchor="middle">🛡️ HARDENED</text>
          
          <text x="472" y="100" font-family="Inter" font-size="16" font-weight="800" fill="#ffffff" text-anchor="middle">Plataforma Munaya</text>
          <text x="472" y="116" font-family="Inter" font-size="10" font-weight="600" fill="#38bdf8" text-anchor="middle">[Next.js 16 + React 19 Headless E-Commerce]</text>
          
          <rect x="330" y="128" width="285" height="252" rx="8" fill="#1e293b" stroke="#334155" stroke-dasharray="3 3"/>
          <text x="472" y="146" font-family="Inter" font-size="9" font-weight="700" fill="#f8fafc" text-anchor="middle">Módulos & Capacidades Principais:</text>
          
          <text x="342" y="166" font-family="Inter" font-size="8" fill="#e2e8f0">• <strong>Storefront:</strong> Vitrine, Mockups 3D dinâmicos por cor/blank</text>
          <text x="342" y="182" font-family="Inter" font-size="8" fill="#e2e8f0">• <strong>Área do Cliente:</strong> /account (Pedidos, dados e senha)</text>
          <text x="342" y="198" font-family="Inter" font-size="8" fill="#e2e8f0">• <strong>Checkout Pix:</strong> QrCode dinâmico com recálculo no servidor</text>
          <text x="342" y="214" font-family="Inter" font-size="8" fill="#93c5fd">• <strong>WhatsApp Bot:</strong> Evolution API v1/v2 com fallback wa.me</text>
          <text x="342" y="230" font-family="Inter" font-size="8" fill="#c4b5fd">• <strong>E-mails Transacionais:</strong> Templates @react-email via Resend</text>
          <text x="342" y="246" font-family="Inter" font-size="8" fill="#86efac">• <strong>Pipeline POD:</strong> Despacho Dimona + Webhook de rastreio</text>
          <text x="342" y="262" font-family="Inter" font-size="8" fill="#fde047">• <strong>Cupons & Pricing:</strong> Validação de descontos e regras de margem</text>
          <text x="342" y="278" font-family="Inter" font-size="8" fill="#e2e8f0">• <strong>Admin Completo:</strong> Gestão de clientes, blanks e logs RBAC</text>
          <text x="342" y="294" font-family="Inter" font-size="8" fill="#a7f3d0">• <strong>Segurança:</strong> Rate Limiting, HMAC-SHA256, HSTS e timingSafeEqual</text>
          
          <text x="342" y="322" font-family="Inter" font-size="8" font-weight="700" fill="#38bdf8">Vercel Edge Global Network • TLS 1.3 End-to-End</text>
          <text x="342" y="336" font-family="Inter" font-size="7.5" fill="#94a3b8">BaaS Serverless com Postgres Relacional Supabase</text>
        </g>

        <!-- SISTEMAS EXTERNOS (Direita - 6 Conexões) -->
        <!-- 1. Camisa Dimona -->
        <g filter="url(#shadow)">
          <rect x="745" y="25" width="250" height="58" rx="6" fill="url(#extGrad)" stroke="#16a34a" stroke-width="1.5"/>
          <text x="870" y="44" font-family="Inter" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">Camisa Dimona (API v2 + Webhook)</text>
          <text x="870" y="56" font-family="Inter" font-size="7.5" fill="#86efac" text-anchor="middle">[Fulfillment POD Bidirecional]</text>
          <text x="870" y="69" font-family="Inter" font-size="7" fill="#cbd5e1" text-anchor="middle">Envio de pedidos DTG + Ingestão de rastreio Correios/Jadlog</text>
        </g>

        <!-- 2. Mercado Pago -->
        <g filter="url(#shadow)">
          <rect x="745" y="88" width="250" height="58" rx="6" fill="url(#extGrad)" stroke="#0ea5e9" stroke-width="1.5"/>
          <text x="870" y="107" font-family="Inter" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">Mercado Pago (Orders API + IPN)</text>
          <text x="870" y="119" font-family="Inter" font-size="7.5" fill="#38bdf8" text-anchor="middle">[Gateway de Pagamento Pix]</text>
          <text x="870" y="132" font-family="Inter" font-size="7" fill="#cbd5e1" text-anchor="middle">Geração Pix imediata e Webhook com assinatura HMAC-SHA256</text>
        </g>

        <!-- 3. Evolution API (WhatsApp) - NOVA -->
        <g filter="url(#shadow)">
          <rect x="745" y="151" width="250" height="58" rx="6" fill="url(#extGrad)" stroke="#059669" stroke-width="2"/>
          <text x="870" y="170" font-family="Inter" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">Evolution API (WhatsApp v1/v2) ✨</text>
          <text x="870" y="182" font-family="Inter" font-size="7.5" fill="#a7f3d0" text-anchor="middle">[Mensageria Transacional]</text>
          <text x="870" y="195" font-family="Inter" font-size="7" fill="#cbd5e1" text-anchor="middle">Envio ativo de Pix Copia e Cola, confirmação e código de rastreio</text>
        </g>

        <!-- 4. Resend (E-mail @react-email) - NOVA -->
        <g filter="url(#shadow)">
          <rect x="745" y="214" width="250" height="58" rx="6" fill="url(#extGrad)" stroke="#7c3aed" stroke-width="1.8"/>
          <text x="870" y="233" font-family="Inter" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">Resend API (@react-email) ✨</text>
          <text x="870" y="245" font-family="Inter" font-size="7.5" fill="#c4b5fd" text-anchor="middle">[E-mails Transacionais Responsivos]</text>
          <text x="870" y="258" font-family="Inter" font-size="7.5" fill="#cbd5e1" text-anchor="middle">OrderCreated, PaymentConfirmed, OrderShipped e Reset de Senha</text>
        </g>

        <!-- 5. Supabase Cloud -->
        <g filter="url(#shadow)">
          <rect x="745" y="277" width="250" height="58" rx="6" fill="url(#extGrad)" stroke="#14b8a6" stroke-width="1.5"/>
          <text x="870" y="296" font-family="Inter" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">Supabase Cloud (Postgres + Auth + CDN)</text>
          <text x="870" y="308" font-family="Inter" font-size="7.5" fill="#5eead4" text-anchor="middle">[BaaS Relacional & Identidade]</text>
          <text x="870" y="321" font-family="Inter" font-size="7" fill="#cbd5e1" text-anchor="middle">PostgreSQL com RLS, Auth Clientes/RBAC e Trilha de Auditoria</text>
        </g>

        <!-- 6. ViaCEP API -->
        <g filter="url(#shadow)">
          <rect x="745" y="340" width="250" height="55" rx="6" fill="url(#extGrad)"/>
          <text x="870" y="359" font-family="Inter" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">ViaCEP API</text>
          <text x="870" y="371" font-family="Inter" font-size="7.5" fill="#fde047" text-anchor="middle">[Geolocalização Nacional]</text>
          <text x="870" y="384" font-family="Inter" font-size="7" fill="#cbd5e1" text-anchor="middle">Preenchimento automático e higienização de endereço para frete</text>
        </g>

        <!-- CONECTORES -->
        <!-- Cliente -> Munaya -->
        <path d="M 185 105 L 307 105" stroke="#0284c7" stroke-width="1.8" fill="none" marker-end="url(#arrow-blue)"/>
        <rect x="195" y="90" width="105" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="247" y="102" font-family="Inter" font-size="7.5" fill="#0369a1" text-anchor="middle" font-weight="700">HTTPS / HSTS / TLS</text>

        <!-- Admin -> Munaya -->
        <path d="M 185 285 L 307 285" stroke="#0284c7" stroke-width="1.8" fill="none" marker-end="url(#arrow-blue)"/>
        <rect x="195" y="270" width="105" height="18" rx="4" fill="#ffffff" stroke="#cbd5e1"/>
        <text x="247" y="282" font-family="Inter" font-size="7.5" fill="#0369a1" text-anchor="middle" font-weight="700">RBAC timingSafeEqual</text>

        <!-- Munaya <-> Dimona -->
        <path d="M 630 65 L 737 54" stroke="#16a34a" stroke-width="1.8" fill="none" marker-end="url(#arrow-green)"/>
        <!-- Munaya <-> Mercado Pago -->
        <path d="M 630 115 L 737 117" stroke="#0ea5e9" stroke-width="1.6" fill="none" marker-end="url(#arrow)"/>
        <!-- Munaya -> Evolution API -->
        <path d="M 630 180 L 737 180" stroke="#059669" stroke-width="2" fill="none" marker-end="url(#arrow-wa)"/>
        <!-- Munaya -> Resend -->
        <path d="M 630 240 L 737 243" stroke="#7c3aed" stroke-width="1.8" fill="none" marker-end="url(#arrow-email)"/>
        <!-- Munaya -> Supabase -->
        <path d="M 630 305 L 737 306" stroke="#14b8a6" stroke-width="1.6" fill="none" marker-end="url(#arrow)"/>
        <!-- Munaya -> ViaCEP -->
        <path d="M 630 365 L 737 367" stroke="#475569" stroke-width="1.5" stroke-dasharray="3 3" fill="none" marker-end="url(#arrow)"/>
      </svg>
    </div>

    <div class="footer">
      <div>Munaya Rocks E-Commerce Architecture • Modelagem C4 com Novas Integrações (WhatsApp, Resend & Dimona Webhook)</div>
      <div>Página 1 de 4</div>
    </div>
  </div>


  <!-- ========================================================================= -->
  <!-- PÁGINA 2: C4 NÍVEL 2 — CONTÊINERES & PLATAFORMA INTEGRADA                 -->
  <!-- ========================================================================= -->
  <div class="page">
    <div class="header">
      <div class="brand-title">
        <span class="badge-c4">C4 Nível 2</span>
        <span class="badge-feat">✨ Contêineres & Serviços</span>
        <div class="title-group">
          <h1>Munaya E-Commerce — Diagrama de Contêineres Atualizado</h1>
          <p>Visão arquitetural dos contêineres de software, camadas de mensageria e serviços de terceiros</p>
        </div>
      </div>
      <div class="doc-meta">
        <div><strong>Hospedagem:</strong> Vercel Serverless + Supabase Cloud</div>
        <div><strong>Mensageria:</strong> Evolution WhatsApp + Resend Email</div>
      </div>
    </div>

    <div class="diagram-container">
      <div class="legend-bar">
        <div class="legend-item"><span class="legend-color" style="background:#0284c7;"></span> <strong>Frontend / SPA</strong> (React 19 / Next.js)</div>
        <div class="legend-item"><span class="legend-color" style="background:#0f172a; border: 1.5px solid #10b981;"></span> <strong>Backend Hardened</strong> (API Serverless)</div>
        <div class="legend-item"><span class="legend-color" style="background:#0f766e;"></span> <strong>Supabase BaaS</strong> (Postgres + Auth + CDN)</div>
        <div class="legend-item"><span class="legend-color" style="background:#475569;"></span> <strong>Serviços Externos Conectados</strong></div>
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

        <!-- FRONTEIRA DO MONOREPO NEXT.JS -->
        <rect x="175" y="16" width="560" height="402" rx="12" fill="#f8fafc" stroke="#10b981" stroke-width="1.8" stroke-dasharray="4 4"/>
        <rect x="188" y="24" width="370" height="17" rx="4" fill="#dcfce7"/>
        <text x="373" y="36" font-family="Inter" font-size="8.5" font-weight="800" fill="#15803d">🛡️ APLICAÇÃO MUNAYA [Next.js Monorepo na Vercel Edge Global Network]</text>

        <!-- USUÁRIO -->
        <g filter="url(#shadow)">
          <rect x="15" y="95" width="135" height="105" rx="8" fill="url(#userGrad)"/>
          <text x="82" y="125" font-family="Inter" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">Consumidor</text>
          <text x="82" y="140" font-family="Inter" font-size="8" fill="#e0f2fe" text-anchor="middle">Web & Mobile HSTS</text>
          <text x="82" y="155" font-family="Inter" font-size="7.5" fill="#bae6fd" text-anchor="middle">• Catálogo & Mockups</text>
          <text x="82" y="169" font-family="Inter" font-size="7.5" fill="#bae6fd" text-anchor="middle">• Área do Cliente /account</text>
          <text x="82" y="183" font-family="Inter" font-size="7.5" fill="#bae6fd" text-anchor="middle">• Checkout Pix Seguro</text>
        </g>

        <!-- CONTÊINER 1: FRONTEND WEB APP -->
        <g filter="url(#shadow)">
          <rect x="195" y="52" width="235" height="198" rx="8" fill="url(#spaGrad2)"/>
          <text x="312" y="74" font-family="Inter" font-size="11.5" font-weight="700" fill="#ffffff" text-anchor="middle">Web Application (Frontend)</text>
          <text x="312" y="88" font-family="Inter" font-size="8" fill="#bae6fd" text-anchor="middle">[Next.js 16, React 19, Tailwind CSS v4]</text>
          
          <rect x="205" y="98" width="215" height="142" rx="5" fill="#0c4a6e" fill-opacity="0.6"/>
          <text x="215" y="114" font-family="Inter" font-size="7.5" font-weight="700" fill="#a7f3d0">Storefront & Experiência Rockwear:</text>
          <text x="215" y="128" font-family="Inter" font-size="7.5" fill="#e0f2fe">• Vitrine, Hero em Vídeo e CartDrawer</text>
          <text x="215" y="142" font-family="Inter" font-size="7.5" fill="#e0f2fe">• PDP com Seletor de Cores e Blanks Oficiais</text>
          <text x="215" y="156" font-family="Inter" font-size="7.5" fill="#e0f2fe">• Banner Promocional & Validação de Cupons</text>
          <text x="215" y="172" font-family="Inter" font-size="7.5" font-weight="700" fill="#93c5fd">Área do Cliente & Painel Admin:</text>
          <text x="215" y="186" font-family="Inter" font-size="7.5" fill="#e0f2fe">• /account: Pedidos, Dados e Redefinição Senha</text>
          <text x="215" y="200" font-family="Inter" font-size="7.5" fill="#e0f2fe">• /admin: Clientes, Cupons, Blanks e Auditoria</text>
          <text x="215" y="214" font-family="Inter" font-size="7.5" fill="#e0f2fe">• /admin/whatsapp: Configuração Evolution API</text>
          <text x="215" y="228" font-family="Inter" font-size="7" fill="#a7f3d0">Injeção de Headers HTTP (HSTS, nosniff, DENY)</text>
        </g>

        <!-- CONTÊINER 2: BACKEND SERVERLESS API -->
        <g filter="url(#shadow)">
          <rect x="465" y="52" width="255" height="352" rx="8" fill="url(#apiGrad2)" stroke="#10b981" stroke-width="2"/>
          <text x="592" y="74" font-family="Inter" font-size="11.5" font-weight="700" fill="#ffffff" text-anchor="middle">Backend Serverless API</text>
          <text x="592" y="88" font-family="Inter" font-size="8" fill="#a7f3d0" text-anchor="middle">[Hardened Route Handlers & Dispatchers]</text>
          
          <rect x="475" y="98" width="235" height="296" rx="5" fill="#1e293b"/>
          
          <text x="485" y="114" font-family="Inter" font-size="8" font-weight="800" fill="#10b981">Controladores & Rotas (/api):</text>
          <text x="485" y="128" font-family="Inter" font-size="7.5" fill="#e2e8f0">• /api/checkout (Recálculo total no servidor)</text>
          <text x="485" y="142" font-family="Inter" font-size="7.5" fill="#e2e8f0">• /api/shipping (Cotação Dimona + ViaCEP)</text>
          <text x="485" y="156" font-family="Inter" font-size="7.5" fill="#e2e8f0">• /api/coupons & /api/pricing (Descontos/Margem)</text>
          <text x="485" y="170" font-family="Inter" font-size="7.5" fill="#e2e8f0">• /api/account/orders & /api/customers</text>
          <text x="485" y="184" font-family="Inter" font-size="7.5" fill="#e2e8f0">• /api/admin/audit & /api/whatsapp/config</text>
          
          <text x="485" y="204" font-family="Inter" font-size="8" font-weight="800" fill="#38bdf8">Webhooks Bidirecionais:</text>
          <text x="485" y="218" font-family="Inter" font-size="7.5" fill="#e2e8f0">• /webhooks/mercadopago (HMAC-SHA256)</text>
          <text x="485" y="232" font-family="Inter" font-size="7.5" fill="#86efac">• /webhooks/dimona (Status & Rastreio POD)</text>
          
          <text x="485" y="252" font-family="Inter" font-size="8" font-weight="800" fill="#a7f3d0">Camada de Notificadores & Integração:</text>
          <text x="485" y="266" font-family="Inter" font-size="7.5" fill="#cbd5e1">• whatsapp.ts (Evolution API v1/v2 + wa.me)</text>
          <text x="485" y="280" font-family="Inter" font-size="7.5" fill="#cbd5e1">• email.ts (Resend + templates @react-email)</text>
          <text x="485" y="294" font-family="Inter" font-size="7.5" fill="#cbd5e1">• dimona.ts & dimona-mapping.ts (Blanks/SKU)</text>
          <text x="485" y="308" font-family="Inter" font-size="7.5" fill="#cbd5e1">• mercadopago.ts (SDK Ordens Pix)</text>
          
          <text x="485" y="328" font-family="Inter" font-size="8" font-weight="800" fill="#fde047">Guardrails de Segurança:</text>
          <text x="485" y="342" font-family="Inter" font-size="7" fill="#94a3b8">• rate-limit.ts, sanitize.ts, admin-auth.ts, audit.ts</text>
          <text x="485" y="356" font-family="Inter" font-size="7" fill="#94a3b8">• Trava estrita de despacho sem liquidação</text>
          <text x="485" y="374" font-family="Inter" font-size="7" font-weight="700" fill="#a7f3d0">Execução Serverless Segura na Vercel Edge</text>
        </g>

        <!-- CONTÊINER 3: SUPABASE (BD + AUTH + CDN) -->
        <g filter="url(#shadow)">
          <rect x="195" y="265" width="235" height="139" rx="8" fill="url(#dbGrad2)"/>
          <text x="312" y="286" font-family="Inter" font-size="11" font-weight="700" fill="#ffffff" text-anchor="middle">Supabase Cloud (BaaS)</text>
          <text x="312" y="299" font-family="Inter" font-size="7.5" fill="#99f6e4" text-anchor="middle">[PostgreSQL Gerenciado + Auth + Object Storage]</text>
          
          <rect x="205" y="308" width="215" height="88" rx="4" fill="#042f2e" fill-opacity="0.6"/>
          <text x="215" y="322" font-family="Inter" font-size="7.5" font-weight="700" fill="#5eead4">PostgreSQL com Row Level Security (RLS):</text>
          <text x="215" y="335" font-family="Inter" font-size="7" fill="#ccfbf1">• Tabelas: products, blanks, orders, customers, coupons, audit_logs</text>
          <text x="215" y="348" font-family="Inter" font-size="7" fill="#ccfbf1">• Anon Key (leitura pública) vs Service Role Key (escrita privada)</text>
          <text x="215" y="362" font-family="Inter" font-size="7.5" font-weight="700" fill="#5eead4">Supabase Auth & Storage CDN:</text>
          <text x="215" y="375" font-family="Inter" font-size="7" fill="#ccfbf1">• Sessões de clientes, roles administrativas e resets de senha</text>
          <text x="215" y="388" font-family="Inter" font-size="7" fill="#ccfbf1">• Buckets: artworks, mockups e private-config (evolution.json)</text>
        </g>

        <!-- SERVIÇOS EXTERNOS (Direita - 6 Serviços) -->
        <g filter="url(#shadow)">
          <rect x="760" y="25" width="235" height="52" rx="5" fill="#475569" stroke="#16a34a" stroke-width="1.5"/>
          <text x="877" y="42" font-family="Inter" font-size="10.5" font-weight="700" fill="#ffffff" text-anchor="middle">Camisa Dimona (API v2)</text>
          <text x="877" y="54" font-family="Inter" font-size="7" fill="#86efac" text-anchor="middle">Despacho POD + Inbound Webhook de Rastreio</text>
          <text x="877" y="66" font-family="Inter" font-size="7" fill="#cbd5e1" text-anchor="middle">POST /api/v2/pedidos e /api/webhooks/dimona</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="760" y="85" width="235" height="52" rx="5" fill="#475569" stroke="#0ea5e9" stroke-width="1.5"/>
          <text x="877" y="102" font-family="Inter" font-size="10.5" font-weight="700" fill="#ffffff" text-anchor="middle">Mercado Pago (Pix Gateway)</text>
          <text x="877" y="114" font-family="Inter" font-size="7" fill="#38bdf8" text-anchor="middle">Orders API Pix + Webhook IPN HMAC-SHA256</text>
          <text x="877" y="126" font-family="Inter" font-size="7" fill="#cbd5e1" text-anchor="middle">POST /v1/orders e /api/webhooks/mercadopago</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="760" y="145" width="235" height="55" rx="5" fill="#475569" stroke="#059669" stroke-width="2"/>
          <text x="870" y="163" font-family="Inter" font-size="10.5" font-weight="700" fill="#ffffff" text-anchor="middle">Evolution API (WhatsApp) ✨</text>
          <text x="870" y="175" font-family="Inter" font-size="7" fill="#a7f3d0" text-anchor="middle">Mensagens Transacionais via WhatsApp REST</text>
          <text x="870" y="188" font-family="Inter" font-size="7" fill="#cbd5e1" text-anchor="middle">POST /message/sendText/{instance} + wa.me fallback</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="760" y="208" width="235" height="55" rx="5" fill="#475569" stroke="#7c3aed" stroke-width="1.8"/>
          <text x="870" y="226" font-family="Inter" font-size="10.5" font-weight="700" fill="#ffffff" text-anchor="middle">Resend API (@react-email) ✨</text>
          <text x="870" y="238" font-family="Inter" font-size="7" fill="#c4b5fd" text-anchor="middle">E-mails Transacionais com Render Responsivo</text>
          <text x="870" y="251" font-family="Inter" font-size="7" fill="#cbd5e1" text-anchor="middle">POST https://api.resend.com/emails</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="760" y="271" width="235" height="55" rx="5" fill="#475569" stroke="#14b8a6" stroke-width="1.5"/>
          <text x="870" y="289" font-family="Inter" font-size="10.5" font-weight="700" fill="#ffffff" text-anchor="middle">Supabase Platform</text>
          <text x="870" y="301" font-family="Inter" font-size="7" fill="#5eead4" text-anchor="middle">PostgreSQL + Auth Clientes/RBAC + Storage</text>
          <text x="870" y="314" font-family="Inter" font-size="7" fill="#cbd5e1" text-anchor="middle">Conexão TLS via Supabase JavaScript SDK</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="760" y="334" width="235" height="50" rx="5" fill="#475569"/>
          <text x="870" y="352" font-family="Inter" font-size="10.5" font-weight="700" fill="#ffffff" text-anchor="middle">ViaCEP API</text>
          <text x="870" y="364" font-family="Inter" font-size="7" fill="#fde047" text-anchor="middle">Consulta de CEP com sanitização e timeout seguro</text>
          <text x="870" y="375" font-family="Inter" font-size="7" fill="#cbd5e1" text-anchor="middle">GET https://viacep.com.br/ws/{cep}/json</text>
        </g>

        <!-- RELACIONAMENTOS -->
        <path d="M 150 145 L 192 145" stroke="#0284c7" stroke-width="1.8" fill="none" marker-end="url(#arrow-blue)"/>
        <path d="M 430 145 L 462 145" stroke="#0284c7" stroke-width="1.8" fill="none" marker-end="url(#arrow-blue)"/>
        <rect x="435" y="128" width="25" height="15" rx="3" fill="#ffffff" stroke="#0284c7"/>
        <text x="447" y="139" font-family="Inter" font-size="7" fill="#0284c7" text-anchor="middle" font-weight="700">JSON</text>

        <path d="M 465 340 L 433 340" stroke="#0f766e" stroke-width="1.8" fill="none" marker-end="url(#arrow)"/>
        <rect x="439" y="324" width="25" height="15" rx="3" fill="#ffffff" stroke="#0f766e"/>
        <text x="451" y="335" font-family="Inter" font-size="7" fill="#0f766e" text-anchor="middle" font-weight="700">SQL</text>

        <!-- Backend -> Dimona -->
        <path d="M 720 70 L 755 55" stroke="#16a34a" stroke-width="1.8" fill="none" marker-end="url(#arrow-green)"/>
        <!-- Backend -> MP -->
        <path d="M 720 120 L 755 115" stroke="#0ea5e9" stroke-width="1.6" fill="none" marker-end="url(#arrow)"/>
        <!-- Backend -> Evolution WhatsApp -->
        <path d="M 720 175 L 755 175" stroke="#059669" stroke-width="2" fill="none" marker-end="url(#arrow-wa)"/>
        <!-- Backend -> Resend Email -->
        <path d="M 720 235 L 755 235" stroke="#7c3aed" stroke-width="1.8" fill="none" marker-end="url(#arrow-email)"/>
        <!-- Backend -> Supabase -->
        <path d="M 720 295 L 755 295" stroke="#14b8a6" stroke-width="1.6" fill="none" marker-end="url(#arrow)"/>
        <!-- Backend -> ViaCEP -->
        <path d="M 720 355 L 755 355" stroke="#475569" stroke-width="1.5" stroke-dasharray="3 3" fill="none" marker-end="url(#arrow)"/>
      </svg>
    </div>

    <div class="footer">
      <div>Munaya Rocks E-Commerce Architecture • Modelagem C4 com Novas Integrações (WhatsApp, Resend & Dimona Webhook)</div>
      <div>Página 2 de 4</div>
    </div>
  </div>


  <!-- ========================================================================= -->
  <!-- PÁGINA 3: C4 NÍVEL 3 — COMPONENTES DA API & FLUXO DE FULFILLMENT          -->
  <!-- ========================================================================= -->
  <div class="page">
    <div class="header">
      <div class="brand-title">
        <span class="badge-c4">C4 Nível 3</span>
        <span class="badge-feat">✨ Componentes & Pipeline</span>
        <div class="title-group">
          <h1>Munaya E-Commerce — Componentes da API e Pipeline de Notificações</h1>
          <p>Estrutura dos controladores, webhooks bidirecionais, disparadores transacionais e conexão fabril</p>
        </div>
      </div>
      <div class="doc-meta">
        <div><strong>Pipeline:</strong> Pedido ➔ Pix ➔ Confirmação ➔ Dimona ➔ Rastreio ➔ Notificação</div>
        <div><strong>Disparadores:</strong> WhatsApp & E-mail Automáticos</div>
      </div>
    </div>

    <div class="diagram-container">
      <div class="legend-bar">
        <div class="legend-item"><span class="legend-color" style="background:#0284c7;"></span> <strong>Route Handlers & Webhooks</strong> (Controladores)</div>
        <div class="legend-item"><span class="legend-color" style="background:#1e293b; border: 1.5px solid #38bdf8;"></span> <strong>Core Services</strong> (Negócio)</div>
        <div class="legend-item"><span class="legend-color" style="background:#059669;"></span> <strong>Módulos de Mensageria</strong> (WhatsApp/Email)</div>
        <div class="legend-item"><span class="legend-color" style="background:#16a34a;"></span> <strong>Fulfillment Dimona</strong></div>
        <div class="legend-item"><span class="legend-color" style="background:#475569;"></span> <strong>Sistemas Externos</strong></div>
      </div>

      <svg class="svg-canvas" viewBox="0 0 1020 440" xmlns="http://www.w3.org/2000/svg">
        <!-- BOUNDARY: APP ROUTER -->
        <rect x="15" y="15" width="715" height="402" rx="10" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 4"/>
        <text x="30" y="32" font-family="Inter" font-size="9.5" font-weight="700" fill="#475569">COMPONENTES INTERNOS DA API & CAMADA DE SERVIÇOS [Next.js App Router]</text>

        <!-- COLUNA 1: ROUTE HANDLERS & WEBHOOKS (Entradas HTTP) -->
        <g filter="url(#shadow)">
          <rect x="30" y="45" width="165" height="68" rx="6" fill="#0284c7"/>
          <text x="112" y="65" font-family="Inter" font-size="10.5" font-weight="700" fill="#ffffff" text-anchor="middle">Checkout Controller</text>
          <text x="112" y="78" font-family="JetBrains Mono" font-size="7" fill="#e0f2fe" text-anchor="middle">POST /api/checkout</text>
          <text x="112" y="92" font-family="Inter" font-size="7" fill="#bae6fd" text-anchor="middle">Recalcula totais + Cria Pix MP</text>
          <text x="112" y="103" font-family="Inter" font-size="7" fill="#a7f3d0" text-anchor="middle">Dispara WhatsApp & E-mail Pix</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="30" y="122" width="165" height="62" rx="6" fill="#0284c7"/>
          <text x="112" y="141" font-family="Inter" font-size="10.5" font-weight="700" fill="#ffffff" text-anchor="middle">Shipping Controller</text>
          <text x="112" y="154" font-family="JetBrains Mono" font-size="7" fill="#e0f2fe" text-anchor="middle">POST /api/shipping</text>
          <text x="112" y="168" font-family="Inter" font-size="7" fill="#bae6fd" text-anchor="middle">Cotação Dimona + ViaCEP</text>
          <text x="112" y="179" font-family="Inter" font-size="7" fill="#bae6fd" text-anchor="middle">Rate Limited (30 req/min)</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="30" y="193" width="165" height="75" rx="6" fill="#0284c7"/>
          <text x="112" y="213" font-family="Inter" font-size="10" font-weight="700" fill="#ffffff" text-anchor="middle">MP Webhook Handler</text>
          <text x="112" y="226" font-family="JetBrains Mono" font-size="6.5" fill="#e0f2fe" text-anchor="middle">POST /api/webhooks/mercadopago</text>
          <text x="112" y="240" font-family="Inter" font-size="7" fill="#a7f3d0" text-anchor="middle">1. Valida HMAC-SHA256</text>
          <text x="112" y="251" font-family="Inter" font-size="7" fill="#a7f3d0" text-anchor="middle">2. Despacha ordem à Dimona</text>
          <text x="112" y="262" font-family="Inter" font-size="7" fill="#a7f3d0" text-anchor="middle">3. Dispara WhatsApp de Aprovado</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="30" y="277" width="165" height="72" rx="6" fill="#0284c7" stroke="#16a34a" stroke-width="1.8"/>
          <text x="112" y="296" font-family="Inter" font-size="10" font-weight="700" fill="#ffffff" text-anchor="middle">Dimona Webhook ✨</text>
          <text x="112" y="309" font-family="JetBrains Mono" font-size="6.5" fill="#e0f2fe" text-anchor="middle">POST /api/webhooks/dimona</text>
          <text x="112" y="323" font-family="Inter" font-size="7" fill="#86efac" text-anchor="middle">1. Ingestão de Rastreio Fabril</text>
          <text x="112" y="334" font-family="Inter" font-size="7" fill="#86efac" text-anchor="middle">2. Dispara WhatsApp com Link</text>
          <text x="112" y="344" font-family="Inter" font-size="7" fill="#86efac" text-anchor="middle">3. Dispara OrderShippedEmail</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="30" y="357" width="165" height="50" rx="6" fill="#0284c7"/>
          <text x="112" y="375" font-family="Inter" font-size="9.5" font-weight="700" fill="#ffffff" text-anchor="middle">Account & Admin API</text>
          <text x="112" y="388" font-family="JetBrains Mono" font-size="6.5" fill="#e0f2fe" text-anchor="middle">/account/orders, /admin/audit</text>
          <text x="112" y="399" font-family="Inter" font-size="7" fill="#bae6fd" text-anchor="middle">Autenticação RBAC e Auditoria</text>
        </g>

        <!-- COLUNA 2: CORE BUSINESS SERVICES & DISPATCHERS -->
        <g filter="url(#shadow)">
          <rect x="225" y="45" width="155" height="78" rx="6" fill="#1e293b" stroke="#0ea5e9" stroke-width="1.5"/>
          <text x="302" y="65" font-family="Inter" font-size="10" font-weight="700" fill="#ffffff" text-anchor="middle">MercadoPago Service</text>
          <text x="302" y="77" font-family="JetBrains Mono" font-size="7" fill="#38bdf8" text-anchor="middle">src/lib/mercadopago.ts</text>
          <text x="302" y="93" font-family="Inter" font-size="7" fill="#cbd5e1" text-anchor="middle">• createMercadoPagoPixOrder</text>
          <text x="302" y="105" font-family="Inter" font-size="7" fill="#cbd5e1" text-anchor="middle">• mp-webhook-auth (HMAC)</text>
          <text x="302" y="117" font-family="Inter" font-size="7" fill="#38bdf8" text-anchor="middle">Orders API v2</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="225" y="132" width="155" height="108" rx="6" fill="#1e293b" stroke="#16a34a" stroke-width="1.8"/>
          <text x="302" y="152" font-family="Inter" font-size="10" font-weight="700" fill="#ffffff" text-anchor="middle">Dimona POD Service</text>
          <text x="302" y="164" font-family="JetBrains Mono" font-size="7" fill="#86efac" text-anchor="middle">src/lib/dimona.ts</text>
          <text x="302" y="179" font-family="Inter" font-size="7" fill="#cbd5e1" text-anchor="middle">• createDimonaOrder</text>
          <text x="302" y="191" font-family="Inter" font-size="7" fill="#cbd5e1" text-anchor="middle">• calculateDimonaShipping</text>
          <text x="302" y="204" font-family="Inter" font-size="7" fill="#86efac" text-anchor="middle">• dimona-mapping.ts (Blanks)</text>
          <text x="302" y="216" font-family="Inter" font-size="7" fill="#cbd5e1" text-anchor="middle">• artworks.ts (PNG 300 DPI)</text>
          <text x="302" y="230" font-family="Inter" font-size="7" fill="#86efac" text-anchor="middle">Trava Financeira Prévia</text>
        </g>

        <!-- NOVO: Módulo WhatsApp Evolution -->
        <g filter="url(#shadow)">
          <rect x="225" y="250" width="155" height="80" rx="6" fill="#064e3b" stroke="#059669" stroke-width="2"/>
          <text x="302" y="270" font-family="Inter" font-size="10" font-weight="800" fill="#a7f3d0" text-anchor="middle">WhatsApp Service ✨</text>
          <text x="302" y="282" font-family="JetBrains Mono" font-size="7" fill="#ffffff" text-anchor="middle">src/lib/whatsapp.ts</text>
          <text x="302" y="297" font-family="Inter" font-size="7" fill="#ccfbf1">• sendOrderCreatedWhatsApp</text>
          <text x="302" y="309" font-family="Inter" font-size="7" fill="#ccfbf1">• sendPaymentConfirmedWhatsApp</text>
          <text x="302" y="321" font-family="Inter" font-size="7" fill="#a7f3d0">• sendOrderShippedWhatsApp (Link)</text>
        </g>

        <!-- NOVO: Módulo Resend Email -->
        <g filter="url(#shadow)">
          <rect x="225" y="338" width="155" height="70" rx="6" fill="#2e1065" stroke="#7c3aed" stroke-width="1.8"/>
          <text x="302" y="356" font-family="Inter" font-size="10" font-weight="800" fill="#c4b5fd" text-anchor="middle">Email Service (@react-email) ✨</text>
          <text x="302" y="368" font-family="JetBrains Mono" font-size="7" fill="#ffffff" text-anchor="middle">src/lib/email.ts</text>
          <text x="302" y="383" font-family="Inter" font-size="7" fill="#ede9fe">• OrderCreated & PaymentConfirmed</text>
          <text x="302" y="395" font-family="Inter" font-size="7" fill="#c4b5fd">• OrderShippedEmail com Rastreio</text>
        </g>

        <!-- COLUNA 3: DATA, AUDIT & RULES -->
        <g filter="url(#shadow)">
          <rect x="415" y="90" width="145" height="110" rx="6" fill="#042f2e" stroke="#0f766e" stroke-width="1.5"/>
          <text x="487" y="112" font-family="Inter" font-size="10" font-weight="700" fill="#ffffff" text-anchor="middle">Database Service</text>
          <text x="487" y="125" font-family="JetBrains Mono" font-size="7" fill="#5eead4" text-anchor="middle">supabase.ts & audit.ts</text>
          <text x="487" y="142" font-family="Inter" font-size="7" fill="#ccfbf1">• saveDatabaseOrder</text>
          <text x="487" y="155" font-family="Inter" font-size="7" fill="#ccfbf1">• logAuditEvent (RBAC)</text>
          <text x="487" y="168" font-family="Inter" font-size="7" fill="#ccfbf1">• Service Role Key Privada</text>
          <text x="487" y="181" font-family="Inter" font-size="7" fill="#ccfbf1">• Políticas de RLS</text>
          <text x="487" y="194" font-family="Inter" font-size="7" fill="#5eead4" text-anchor="middle">PostgreSQL Seguro</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="415" y="215" width="145" height="95" rx="6" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5"/>
          <text x="487" y="236" font-family="Inter" font-size="10" font-weight="700" fill="#ffffff" text-anchor="middle">Rules & Pricing Engine</text>
          <text x="487" y="249" font-family="JetBrains Mono" font-size="7" fill="#fde047" text-anchor="middle">coupons.ts & pricing.ts</text>
          <text x="487" y="266" font-family="Inter" font-size="7" fill="#cbd5e1">• validateCouponCode</text>
          <text x="487" y="279" font-family="Inter" font-size="7" fill="#cbd5e1">• calculateItemPricing</text>
          <text x="487" y="292" font-family="Inter" font-size="7" fill="#cbd5e1">• Descontos % e Frete Grátis</text>
          <text x="487" y="304" font-family="Inter" font-size="7" fill="#fde047" text-anchor="middle">Margem de Lucro Garantida</text>
        </g>

        <!-- DESTINOS EXTERNOS (Direita) -->
        <g filter="url(#shadow)">
          <rect x="745" y="45" width="255" height="60" rx="6" fill="#334155" stroke="#0ea5e9" stroke-width="1.5"/>
          <text x="872" y="66" font-family="Inter" font-size="10.5" font-weight="700" fill="#ffffff" text-anchor="middle">Mercado Pago Orders API</text>
          <text x="872" y="80" font-family="Inter" font-size="7.5" fill="#38bdf8" text-anchor="middle">Ordens Pix dinâmicas + IPN instantâneo</text>
          <text x="872" y="93" font-family="Inter" font-size="7" fill="#cbd5e1" text-anchor="middle">Validação de assinatura HMAC-SHA256</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="745" y="115" width="255" height="75" rx="6" fill="#334155" stroke="#16a34a" stroke-width="2"/>
          <text x="872" y="137" font-family="Inter" font-size="10.5" font-weight="700" fill="#ffffff" text-anchor="middle">Dimona API v2 (Fábrica POD)</text>
          <text x="872" y="151" font-family="Inter" font-size="7.5" fill="#86efac" text-anchor="middle">Recepção de Ordens e Disparo de Webhook</text>
          <text x="872" y="165" font-family="Inter" font-size="7" fill="#cbd5e1" text-anchor="middle">Envio de artes HD e dados postais ao operador</text>
          <text x="872" y="178" font-family="Inter" font-size="7" fill="#86efac" text-anchor="middle">Disparo de Webhook com código dos Correios</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="745" y="200" width="255" height="65" rx="6" fill="#064e3b" stroke="#059669" stroke-width="2"/>
          <text x="872" y="222" font-family="Inter" font-size="10.5" font-weight="800" fill="#a7f3d0" text-anchor="middle">Evolution API (WhatsApp Gateway) ✨</text>
          <text x="872" y="236" font-family="Inter" font-size="7.5" fill="#ffffff" text-anchor="middle">Instância dedicada para alertas automáticos</text>
          <text x="872" y="249" font-family="Inter" font-size="7" fill="#ccfbf1" text-anchor="middle">Entrega de Pix, recibo de pagamento e rastreio</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="745" y="275" width="255" height="65" rx="6" fill="#2e1065" stroke="#7c3aed" stroke-width="1.8"/>
          <text x="872" y="297" font-family="Inter" font-size="10.5" font-weight="800" fill="#c4b5fd" text-anchor="middle">Resend Cloud (E-mail API) ✨</text>
          <text x="872" y="311" font-family="Inter" font-size="7.5" fill="#ffffff" text-anchor="middle">Entrega SMTP/REST com alta entregabilidade</text>
          <text x="872" y="324" font-family="Inter" font-size="7" fill="#ede9fe" text-anchor="middle">Layout responsivo Dark Mode com @react-email</text>
        </g>

        <g filter="url(#shadow)">
          <rect x="745" y="350" width="255" height="58" rx="6" fill="#042f2e" stroke="#14b8a6" stroke-width="1.5"/>
          <text x="872" y="371" font-family="Inter" font-size="10.5" font-weight="700" fill="#ffffff" text-anchor="middle">Supabase PostgreSQL & CDN</text>
          <text x="872" y="384" font-family="Inter" font-size="7.5" fill="#5eead4" text-anchor="middle">Persistência relacional de pedidos, cupons e trilha</text>
          <text x="872" y="396" font-family="Inter" font-size="7" fill="#ccfbf1" text-anchor="middle">Tabela 'orders' atualizada a cada webhook</text>
        </g>

        <!-- LIGAÇÕES E PIPELINE -->
        <!-- Checkout -> MP Service -->
        <path d="M 195 80 L 225 80" stroke="#0284c7" stroke-width="1.8" fill="none" marker-end="url(#arrow-blue)"/>
        <!-- MP Service -> MP API -->
        <path d="M 380 80 L 738 75" stroke="#0ea5e9" stroke-width="1.8" fill="none" marker-end="url(#arrow)"/>

        <!-- Checkout -> WhatsApp (Pix) -->
        <path d="M 195 95 L 225 270" stroke="#059669" stroke-width="1.8" fill="none" marker-end="url(#arrow-wa)"/>

        <!-- MP Webhook -> Dimona Service (Ordem paga) -->
        <path d="M 195 230 L 225 185" stroke="#16a34a" stroke-width="2" fill="none" marker-end="url(#arrow-green)"/>
        <!-- MP Webhook -> WhatsApp (Aprovado) -->
        <path d="M 195 245 L 225 285" stroke="#059669" stroke-width="1.8" fill="none" marker-end="url(#arrow-wa)"/>

        <!-- Dimona Service -> Dimona API -->
        <path d="M 380 160 L 738 150" stroke="#16a34a" stroke-width="2" fill="none" marker-end="url(#arrow-green)"/>

        <!-- Dimona Webhook -> Supabase Service (Grava Rastreio) -->
        <path d="M 195 315 L 415 150" stroke="#0f766e" stroke-width="1.8" fill="none" marker-end="url(#arrow)"/>
        <!-- Dimona Webhook -> WhatsApp (Rastreio) -->
        <path d="M 195 325 L 225 310" stroke="#059669" stroke-width="2" fill="none" marker-end="url(#arrow-wa)"/>
        <!-- Dimona Webhook -> Email Service (Rastreio) -->
        <path d="M 195 335 L 225 365" stroke="#7c3aed" stroke-width="1.8" fill="none" marker-end="url(#arrow-email)"/>

        <!-- WhatsApp Service -> Evolution API -->
        <path d="M 380 290 L 738 235" stroke="#059669" stroke-width="2" fill="none" marker-end="url(#arrow-wa)"/>
        <!-- Email Service -> Resend API -->
        <path d="M 380 375 L 738 310" stroke="#7c3aed" stroke-width="1.8" fill="none" marker-end="url(#arrow-email)"/>
        <!-- Database Service -> Supabase -->
        <path d="M 560 145 L 738 375" stroke="#14b8a6" stroke-width="1.8" fill="none" marker-end="url(#arrow)"/>
      </svg>
    </div>

    <div class="footer">
      <div>Munaya Rocks E-Commerce Architecture • Modelagem C4 com Novas Integrações (WhatsApp, Resend & Dimona Webhook)</div>
      <div>Página 3 de 4</div>
    </div>
  </div>


  <!-- ========================================================================= -->
  <!-- PÁGINA 4: MATRIZ DE CONEXÕES & PIPELINE MULTICANAL                        -->
  <!-- ========================================================================= -->
  <div class="page">
    <div class="header">
      <div class="brand-title">
        <span class="badge-c4">C4 Nível 4 / Matriz</span>
        <span class="badge-feat">✨ Matriz de Conexões Externas</span>
        <div class="title-group">
          <h1>Matriz Técnica de Conexões Externas & Ciclo de Notificação</h1>
          <p>Especificações de protocolos, autenticação, tolerância a falhas e pipeline automatizado multicanal</p>
        </div>
      </div>
      <div class="doc-meta">
        <div><strong>Padrão:</strong> REST / Webhooks / HMAC-SHA256</div>
        <div><strong>Status:</strong> Produção Hardened & Conectada</div>
      </div>
    </div>

    <div class="diagram-container">
      <table class="spec-table">
        <thead>
          <tr>
            <th style="width: 14%;">Sistema Externo</th>
            <th style="width: 17%;">Responsabilidade</th>
            <th style="width: 9%;">Protocolo</th>
            <th style="width: 14%;">Autenticação</th>
            <th style="width: 25%;">Endpoints & Operações Utilizadas</th>
            <th style="width: 21%;">Tratamento de Falha / Resiliência</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Camisa Dimona</strong><br>
              <span class="badge-ext">Fulfillment POD</span>
            </td>
            <td>Confecção sob demanda DTG, estampa, embalagem, frete fabril e despacho postal.</td>
            <td>HTTPS / REST<br><span class="code">TCP 443</span></td>
            <td>API Key via Header<br><span class="code">Bearer DIMONA_API_KEY</span></td>
            <td>
              • <span class="code">POST /api/v2/frete</span> (Cotação PAC/SEDEX)<br>
              • <span class="code">POST /api/v2/pedidos</span> (Envio de ordem de produção)<br>
              • <span class="code">POST /api/webhooks/dimona</span> (Ingestão de rastreio)
            </td>
            <td>Trava de despacho sem confirmação de pagamento; modo sandbox com simulação caso chave não configurada.</td>
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
              • <span class="code">POST /v1/orders</span> (Criação de ordem Pix)<br>
              • <span class="code">GET /v1/orders/{id}</span> (Consulta status)<br>
              • <span class="code">POST /api/webhooks/mercadopago</span> (Inbound)
            </td>
            <td>Assinatura criptográfica HMAC-SHA256 (<span class="code">x-signature</span>); processamento idempotente por <span class="code">external_reference</span>.</td>
          </tr>
          <tr>
            <td>
              <strong>Evolution API</strong><br>
              <span class="badge-new">✨ WhatsApp Bot</span>
            </td>
            <td>Mensageria transacional ativa via WhatsApp: Pix Copia e Cola, confirmação e rastreio.</td>
            <td>HTTPS / REST<br><span class="code">TCP 443</span></td>
            <td>API Key via Header<br><span class="code">apikey: {evolution_key}</span></td>
            <td>
              • <span class="code">POST /message/sendText/{instance}</span><br>
              • Config dinâmica em <span class="code">private-config/evolution.json</span><br>
              • Painel em <span class="code">/admin/whatsapp</span>
            </td>
            <td>Fallback automático para links diretos <span class="code">wa.me</span>; fila não bloqueante; deduplicação por cache em memória.</td>
          </tr>
          <tr>
            <td>
              <strong>Resend API</strong><br>
              <span class="badge-new">✨ E-mail @react-email</span>
            </td>
            <td>Envio de e-mails transacionais com design responsivo Dark Mode Rockwear.</td>
            <td>HTTPS / REST<br><span class="code">TCP 443</span></td>
            <td>API Key via Header<br><span class="code">Bearer RESEND_API_KEY</span></td>
            <td>
              • <span class="code">POST https://api.resend.com/emails</span><br>
              Templates: <span class="code">OrderCreated</span>, <span class="code">PaymentConfirmed</span>, <span class="code">OrderShipped</span>, <span class="code">PasswordReset</span>
            </td>
            <td>Render assíncrono isolado; falhas no e-mail não travam o webhook nem o fluxo principal de compra.</td>
          </tr>
          <tr>
            <td>
              <strong>Supabase Cloud</strong><br>
              <span class="badge-in">Data & Auth</span>
            </td>
            <td>PostgreSQL relacional, Auth de clientes/administradores (RBAC) e Storage CDN.</td>
            <td>HTTPS / WSS<br><span class="code">TCP 443 / 5432</span></td>
            <td>Anon Key (Browser)<br>Service Role (Server)</td>
            <td>
              • Tabelas: <span class="code">products</span>, <span class="code">blanks</span>, <span class="code">orders</span>, <span class="code">customers</span>, <span class="code">coupons</span>, <span class="code">audit_logs</span><br>
              • Supabase Auth com sessões JWT e RLS ativo
            </td>
            <td>Segregação estrita de chaves; políticas de Row Level Security; reconexão automática com retry.</td>
          </tr>
          <tr>
            <td>
              <strong>ViaCEP</strong><br>
              <span class="badge-ext">Geolocalização</span>
            </td>
            <td>Resolução instantânea de logradouro, bairro e UF a partir do CEP.</td>
            <td>HTTPS / REST<br><span class="code">TCP 443</span></td>
            <td>Pública / Sem Auth</td>
            <td>• <span class="code">GET https://viacep.com.br/ws/{cep}/json/</span></td>
            <td>Sanitização de CEP (8 dígitos numéricos); se a API falhar, o cliente preenche o endereço manualmente.</td>
          </tr>
        </tbody>
      </table>

      <!-- PIPELINE MULTICANAL DE 5 ETAPAS -->
      <div class="sec-grid">
        <div class="sec-card">
          <h4>01. Pedido Criado</h4>
          <p>Cliente fecha no checkout ➔ Mercado Pago gera Pix dinâmico ➔ <strong>Disparo de WhatsApp e E-mail</strong> com código Copia e Cola instantâneo.</p>
        </div>
        <div class="sec-card green">
          <h4>02. Pix Liquidado</h4>
          <p>Banco liquida ➔ Webhook MP validado via HMAC-SHA256 ➔ <strong>WhatsApp e E-mail de confirmação</strong> enviados ao cliente em segundos.</p>
        </div>
        <div class="sec-card green">
          <h4>03. Despacho POD</h4>
          <p>Munaya aciona a API v2 da Dimona com SKU, malha/cor do Blank, arte 300 DPI e mockup de conferência ➔ Fábrica inicia confecção DTG.</p>
        </div>
        <div class="sec-card amber">
          <h4>04. Rastreio Dimona</h4>
          <p>Dimona despacha Correios/Jadlog ➔ Dispara webhook para <span class="code">/api/webhooks/dimona</span> ➔ Código e link gravados no Supabase.</p>
        </div>
        <div class="sec-card">
          <h4>05. Alerta de Envio</h4>
          <p>Munaya dispara <strong>WhatsApp e E-mail automáticos</strong> com link de rastreamento clicável para o cliente acompanhar a entrega.</p>
        </div>
      </div>

      <div class="notes-box">
        <strong>Conformidade e Regras com Fornecedores:</strong>
        As especificações de produção fabril (Blank, Arte PNG 300 DPI e Mockup de conferência), bem como os prazos de garantia e devoluções, seguem as diretrizes estabelecidas em <span class="code">docs/fornecedores.md</span>. O ecossistema garante rastreabilidade 100% automatizada ponta a ponta.
      </div>
    </div>

    <div class="footer">
      <div>Munaya Rocks E-Commerce Architecture • Modelagem C4 com Novas Integrações (WhatsApp, Resend & Dimona Webhook)</div>
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

    print(f"Gerando PDF atualizado através do Playwright e Microsoft Edge...")
    
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
