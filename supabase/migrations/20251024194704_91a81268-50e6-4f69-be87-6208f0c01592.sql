-- Crear tabla para almacenar resultados de usuarios
CREATE TABLE IF NOT EXISTS public.user_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_photo_url TEXT NOT NULL,
  product_url TEXT NOT NULL,
  product_name TEXT NOT NULL,
  result_url TEXT NOT NULL,
  feedback TEXT CHECK (feedback IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla para simulaciones (opcional, para testing)
CREATE TABLE IF NOT EXISTS public.simulations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  result_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

-- Políticas para user_results (público para insertar)
CREATE POLICY "Anyone can insert results" 
ON public.user_results 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view results" 
ON public.user_results 
FOR SELECT 
USING (true);

-- Políticas para simulations (público)
CREATE POLICY "Anyone can view simulations" 
ON public.simulations 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert simulations" 
ON public.simulations 
FOR INSERT 
WITH CHECK (true);