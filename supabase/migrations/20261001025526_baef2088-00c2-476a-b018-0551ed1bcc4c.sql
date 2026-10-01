CREATE TABLE public.department_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (department_id, parent_id),
  CHECK (department_id <> parent_id)
);
GRANT SELECT ON public.department_aliases TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.department_aliases TO authenticated;
GRANT ALL ON public.department_aliases TO service_role;
ALTER TABLE public.department_aliases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Aliases public read" ON public.department_aliases FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage aliases" ON public.department_aliases FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_department_aliases_updated_at BEFORE UPDATE ON public.department_aliases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();