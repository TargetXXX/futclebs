-- =====================================================
-- FutClebs: Tabela de Grupos WhatsApp
-- Execute no Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',           -- ex: "GALERA DO FUT - QUINTA"
  group_jid text NOT NULL DEFAULT '',      -- ex: 120363403949819144@g.us
  send_monday boolean DEFAULT false,
  send_tuesday boolean DEFAULT false,
  send_wednesday boolean DEFAULT false,
  send_thursday boolean DEFAULT false,
  send_friday boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE whatsapp_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins gerenciam grupos WA"
  ON whatsapp_groups FOR ALL USING (true) WITH CHECK (true);

-- Inserir grupos padrão (edite com seus JIDs)
INSERT INTO whatsapp_groups (name, group_jid, send_monday, send_thursday, is_active)
VALUES
  ('GALERA DO FUT - SEGUNDA', '', true, false, true),
  ('GALERA DO FUT - QUINTA',  '120363403949819144@g.us', false, true, true)
ON CONFLICT DO NOTHING;

