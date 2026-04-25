import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gamnvvrocuikwwkssufc.supabase.co';
const supabaseAnonKey = 'sb_publishable_hG0NGBLj6d6XoFzX2qtlDQ_6cr7H24h';

// ОШИБКА БЫЛА ТУТ: Обязательно должно быть слово export в начале строки!
export const supabase = createClient(supabaseUrl, supabaseAnonKey);