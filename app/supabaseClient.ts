import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sb_publishable_zCygh8nWmGDYyzOvzd2lCw_D4t_QGRk';
const supabaseAnonKey = 'sb_secret_5lG8usUgEDdv2xfINdTMBQ_AVhxkK3H';

// Создаем клиент. Если данных нет (что невозможно при хардкоде, но важно для билда), 
// используем заглушку, чтобы Next.js не ругался.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);