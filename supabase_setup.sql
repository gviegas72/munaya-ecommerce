-- ==============================================================================
-- 🎸 MUNAYA ROCKS - SCHEMA OFICIAL DE CATÁLOGO E PEDIDOS (SUPABASE)
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/jaxxkyvsgasgaccbejln/sql
-- ==============================================================================

-- 1. TABELA DE PRODUTOS / CATÁLOGO
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    subtitle TEXT,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 119.00,
    compare_at_price NUMERIC(10, 2),
    image_url TEXT NOT NULL,
    images JSONB DEFAULT '[]'::jsonb,
    artwork_url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 10,
    badge TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE PEDIDOS
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY, -- ex: 'MNY-3351'
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_cpf TEXT NOT NULL,
    customer_phone TEXT,
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    complement TEXT,
    neighborhood TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zipcode TEXT NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    shipping_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    shipping_carrier TEXT,
    shipping_eta TEXT,
    payment_method TEXT NOT NULL DEFAULT 'pix',
    payment_status TEXT NOT NULL DEFAULT 'aguardando_pagamento',
    mp_order_id TEXT,
    dimona_id TEXT,
    dimona_status TEXT DEFAULT 'pendente',
    tracking_code TEXT,
    tracking_url TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABELA DE CUPONS PROMOCIONAIS & DESCONTOS
CREATE TABLE IF NOT EXISTS public.coupons (
    code TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed', 'free_shipping'
    value NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
    min_subtotal NUMERIC(10, 2) DEFAULT 0.00,
    description TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    expires_at TIMESTAMPTZ, -- null = perene (sem validade)
    max_uses INTEGER, -- null = ilimitado
    used_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilita Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso para Cupons:
DROP POLICY IF EXISTS "Leitura pública de cupons ativos" ON public.coupons;
CREATE POLICY "Leitura pública de cupons ativos"
ON public.coupons FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admin gerencia cupons" ON public.coupons;
CREATE POLICY "Admin gerencia cupons"
ON public.coupons FOR ALL
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Cupons Oficiais Iniciais
INSERT INTO public.coupons (code, type, value, min_subtotal, description, is_active, expires_at)
VALUES 
    ('PRIMEIRACOMPRA', 'percentage', 10.00, 0.00, '10% de boas-vindas na sua primeira compra', true, NULL),
    ('TESTEFRETE', 'free_shipping', 100.00, 0.00, 'Cupom de Teste de Homologação (Frete Grátis R$ 0,00)', true, NULL),
    ('ROCK10', 'percentage', 10.00, 0.00, '10% de desconto em todo o catálogo', true, NULL),
    ('MUNAYAVIP', 'percentage', 15.00, 150.00, '15% de desconto VIP em compras acima de R$ 150', true, NULL),
    ('BONZO20', 'fixed', 20.00, 100.00, 'R$ 20,00 OFF em compras acima de R$ 100', true, NULL)
ON CONFLICT (code) DO NOTHING;

-- Políticas de Acesso para Produtos:
-- Leitura pública (qualquer visitante pode ver os produtos ativos na loja)
DROP POLICY IF EXISTS "Produtos visíveis publicamente" ON public.products;
CREATE POLICY "Produtos visíveis publicamente" 
ON public.products FOR SELECT 
USING (is_active = true);

-- Escrita de produtos apenas com chave de serviço (Admin)
DROP POLICY IF EXISTS "Admin gerencia produtos" ON public.products;
CREATE POLICY "Admin gerencia produtos" 
ON public.products FOR ALL 
USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Políticas de Acesso para Pedidos:
-- Inserção pública permitida durante o checkout
DROP POLICY IF EXISTS "Clientes criam pedidos" ON public.orders;
CREATE POLICY "Clientes criam pedidos" 
ON public.orders FOR INSERT 
WITH CHECK (true);

-- Leitura e atualização de pedidos via chave de serviço (backend seguro)
DROP POLICY IF EXISTS "Admin gerencia pedidos" ON public.orders;
CREATE POLICY "Admin gerencia pedidos" 
ON public.orders FOR ALL 
USING (auth.role() = 'service_role');

-- 4. TABELA DE CONFIGURAÇÕES GERAIS DA LOJA (PREÇOS, MARKUP, CUSTOS DIMONA)
CREATE TABLE IF NOT EXISTS public.store_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública de configurações" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Admin gerencia configurações" ON public.store_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ==============================================================================
-- 3. CARGA INICIAL DO CATÁLOGO MUNAYA ROCKS
-- ==============================================================================
INSERT INTO public.products (id, slug, name, subtitle, description, price, compare_at_price, image_url, artwork_url, is_active, is_featured, display_order, badge)
VALUES
(1, 'bonzo', 'Munaya Bonzo', 'Heavy Grooves · Edição Limitada', 'Camiseta 100% algodão penteado 30.1. Estampa Bonzo exclusiva Munaya em alta definição.', 119.00, 139.00, '/uploads/modelo_bonzo_01.jpg', 'https://munayarocks.vercel.app/artes/bonzo.jpg', true, true, 1, 'Destaque'),
(2, 'dimebag', 'Camiseta Dimebag', 'Visual Agressivo · Toque Zero', 'Camiseta 100% algodão preta profunda. Estampa Dimebag com visual agressivo e acabamento toque zero.', 89.90, NULL, '/uploads/DIMEBAG_camiseta.jpg', 'https://munayarocks.vercel.app/artes/dimebag.jpg', true, false, 2, NULL),
(3, 'ghost', 'Camiseta Ghost', 'Streetwear Heavy', 'Camiseta estampa Ghost. Confeccionada em algodão de alta qualidade e caimento streetwear impecável.', 89.90, NULL, '/uploads/GHOST_camiseta.jpg', 'https://munayarocks.vercel.app/artes/ghost.jpg', true, false, 3, NULL),
(4, 'cathedral', 'Camiseta Cathedral', 'Doom Metal Series', 'Camiseta estampa Cathedral. Algodão penteado com estampa em serigrafia digital de alta durabilidade.', 89.90, NULL, '/uploads/CATHEDRAL_camiseta.jpg', 'https://munayarocks.vercel.app/artes/cathedral.jpg', true, false, 4, NULL),
(5, 'amplificador', 'Camiseta Amplificador', 'Classic Vintage', 'Camiseta estampa Amplificador. Estampa clássica com arte em alta resolução e reforço de ombro a ombro.', 89.90, NULL, '/uploads/AMPLIFICADOR_camiseta.jpg', 'https://munayarocks.vercel.app/artes/amplificador.jpg', true, false, 5, NULL),
(6, 'clutch', 'Camiseta Clutch', 'Pure Rock Series', 'Camiseta estampa Clutch. Tecido macio, pré-encolhido e resistente a lavagens.', 89.90, NULL, '/uploads/CLUTCH_camiseta.jpg', 'https://munayarocks.vercel.app/artes/clutch.jpg', true, false, 6, NULL),
(7, 'soundgarden', 'Camiseta Soundgarden', 'Grunge Heritage', 'Camiseta estampa Soundgarden. Homenagem ao som de Seattle em algodão premium.', 89.90, NULL, '/uploads/SOUNDGARDEN_camiseta.jpg', 'https://munayarocks.vercel.app/artes/soundgarden.jpg', true, false, 7, NULL),
(8, 'chico', 'Camiseta Chico Science', 'Manguebeat Roots', 'Camiseta estampa Chico Science. Afrociberdelia pura em algodão 30.1 penteado.', 89.90, NULL, '/uploads/CHICO_camiseta.jpg', 'https://munayarocks.vercel.app/artes/chico.jpg', true, false, 8, NULL),
(9, 'rolling-stones', 'Camiseta Rolling Stones', 'Rock & Roll Legacy', 'Camiseta Rolling Stones. Clássico imortal com estampa vintage.', 89.90, NULL, '/uploads/ROLLING_STONES_camiseta.jpg', 'https://munayarocks.vercel.app/artes/rolling-stones.jpg', true, false, 9, NULL),
(10, 'spiritual-beggars', 'Camiseta Spiritual Beggars', 'Stoner Rock Series', 'Camiseta Spiritual Beggars. Arte gráfica psicodélica e peso sonoro.', 89.90, NULL, '/uploads/SPIRITUAL_BEGGARS_camiseta.jpg', 'https://munayarocks.vercel.app/artes/spiritualbeggars.png', true, false, 10, NULL),
(11, 'lionheart', 'Camiseta Lionheart', 'Hardcore Division', 'Camiseta Lionheart. Peso e atitude com caimento impecável.', 89.90, NULL, '/uploads/LIONHEART_camiseta.jpg', 'https://munayarocks.vercel.app/artes/lionheart.jpg', true, false, 11, NULL),
(12, 'suicidal-tendencies', 'Camiseta Suicidal Tendencies', 'Venice Hardcore', 'Camiseta Suicidal Tendencies. Estampa clássica skatepunk/hardcore.', 89.90, NULL, '/uploads/SUICIDAL_TENDENCIES_camiseta.jpg', 'https://munayarocks.vercel.app/artes/suicidal-tendencies.png', true, false, 12, NULL),
(13, '3r-arvore', 'Camiseta 3R Árvore', 'Psychedelic Organic', 'Camiseta 3R Árvore. Ilustração autoral orgânica.', 89.90, NULL, '/uploads/3R_ARVORE_camiseta.jpg', 'https://munayarocks.vercel.app/artes/3r-arvore.png', true, false, 13, NULL),
(14, 'monster-magnet', 'Camiseta Monster Magnet', 'Space Bullgod', 'Camiseta Monster Magnet. Space rock psicodélico em alta definição.', 89.90, NULL, '/uploads/MONSTER_MAGNET_camiseta.jpg', 'https://munayarocks.vercel.app/artes/monstermagnet.jpg', true, false, 14, NULL),
(15, 'coc', 'Camiseta C.O.C.', 'Corrosion of Conformity', 'Camiseta Corrosion of Conformity. Sludge e Southern metal no peito.', 89.90, NULL, '/uploads/COC_camiseta.jpg', 'https://munayarocks.vercel.app/artes/coc.jpg', true, false, 15, NULL)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    subtitle = EXCLUDED.subtitle,
    price = EXCLUDED.price,
    compare_at_price = EXCLUDED.compare_at_price,
    image_url = EXCLUDED.image_url,
    artwork_url = EXCLUDED.artwork_url,
    is_active = EXCLUDED.is_active,
    is_featured = EXCLUDED.is_featured,
    display_order = EXCLUDED.display_order,
    badge = EXCLUDED.badge;

-- ==============================================================================
-- 🎸 MIGRAÇÃO: ADIÇÃO DE SKU, CORES, TAMANHOS, TRAVA DE PREÇO E DE/PARA DIMONA
-- ==============================================================================
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sku TEXT,
ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[{"name": "Preta", "hex": "#111111", "skuCode": "PRETA"}]'::jsonb,
ADD COLUMN IF NOT EXISTS sizes JSONB DEFAULT '["PP", "P", "M", "G", "GG", "XGG"]'::jsonb,
ADD COLUMN IF NOT EXISTS is_custom_price BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS dimona_product_id TEXT,
ADD COLUMN IF NOT EXISTS blank_type TEXT DEFAULT 'classic';

-- Tabela opcional de de/para individual por variante para customizações avançadas
CREATE TABLE IF NOT EXISTS public.sku_dimona_mappings (
    id BIGSERIAL PRIMARY KEY,
    munaya_sku TEXT NOT NULL UNIQUE,
    dimona_sku TEXT NOT NULL,
    dimona_product_id TEXT,
    blank_type TEXT DEFAULT 'classic',
    factory_cost NUMERIC(10, 2) DEFAULT 42.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


