# site-starter — стартовый шаблон сайта ISV Labs (демо и сдача за день)

> Методика: D:\IT\IT Projects\CLAUDE\README.md (общие правила, процессы, чек-листы). Здесь — только этот проект.
> Подробности и история — `.claude/notes/<тема>.md` (читать по теме). План работ — [PLAN.md](PLAN.md).

## Зачем
Внутренний продукт ISV Labs (владелец Murat). Новый сайт местного бизнеса = **копия шаблона + файлы данных клиента**, без правки кода.
Две цели:
1. **Демо за 15 минут** для продаж: ферма агентов (`D:\IT\IT Projects\AgentsFarm`) собирает факты о бизнесе и заполняет данные → превью на Vercel → ссылка клиенту.
2. **Сдача заказа за день** (лендинг от €499, сайт от €749) вместо недели.

## Источники (берём лучшее, клиентский контент не копируем)
| Проект | Что берём |
|---|---|
| Bilto (`D:\IT\IT Projects\bilto`) | Основа архитектуры: Astro 7 + Tailwind v4, секции-компоненты, данные в `src/data/*`, Content Collections (услуги, регионы), согласие на cookies, SEO-компонент, анимации на CSS/IntersectionObserver, Lighthouse 95+ |
| INGBELG (`D:\IT\IT Projects\ingbelg`) | `site-facts.json`, `LandingPage.astro` (одна посадочная = один файл данных), форма → Resend + CRM, `sitemap.xml` с реальными `lastmod`, юридические страницы |
| A&T (`D:\IT\IT Projects\atprojects`) | Навык `visual-check` (Playwright, 4 ширины, overflow/битые картинки) |
| ISV Labs (`isvlabs`) | Лимит заявок по IP (там SMTP; `notify-telegram.ts` в isvlabs нет — отправка в Telegram написана здесь, `src/lib/leads.ts`) |

## Правила проекта
- Всё, что зависит от клиента (тексты, контакты, цвета, шрифты, фото, услуги, регионы, языки), — **только в данных и токенах темы**. В компонентах ни одного названия, телефона или цвета клиента.
- Тексты по умолчанию — нейтральные заглушки с пометкой `[ЗАПОЛНИТЬ]`, не выдуманные факты. Демо без реальных фактов помечается как демо.
- Превью всегда `noindex` до `launched: true` (один флаг — индексация, canonical, sitemap, robots).
- Языки: основной `nl`, опционально `fr`/`en`/`ru` — переключаются в данных.
- Никаких секретов в репозитории; ключи — переменные Vercel.
- Правила методики важнее привычек: `websites/golden-rules.md`, `websites/workflow.md`, `websites/launch-checklist.md`, `websites/design.md`.

## Стек и карта кода
Astro 7.3 + Tailwind v4 (`@tailwindcss/vite`) + TypeScript 6 (не 7 — `astro check` с ним не проверен), `@astrojs/vercel`, `output: 'static'`, API-маршруты — `prerender = false` по месту. Без UI-фреймворка, JS только встроенные `<script>`.

| Что | Где |
|---|---|
| **Данные клиента** (всё, что меняется для нового сайта) | `src/data/site-facts.json` (факты без языка: контакты, часы, `geo`, `schemaType`, `style`, `brand`, `languages`, `launched`, `demo`, `privacy`), `src/data/sections.json` (порядок/вкл/варианты секций), `src/data/content/<lang>.json` (тексты главной, в т.ч. `about.stats`, `contact.responseTime`, `meta.updated`) — файл на каждый язык из `languages` |
| Коллекции (JSON на элемент, тексты в папке языка) | `src/content/{services,regions,gallery}/<lang>/*.json`, `src/content/reviews/*.json`; схемы — `src/content.config.ts` (id = путь файла через `generateId`, иначе поле `slug` подменяет id). Одно имя файла в разных языках = перевод (hreflang) |
| Фото и свои иконки | `src/assets/images/…` (в данных — путь внутри папки, неверный путь = ошибка сборки), `src/assets/icons/<имя>.svg` → `"icon": "custom:<имя>"` |
| Проверка данных (Zod 4 из `astro/zod`) | `src/lib/schema.ts`, загрузка — `src/lib/site.ts` (ошибка в данных = понятное сообщение при сборке) |
| Стили `strict` / `warm` / `modern` + цвета бренда | `src/lib/theme.ts` (пресеты, авто-контраст: текст на кнопке, затемнённый акцент для текста); `global.css` `@theme` только даёт им имена Tailwind (`bg-primary`, `text-muted`, `rounded-card`…) |
| Какие секции видны (вкл + есть данные) и чередование фонов | `src/lib/sections.ts`; меню шапки/подвала строятся из того же списка |
| Строки интерфейса шаблона (кнопки, форма, cookies, якоря, сегменты URL) | `src/i18n/ui.ts` — `nl`, `fr`, `en`, `ru` |
| Privacy / cookie-политика (4 языка, из фактов и `privacy.processors`) | `src/i18n/legal.ts`; страница — `src/views/LegalPage.astro`; «черновик», пока `privacy.updated` = null |
| **Таблица всех страниц** (адреса, языки, hreflang, sitemap) | `src/lib/routes.ts`; основной язык в корне, остальные — `/<lang>/…`; конфликт адресов = ошибка сборки |
| JSON-LD (LocalBusiness/`schemaType`, FAQPage, BreadcrumbList, Service; без `[ЗАПОЛНИТЬ]` и без AggregateRating) | `src/lib/jsonld.ts` |
| Форма → Resend + Telegram + Odoo (по желанию) | `src/lib/leads.ts` (проверка, лимит 5/10 мин на IP, каналы), `src/pages/api/contact.ts`; переменные — `.env.example`. «Спасибо» только при подтверждённой доставке |
| Иконки | `src/components/Icon.astro`: любая Lucide по имени (lucide.dev/icons), бренды whatsapp/facebook/instagram/tiktok (simple-icons; LinkedIn там нет), `custom:` |
| Фото/заглушка | `src/components/Img.astro` (WebP, srcset, без апскейла; без фото — узорная заглушка той же пропорции) |
| Секции главной | `src/components/sections/*` (Hero `split`/`cover`, Trust, Services, About, Process, Gallery, WhyUs, Reviews, Faq, Contact); шапка/подвал/топбар/мобильная панель — `src/components/layout/*` |
| Страницы | один маршрут `src/pages/[...path].astro` → `src/views/{Home,Service,Region,Legal}Page.astro`; `404.astro`, `robots.txt.ts`, `sitemap.xml.ts` (без юр. страниц, `lastmod` только из `updated`) |
| Reveal, шапка, меню | `src/scripts/reveal.ts` (+ CSS в `global.css`); cookies — `CookieBanner.astro` + `src/scripts/consent.ts` (баннер только если есть карта, т.е. `showAddress`) |
| noindex превью | `facts.launched` (meta + robots), `vercel.json` (`X-Robots-Tag` на `*.vercel.app`) |
| Визуальная проверка | навык `.claude/skills/visual-check/` (serve на **4324**, shoot — ловит и вылезающий текст, split) |

## Рабочий цикл
Правка → `npm run build` → `visual-check` (4 ширины) → git add только затронутых → commit.

## ▶ Текущий статус (2026-10-15)
**Сделано:** этап 1 (каркас, 3 стиля) и этап 2 (форма, юр. страницы, SEO, 4 языка). Подробности — `.claude/notes/stage-1.md`, `.claude/notes/stage-2.md`.
**Дальше:** этап 3 из PLAN.md (`client.schema.json` + `npm run apply-client`, `new-site`).
**Не проверено:** реальная доставка формы (нужны ключи Resend/Telegram на тестовом проекте Vercel).
