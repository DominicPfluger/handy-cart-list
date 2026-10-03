CREATE TABLE public.admin_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  label text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.admin_backups TO authenticated;
GRANT ALL ON public.admin_backups TO service_role;
ALTER TABLE public.admin_backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage admin_backups" ON public.admin_backups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
