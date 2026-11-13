# Тарих ЕНТ

Платформа подготовки к ЕНТ по истории Казахстана: банк заданий, карты, личности, безопасная проверка ответов и будущий AI-пайплайн.

## Локальный запуск

1. Скопируйте `.env.example` в `.env` и задайте уникальный `AUTH_SECRET` длиной не менее 32 символов.
2. Запустите сервисы: `docker compose up -d`.
3. Установите зависимости: `npm ci`.
4. Создайте схему: `npm run db:migrate -- --name init`.
5. Наполните демо-данными: `npm run db:seed`.
6. Запустите: `npm run dev`.

Или одной командой для контейнеров: `docker compose up --build`. Контейнеры применяют зафиксированные Prisma-миграции через `prisma migrate deploy`; для локальной экспериментальной БД можно явно задать `DATABASE_BOOTSTRAP_MODE=push`.

Для AI-пайплайна во втором терминале запустите `npm run worker:generation`. Задачи генерации хранятся в PostgreSQL и переживают перезапуск веб-приложения.

При `AI_PROVIDER=openai` генерация дополнительно создаёт embeddings и сравнивает их через pgvector с порогом из `src/shared/config/exam.ts`. Без OpenAI остаётся текстовый предохранитель на этапе ручной модерации.

Демо-администратор: `admin@example.test`, пароль `Admin12345!` — используйте только локально и смените/удалите после первого входа.

Для Google OAuth заполните `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` и `APP_URL`; в Google Cloud Console добавьте redirect URI: `https://ваш-домен/api/auth/google/callback`.

## Контроль качества

- `npm test` — unit-тесты типов вопросов, оценивания, геометрии карт и CSV/JSON-импорта.
- `npm run test:e2e` — Playwright smoke-тесты desktop/mobile (предварительно запустите приложение и укажите `PLAYWRIGHT_BASE_URL`, если адрес отличается).
- `npx prisma validate` — проверка схемы данных (потребуется `DATABASE_URL`).

## Перед production-запуском

1. Замените все development-секреты, включая `AUTH_SECRET`, и включите HTTPS.
2. Настройте S3-совместимое хранилище и CDN вместо локального `public/uploads`.
3. Переведите in-memory rate limit в Redis-backed реализацию.
4. Создайте `.env.production` на основе `.env.production.example`, укажите домен, `APP_URL` и уникальные секреты, затем выполните `docker compose --env-file .env.production -f docker-compose.production.yml up -d --build`. Caddy выпустит и продлит HTTPS-сертификат автоматически, если DNS домена уже указывает на сервер и открыты порты 80/443.
5. После первого запуска создайте администратора безопасным способом: `docker compose --env-file .env.production -f docker-compose.production.yml exec app npm run db:seed`, затем сразу смените пароль или удалите демо-учётную запись. Проверьте `https://ваш-домен/api/health` и `docker compose --env-file .env.production -f docker-compose.production.yml ps`.

## Деплой на Netlify

Не загружайте исходный ZIP через поле ручного Deploy: оно рассчитано на уже собранный статический сайт. Загрузите распакованный проект в GitHub и в Netlify выберите **Add new site → Import an existing project → GitHub**. Файл `netlify.toml` самостоятельно применяет Prisma-миграции, запускает генерацию Prisma Client и production-сборку Next.js.

В интерфейсе Netlify добавьте `DATABASE_URL` (внешняя PostgreSQL с расширением pgvector), `AUTH_SECRET` длиной от 32 символов и `APP_URL` с адресом опубликованного сайта. Для устойчивого production-режима также подключите постоянное объектное хранилище для медиа и отдельный worker генерации: файловая система serverless-функций Netlify не подходит для загруженных карт и изображений.
5. Выполните unit/e2e-тесты и проверьте `/api/health` после деплоя.

## Импорт вопросов

`POST /api/admin/import/questions/preview` принимает CSV, JSON-массив объектов или XLSX (первый лист, до 5 МБ) и маппинг полей, сохраняет проверяемый предпросмотр как `ImportJob`. Затем `POST /api/admin/import/questions` с `jobId` и `topicId` повторно валидирует строки и создаёт только вопросы со статусом `DRAFT`. Минимальные поля: текст вопроса, правильный ответ, не менее трёх неверных вариантов через `|` и объяснение. В разделе AI-генерации источник можно вставить текстом либо загрузить TXT (до 2 МБ).

## Устройство

- `src/server` — серверные сервисы, авторизация, БД и хранилище.
- `src/shared` — типы заданий, конфигурация и Zod-валидация.
- `prisma/schema.prisma` — PostgreSQL/pgvector-модель.
- `src/app/api/admin` — API администрирования; все маршруты требуют роль `ADMIN`.

## Схема данных

Основные агрегаты: `User`, `Category → Topic → Subtopic`, `SourceMaterial`, `Question → QuestionVariant/QuestionOption`, `Person`, `Place`, `MediaAsset → MapAsset → MapRegion/MapMarker`, `TestSession → SessionQuestion/Attempt`, `UserProgress`, `ProgressEvent`, `ImportJob` и `GenerationJob`. Вектор вопроса хранится в pgvector-поле `Question.embedding`.

## AI-конвейер

1. Администратор сохраняет материал и создаёт `GenerationJob`.
2. Worker извлекает только подтверждаемые факты из материала.
3. По фактам создаются вопросы, объяснения и 3–5 перефразированных версий.
4. Независимый verification-проход отклоняет утверждения, которые не следуют из источника.
5. При OpenAI embeddings pgvector отбрасывает близкие вопросы; итоговые записи всегда получают статус `DRAFT`.
6. Администратор вручную одобряет или отклоняет черновики.

Правильные варианты и данные интерактивных карт не предназначены для выдачи ученику до серверной проверки ответа. В разработке изображения лежат в `public/uploads`; в production хранилище заменяется S3-адаптером.

## Безопасность

Изменяющие API-запросы проверяют `Origin` против текущего хоста. Сессии хранятся в подписанной `httpOnly`, `sameSite=lax` cookie. Встроенный in-memory rate limit защищает вход, AI-генерацию и загрузку медиа; при горизонтальном production-развёртывании замените его общим Redis-хранилищем лимитов.

Для тренировки в браузере есть IndexedDB-очередь: при недоступном API ответ сохраняется на устройстве и отправляется при событии `online`. Серверный `clientEventId` делает повторную доставку безопасной.
