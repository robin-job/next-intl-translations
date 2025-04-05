<h1 align="center">
  <br>
  <a href="https://next-intl.dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="media/logo-dark-mode.svg">
      <source media="(prefers-color-scheme: light)" srcset="media/logo.svg">
      <img alt="next-intl" src="media/logo.svg" width="600">
    </picture>
  </a>
  <br>
  <br>
</h1>

> Internationalization (i18n) for Next.js

[README in English](https://github.com/robin-job/next-intl-translations/blob/main/README.md) | [README in Chinese](https://github.com/robin-job/next-intl-translations/blob/main/README_zh.md)

## Особенности
`next-intl-translations` расширяет возможности `next-intl`, добавляя следующие особенности:
- 🧩 **Распрелеленные переводы**: Разместите переводы прямо в компонентах для максимальной ясности и простоты поддержки.
- ✅ **Типобезопасность**: Избегайте ошибок перевода с помощью типизированных `translations.ts`, которые гарантируют соответствие переводов между локалями прямо в коде, дополняя типобезопасность `next-intl`.

## Объяснения
С помощью `next-intl-translations` можно легко масштабировать проект при работе с переводами.

Обычно, все переводы хранятся в файлах раздела `messages`. Чем больше проект, тем больше разрастаются файлы `messages`, из-за чего становится сложно управлять переводами. Например, при удалении какого-либо кода, нужно обязательно найти и удалить соответствующие переводы, иначе они останутся в файлах `messages`, тем самым еще больше увеличивая их размер.

Эта библиотека работает с `next-intl`, вдохновленная `next-intl-split`. Идея `next-intl-translations` в том, чтобы хранить переводы (`messages`) для разных локалей (`locales`) в одном `translations` файле, расположенном рядом с соответствующим компонентом. Затем библиотека собирает эти переводы в файлы `messages`, необходимый для работы `next-intl`. И при удалении компонента с его `translations` они также будут удалены в файлах `messages`.

# Как начать
1. Установите зависимости:
    ```
    npm install next-intl next-intl-translations
    ```

2. Настройте `next-intl` в вашем `next.config.js` и прочие настройки в соответствии с [документацией](https://next-intl.dev/). 

3. Укажите доступные языки:
    ```ts
    // src/i18n/config.ts
    export const LOCALES = ['ru', 'en', 'zh'] as const;
    ```
4. Укажите тип `TLocales` в `global.d.ts` чтобы он работал в файлах `translations.ts`:
    ```ts
    declare type DeepObject = {
      [key: string]: string | DeepObject;
    };

    declare type IntlMessages = typeof import('@/messages/en.json');

    type TLocale = (typeof import('@/i18n/config').LOCALES)[number];
    declare type TLocales = {
      [key in TLocale]: DeepObject;
    };
    ```
5. Создайте файл `translations.ts` (можно использовать форматы `js` и `json`):
    ```ts
    const en = {
      logo: 'Logo',
      form: 'Form',
    };

    const zh: typeof en = {
      logo: '标志',
      form: '表格',
    };

    const ru: typeof en = {
      logo: 'Логотип',
      form: 'Форма',
    };

    export default { en, zh, ru } satisfies TLocales;
    ```
    Чтобы избежать ошибок и обеспечить согласованность переводов, структура первого языка (`en`) становится типом (`typeof en`) для всех остальных (`zh`, `ru`). Это позволяет TypeScript проверять наличие всех необходимых ключей в переводах для каждого языка прямо в коде. `satisfies TLocales` завершает процесс, проверяя, что все указанные в проекте языки (определённые в `TLocales`) имеют свои переводы.

    После запуска и обновления страницы, файлы директории `messages/` будут обновлены в соответствии с файлами `translations`.

6. Подключите `messages`, в условии `production` используем статические файлы `messages/`, а `development` динамически загружаем переводы из `translations` файлов:
    ```ts
    // src/i18n/request.ts
    import { getRequestConfig } from 'next-intl/server';

    import { getUserLocale } from './locale';
    import { loadTranslationsForDev } from './load-dev';

    export default getRequestConfig(async () => {
      const locale = await getUserLocale();

      const messages =
        process.env.NODE_ENV === 'production'
          ? (await import(`@/messages/${locale}.json`)).default
          : await loadTranslationsForDev();

      return {
        locale,
        messages,
      };
    });
    ```
7. Найтройте загрузчик `messages` для `development`:
    ```ts
    // src/i18n/load-dev.ts
    import { loadTranslations } from 'next-intl-translations';

    import { LOCALES } from './config';
    import { getUserLocale } from './locale';

    export const loadTranslationsForDev = async () => {
      const locale = await getUserLocale();
      return await loadTranslations({
        currentLocale: locale,
        locales: [...LOCALES],
        enableTypeCheck: true,
        deepTranslationComparison: true,
        loaderFileScript: async (file) => {
          let translations: Record<string, any> | null = null;
          await import(`@/src/${file.replace(/\\/g, '/')}`)
            .then((module) => {
              translations = module.default;
            })
            .catch((error) => {
              console.error(`Error importing or parsing ${file}:`, error);
            });

          return translations;
        },
      });
    };
    ```
    - `extractionPath` (по умолчанию `'./src'`): путь откуда будут начинаться поиска файлов `translations`
    - `outputPath` (по умолчанию `'./messages'`): раздел куда будут поступать файлы `messages`
    - `enableTypeCheck` (по умолчанию `true`): определяет нужна ли запись файлов переводов `messages` в директорию `messages`
    - `currentLocale`: текущая локаль
    - `locales`: список локалей проекта
    - `deepTranslationComparison`: дополнительная проверка всех переводов, актуально для `json`, `js`. Менее актуально для `ts` если соблюдать типы
    - `loaderFileScript`: указывается `loader` чтобы можно было импортировать переводы из файлов `ts` и `js`. Если не указать, то читаться будут только `json` файлы.
    - `translationsFileName` (по умолчанию `'translations'`): названия файла с переводами

8. Используйте переводы, также как и в `next-intl`:
    ```tsx
    // src/pages/home
    import { useTranslations } from 'next-intl';

    export function HomePage() {
      const t = useTranslations('pages.home');
      return (
        <main>
          <h1>{t('logo')}</h1>
          <form>
            <h2>{t('form')}</h2>
          </form>
        </main>
      );
    }
    ```

## При работе с `translations.json`
Помимо работы с файлами `ts` и `js`, можно работы с `translations.json`. Сам файл должен выглядеть так:
```json
{
  "en": {
    "logo": "Logo",
    "form": "Form"
  },
  "zh": {
    "logo": "标志",
    "logoFull": "表格"
  },
  "ru": {
    "logo": "Логотип",
    "form": "Форма"
  }
}
```
Для работы с форматом `json` можно не указывать `loaderFileScript`.

## Добавление нового языка
В случае с разделением переводов на множество `translations.ts`, затрудняется добавление новых переводов, в таких случаях есть специальный скрипт:
```
npx extract-translations
```
Нужно в `messages/` добавить новую локаль, например `de.json` и перевести значения для всех ключей, затем запустить скрпит `extract-translations`. В существующие файлы `translations.ts` (`json`, `js`) будут добавлены переводы для `de`.

Дополнительные параметры, их нужно указать в .env:
- `NIT_MESSAGES_DIR` (по умолчанию `'./messages'`): раздел откуда будут извлекаться переводы `messages`
- `NIT_EXTRACTION_PATH` (по умолчанию `'src'`): раздел с которого должны распалагаться файлы `translations`
- `NIT_TRANSLATIONS_FILE_NAME` (по умолчанию `translations`): названия файла с переводами
- `NIT_LOG_OUTPUT` (по умолчанию `true`): показывать ли лога в консоли
- `NIT_NEW_TRANSLATIONS_FILE` (по умолчанию `false`): создаст новые `translations.ts` если его нет (ниже подробнее об этом)

# Миграция с `messages/[locale].json` в `src/**/**/translations.ts`
В случае, если в проекте используется стандартный подход `next-intl` с `messages/[locale].json`, можно также создать разделенные файлы переводов, это работает похожим образом что и с пунктом выше, только проблема заключается в том, что файлов `translations.ts` еще не существует. Но с помощью скрипта `npx extract-translations` и переменной `NIT_NEW_TRANSLATIONS_FILE=true` можно создать эти файлы.

Нужно создать структуру директорий, чтобы ключи переводов соответствовали им.

Например для данных ключей переводов:
```json
{
  "pages": {
    "home": {
      "form": {
        ...
      }
    },
    ...
  }
}
```
Если нужно чтобы файл `translations.ts` был создан в директории `home`, то нужно создать такую структуру:
```
pages/
└── home/
    └── translations.ts // будет создан тут
```
Если нужно создать `translations.ts` в `form`, то такую:
```
pages/
└── home/
    └── form/
        └── translations.ts // будет создан тут
```
И так нужно создать для всех ключей переводов. Но будьте осторожны при большом количестве переводов, так как создание `translations.ts` может быть непредсказуемым.

# Планируется

### VS Code Plugin: Next-Intl-Translations Generator
Возможность быстрого создания `translations.ts` в директории со всеми локалями и типами.

# Глоссарий 
- **`messages`**: Переводы для одного языка (`en`, `ru`). Используются `next-intl` в приложении. Файлы: `messages/en.json`, `messages/ru.json`.
- **`translations`**: Переводы для всех языков. Источник данных для генерации `messages`. Файл: `translations.ts` (или `translations.json`).

# Благодарность
[next-intl](https://github.com/amannn/next-intl) and [next-intl-split](https://github.com/HPouyanmehr/next-intl-split)