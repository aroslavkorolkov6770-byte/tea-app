import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Здесь можно добавлять другие настройки, например, домены для картинок */
  
  // Мы не добавляем сюда блоки typescript и eslint с флагами ignore, 
  // поэтому Next.js будет использовать стандартное поведение: 
  // полная проверка перед деплоем.
};

export default nextConfig;