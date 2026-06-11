import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, nome, role } = req.body;
  if (!email || !nome) return res.status(400).json({ error: 'Email e nome são obrigatórios.' });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { nome, role: role || 'professor' }
  });

  if (error) return res.status(400).json({ error: error.message });
  return res.status(200).json({ success: true });
}
