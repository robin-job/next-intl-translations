import * as dotenv from "dotenv";
import { writeFileSync, existsSync } from "fs";
import path from "path";

dotenv.config();

import {
  formatObject,
  readLocales,
  ensureDirectoryExists,
} from "./translation-utils.mjs";

const {
  NIT_MESSAGES_DIR = "./messages",
  NIT_EXTRACTION_PATH = "src",
  NIT_TRANSLATIONS_FILE_NAME = "translations",
} = process.env;

const NIT_LOG_OUTPUT = process.env.NIT_LOG_OUTPUT === "false" ? false : true;
const NIT_NEW_TRANSLATIONS_FILE =
  process.env.NIT_NEW_TRANSLATIONS_FILE === "true" ? true : false;

async function processTranslations() {
  try {
    const translations = readLocales(NIT_MESSAGES_DIR);

    if (Object.keys(translations).length === 0) {
      console.warn("No locale files found in the messages directory.");
      return;
    }

    const locales = Object.keys(translations);

    async function traverseTranslations(obj, currentPath) {
      for (const key in obj) {
        if (typeof obj[key] === "object" && obj[key] !== null) {
          await traverseTranslations(obj[key], path.join(currentPath, key));
        }
      }

      if (
        !Object.values(obj).some(
          (value) => typeof value === "object" && value !== null
        )
      ) {
        const dirPath = path.join(NIT_EXTRACTION_PATH, currentPath);
        const filePath = path.join(dirPath, `${NIT_TRANSLATIONS_FILE_NAME}.ts`);

        ensureDirectoryExists(dirPath);

        const translationsForComponent = {};
        for (const locale of locales) {
          translationsForComponent[locale] = getTranslationsForPath(
            translations[locale],
            currentPath.split(path.sep)
          );
        }

        if (NIT_NEW_TRANSLATIONS_FILE) {
          await createTranslationsFileTs(filePath, translationsForComponent);
          if (NIT_LOG_OUTPUT) {
            console.log(`Created translations file in ${filePath}`);
          }
        } else {
          if (existsSync(filePath)) {
            await updateTranslationsFileTs(filePath, translationsForComponent);
            if (NIT_LOG_OUTPUT) {
              console.log(`Updated translations file in ${filePath}`);
            }
          } else {
            console.warn(`File ${filePath} not found, skipping`);
          }
        }
      }
    }

    function getTranslationsForPath(translation, pathParts) {
      let current = translation;
      for (const part of pathParts) {
        current = current[part];
      }
      return current;
    }

    for (const key in translations[locales[0]]) {
      await traverseTranslations(translations[locales[0]][key], key);
    }

    if (NIT_LOG_OUTPUT) {
      console.log("Translations processed successfully!");
    }
  } catch (error) {
    console.error("Error processing translations:", error);
  }
}

async function createTranslationsFileTs(filePath, translations) {
  try {
    // Получаем список локалей
    const locales = Object.keys(translations);

    // Выбираем первую локаль (например, 'en') для определения типа
    const firstLocale = locales[0];
    const typeDefinition = `typeof ${firstLocale}`;

    // Создаем строки для каждой локали
    const localeStrings = locales
      .map((locale) => {
        const data = translations[locale];
        const formattedData = formatObject(data);
        if (locale === firstLocale) {
          return `const ${locale} = ${formattedData};`;
        } else {
          return `const ${locale} = ${formattedData} satisfies ${typeDefinition};`;
        }
      })
      .join("\n\n");

    // Создаем строку для export default
    const satisfiesType = `TLocales<${typeDefinition}>`;
    const exportDefault = `\nexport default { ${locales.join(
      ", "
    )} } satisfies ${satisfiesType};`;

    // Создаем полный контент файла
    let newContent = localeStrings + "\n";
    newContent += exportDefault + "\n";

    writeFileSync(filePath, newContent, "utf-8");
  } catch (error) {
    console.error(`Error creating translations TS file: ${filePath}`, error);
  }
}

async function updateTranslationsFileTs(filePath, translations) {
  try {
    // Получаем список локалей
    const locales = Object.keys(translations);

    // Выбираем первую локаль (например, 'en') для определения типа
    const firstLocale = locales[0];
    const typeDefinition = `typeof ${firstLocale}`;

    // Создаем строки для каждой локали
    const localeStrings = locales
      .map((locale) => {
        const data = translations[locale];
        const formattedData = formatObject(data);
        if (locale === firstLocale) {
          return `const ${locale} = ${formattedData};`;
        } else {
          return `const ${locale} = ${formattedData} satisfies ${typeDefinition};`;
        }
      })
      .join("\n\n");

    // Создаем строку для export default
    const satisfiesType = `TLocales<${typeDefinition}>`;
    const exportDefault = `\nexport default { ${locales.join(
      ", "
    )} } satisfies ${satisfiesType};`;

    // Создаем полный контент файла
    let newContent = localeStrings + "\n";
    newContent += exportDefault + "\n";

    writeFileSync(filePath, newContent, "utf-8");
  } catch (error) {
    console.error(`Error updating translations TS file: ${filePath}`, error);
  }
}

processTranslations();
