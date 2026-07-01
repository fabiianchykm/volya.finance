import type { NextConfig } from "next";
import path from "path";

const projectRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    // Аватарки Google-акаунтів віддаються з lh3.googleusercontent.com.
    // next/image блокує зовнішні хости, поки вони не дозволені тут явно.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  // Закріплюємо корінь трасування файлів на цьому проєкті. Без цього `next build`
  // через зайвий package-lock.json у домашній директорії інферив $HOME як корінь
  // воркспейсу й обходив УСЕ дерево домашньої теки (інші проєкти, усі node_modules)
  // — це з'їдало всю памʼять до OOM. Дзеркалить turbopack.root для dev-режиму.
  outputFileTracingRoot: projectRoot,
  turbopack: {
    // Закріплюємо корінь воркспейсу на цьому проєкті. Інакше Next через зайвий
    // package-lock.json у домашній директорії обирав хибний корінь (попередження
    // білда + ризик неправильного резолву залежностей + надмірне стеження за ФС).
    root: projectRoot,
  },
};

export default nextConfig;
