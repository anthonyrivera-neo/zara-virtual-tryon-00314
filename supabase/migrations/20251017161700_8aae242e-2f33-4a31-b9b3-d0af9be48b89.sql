-- Crear bucket de storage para fotos de usuarios
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-photos', 'user-photos', true);

-- Políticas de storage para user-photos
CREATE POLICY "Anyone can upload user photos"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'user-photos');

CREATE POLICY "Anyone can view user photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-photos');

-- Crear bucket para simulaciones (resultados)
INSERT INTO storage.buckets (id, name, public)
VALUES ('simulations', 'simulations', true);

-- Políticas de storage para simulaciones
CREATE POLICY "Anyone can view simulations"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'simulations');

CREATE POLICY "Anyone can upload simulations"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'simulations');

-- Tabla de simulaciones mock (mapeo producto -> resultado)
CREATE TABLE public.simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  product_url TEXT NOT NULL,
  result_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para tabla simulations
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read simulations"
ON public.simulations FOR SELECT
TO public
USING (true);

-- Tabla para guardar resultados de usuarios con feedback
CREATE TABLE public.user_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_photo_url TEXT NOT NULL,
  product_url TEXT NOT NULL,
  product_name TEXT NOT NULL,
  result_url TEXT NOT NULL,
  feedback TEXT CHECK (feedback IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para tabla user_results
ALTER TABLE public.user_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert user results"
ON public.user_results FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Anyone can view user results"
ON public.user_results FOR SELECT
TO public
USING (true);

-- Insertar datos de ejemplo para simulaciones mock
INSERT INTO public.simulations (product_name, product_url, result_url) VALUES
  ('Camiseta Básica', 'product-tshirt', 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'),
  ('Chaqueta de Cuero', 'product-jacket', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800'),
  ('Abrigo Elegante', 'product-coat', 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=800');