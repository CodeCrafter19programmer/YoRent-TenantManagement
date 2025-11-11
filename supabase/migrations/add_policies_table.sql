-- Create policies table for admin to manage tenant rules
CREATE TABLE IF NOT EXISTS public.policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_policies_active ON public.policies(is_active);
CREATE INDEX IF NOT EXISTS idx_policies_category ON public.policies(category);
