CREATE TABLE public.feedback_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'neu',
  locale text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.feedback_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_messages TO authenticated;
GRANT ALL ON public.feedback_messages TO service_role;
ALTER TABLE public.feedback_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send feedback" ON public.feedback_messages FOR INSERT TO anon, authenticated
WITH CHECK (
  status = 'neu'
  AND (user_id IS NULL OR user_id = auth.uid())
  AND char_length(name) BETWEEN 1 AND 100
  AND char_length(email) BETWEEN 3 AND 255
  AND char_length(subject) BETWEEN 1 AND 100
  AND char_length(message) BETWEEN 10 AND 2000
);
CREATE POLICY "Admins read feedback" ON public.feedback_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update feedback" ON public.feedback_messages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete feedback" ON public.feedback_messages FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));