-- ==============================================================================
-- 🎸 MUNAYA ROCKS - MIGRAÇÃO OFICIAL: CARRINHOS E CHECKOUTS ABANDONADOS
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/jaxxkyvsgasgaccbejln/sql
-- ==============================================================================

-- 1. TABELA DE CARRINHOS & CHECKOUTS ABANDONADOS
CREATE TABLE IF NOT EXISTS public.abandoned_checkouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    order_id TEXT, -- Vinculado se gerou Pix em public.orders
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    customer_cpf TEXT,
    zipcode TEXT,
    street TEXT,
    number TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    cart_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    shipping_amount NUMERIC(10, 2) DEFAULT 0.00,
    shipping_carrier TEXT,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    recovery_token TEXT UNIQUE NOT NULL,
    coupon_code TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'abandoned', 'first_alert_sent', 'second_alert_sent', 'recovered', 'expired')),
    first_alert_sent_at TIMESTAMPTZ,
    second_alert_sent_at TIMESTAMPTZ,
    recovered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de Performance para a Cron Job do Vercel e Buscas
CREATE INDEX IF NOT EXISTS idx_abandoned_checkouts_cron 
ON public.abandoned_checkouts (status, updated_at) 
WHERE status IN ('draft', 'abandoned', 'first_alert_sent');

CREATE INDEX IF NOT EXISTS idx_abandoned_recovery_token 
ON public.abandoned_checkouts (recovery_token);

CREATE INDEX IF NOT EXISTS idx_abandoned_phone 
ON public.abandoned_checkouts (customer_phone);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.abandoned_checkouts ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
DROP POLICY IF EXISTS "Inserção e atualização pública de rascunhos" ON public.abandoned_checkouts;
CREATE POLICY "Inserção e atualização pública de rascunhos" 
ON public.abandoned_checkouts FOR ALL 
USING (true) 
WITH CHECK (true);

-- 2. CADASTRO DO CUPOM OFICIAL DE RESGATE (VOLTA5)
INSERT INTO public.coupons (code, type, value, min_subtotal, description, is_active, expires_at)
VALUES 
    ('VOLTA5', 'percentage', 5.00, 0.00, '5% OFF de resgate exclusivo para finalizar seu pedido', true, NULL)
ON CONFLICT (code) DO NOTHING;
