const SUPABASE_URL = 'https://iptwdwxmhwopzdrpjvmq.supabase.co'; // ✅ Sin barra ni rest/v1 al final
const SUPABASE_ANON_KEY = 'sb_publishable_8ejuVpGhKo99DDubm4KcOQ_JpUgAiIm'; // Tu clave completa

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);