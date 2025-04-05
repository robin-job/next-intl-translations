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

[README in Russian](https://github.com/robin-job/next-intl-translations/blob/main/README_ru.md) | [README in Chinese](https://github.com/robin-job/next-intl-translations/blob/main/README_zh.md)

## Features
`next-intl-translations` extends the capabilities of `next-intl` by adding the following features:
- 🧩 **Distributed Translations**: Place translations directly in components for maximum clarity and ease of support.
- ✅ **Type-safe**: Avoid translation errors by using typed `translations.ts`, which ensure that translations between locales match directly in the code, complementing the typesecurity of `next-intl`.

## Explanations

Using `next-intl-translations`, you can easily scale a project when working with translations.

Usually, all translations are stored in the `messages' section files. The larger the project, the more the `messages' files grow, which makes it difficult to manage translations. For example, when deleting any code, it is necessary to find and delete the corresponding translations, otherwise they will remain in the `messages` files, thereby further increasing their size.

This library works with `next-intl`, inspired by `next-intl-split`. The idea of `next-intl-translations` is to store `messages` for different `locales` in a single `translations` file located next to the corresponding component. The library then collects these translations into the `messages` files necessary for the operation of `next-intl`. And when you delete a component from its `translations`, they will also be deleted in the `messages` files.

# Getting Started
1. Install the dependencies:
    ```
    npm install next-intl-translations
    ```

2. Configure `next-intl` in your `next.config.js ` and other settings according to [documentation](https://next-int.dev /).

3. Specify the available languages:
    ```ts
    // src/i18n/config.ts
    export const LOCALES = ['ru', 'en', 'fr'] as const;
    ```
4. Specify the type `TLocales' in `global.d.ts` so that it works in the `translations.ts` files:
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
5. Create the file `translations.ts` (you can use the formats `js` and `json`):
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
    To avoid mistakes and ensure consistency of translations, the structure of the first language (`en`) becomes the type (`typeof en`) for all others (`zh`, `ru`). This allows TypeScript to check for all necessary keys in translations for each language directly in the code. satisfies TLocales completes the process by verifying that all the languages specified in the project (defined in TLocales) have their own translations.

    After launching and updating the page, the `messages/` directory files will be updated according to the `translations` files.

6. Enable `messages`. In the `production` condition, we use static `messages/` files, and in the `development` we dynamically download translations from the `translations` files:
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
7. Configure the `messages` loader for `development`:
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
    - `extractionPath` (default is `'./src'`): the path from where the search for `translations` files will start
    - `OutputPath` (default is `'./messages'`): the section where the `messages` files will arrive
    - `enableTypeCheck' (default is `true`): determines whether the translation files `messages` should be written to the `messages` directory
    - `currentLocale`: current locale
    - `locales`: list of project locales
    - `deepTranslationComparison`: additional verification of all translations, relevant for json, js. Less relevant for ts if you follow the types
    - `loaderFileScript`: Specifies `loader` so that translations from the `ts` and `js` files can be imported. If omitted, only the `json` files will be read.
    - `translationsFileName` (default is `translations`): file names with translations

8. Use translations the same way as in `next-intl`:
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

## When working with `translations.json`
In addition to working with the `ts` and `js` files, you can work with `translations.json`. The file itself should look like this:
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
To work with the `json` format, you don't need to specify `loaderFileScript'.

# Adding a new language
In the case of dividing translations into multiple `translations.ts`, it becomes difficult to add new translations, in such cases there is a special script:
```
npx extract-translations
```
You need to add a new locale to `messages/`, for example `de.json` and translate the values for all keys, then run the `extract-translations` script. Translations for `de` will be added to the existing `translations.ts` (`json`, `js`) files.

Additional parameters, they need to be specified in .env:
- `NIT_MESSAGES_DIR` (default is `'./messages'`): the section from where translations of `messages` will be extracted
- `NIT_EXTRACTION_PATH` (default is `'src'`): the section from which the `translations` files should be located
- `NIT_TRANSLATIONS_FILE_NAME` (default is `translations`): file names with translations
- `NIT_LOG_OUTPUT` (default is `true`): whether to show logs in the console
- `NIT_NEW_TRANSLATIONS_FILE` (default is `false`): it will create new `translations.ts` if it doesn't exist (more details about this below)

# Migration from `messages/[locale].json` in `src/**/**/translations.ts`
In case the project uses the standard `next-intl` approach with `messages/[locale].json`, you can also create split translation files, it works in a similar way as with the point above, only the problem is that the `translations.ts` files do not exist yet. But using the `npx extract-translations` script and the `NIT_NEW_TRANSLATIONS_FILE=true` variable, you can create these files.

You need to create a directory structure so that the translation keys match them.

For example, for these transfer keys:
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
If you need the `translations.ts` file to be created in the `home` directory, then you need to create such a structure:
```
pages/
└── home/
    └── translations.ts // It will be created here
```
If you need to create a `translations.ts` in a `form`, then this:
```
pages/
└── home/
    └── form/
        └── translations.ts // It will be created here
```
And this is how you need to create for all transfer keys. But be careful with a large number of translations, as the creation of `translations.ts` can be unpredictable.

# Glossarium 
- **`messages`**: Translations for one language (`en`, `ru`). The `next-intl` is used in the application. Files: `messages/en.json`, `messages/ru.json`.
- **`translations`**: Translations for all languages. The data source for generating `messages`. File: `translations.ts` (or `translations.json`).

# Gratitude
[next-intl](https://github.com/amannn/next-intl) and [next-intl-split](https://github.com/HPouyanmehr/next-intl-split)