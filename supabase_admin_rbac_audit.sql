-- ==============================================================================
-- 🎸 MUNAYA ROCKS - MIGRAÇÃO OFICIAL: RBAC & LOGS DE AUDITORIA
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/jaxxkyvsgasgaccbejln/sql
-- ==============================================================================

-- 1. TABELA DE USUÁRIOS ADMINISTRATIVOS & OPERADORES (RBAC)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'operator', -- 'super_admin' | 'operator' | 'viewer'
    password_hash TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Apenas service_role gerencia admin_users" ON public.admin_users;
CREATE POLICY "Apenas service_role gerencia admin_users"
ON public.admin_users FOR ALL
USING (auth.role() = 'service_role');

-- 2. TABELA DE LOGS DE AUDITORIA (TRILHA IMUTÁVEL DE COMPLIANCE)
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_email TEXT NOT NULL,
    action TEXT NOT NULL,       -- 'price_update', 'markup_apply', 'dimona_dispatch', 'coupon_create', etc.
    entity TEXT NOT NULL,       -- 'pricing', 'orders', 'products', 'coupons', 'auth'
    entity_id TEXT,
    payload_diff JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para buscas rápidas no painel de auditoria
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON public.admin_audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.admin_audit_logs(entity);

-- Habilitar RLS (Somente backend / service_role pode gravar e consultar)
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Apenas service_role gerencia audit_logs" ON public.admin_audit_logs;
CREATE POLICY "Apenas service_role gerencia audit_logs"
ON public.admin_audit_logs FOR ALL
USING (auth.role() = 'service_role');

-- 3. USUÁRIOS ADMINISTRATIVOS PADRÃO (SEEDS INICIAIS)
INSERT INTO public.admin_users (id, email, name, role, is_active)
VALUES 
    ('adm_super_01', 'admin@munayarocks.com.br', 'Super Admin Munaya', 'super_admin', true),
    ('adm_op_01', 'operador@munayarocks.com.br', 'Operador de Pedidos', 'operator', true),
    ('adm_view_01', 'viewer@munayarocks.com.br', 'Auditor Visualizador', 'viewer', true)
ON CONFLICT (email) DO UPDATE SET
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
