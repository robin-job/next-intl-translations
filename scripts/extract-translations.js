#!/usr/bin/env node
import fs from "fs";
import path from "path";

const TRANSLATIONS_DIR = process.argv[2] || "./messages";
const EXTRACTION_PATH = process.argv[3] || "src";
const TRANSLATIONS_FILE_NAME = process.argv[4] || "translations";
const LOG_OUTPUT = process.argv[5] === "false" ? false : true;

async function processTranslations() {
  try {
    const localeFiles = fs.readdirSync(TRANSLATIONS_DIR);
    const locales = localeFiles
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(".json", ""));

    if (locales.length === 0) {
      console.warn("No locale files found in the messages directory.");
      return;
    }

    const translations = {};
    for (const locale of locales) {
      const filePath = path.join(TRANSLATIONS_DIR, `${locale}.json`);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      translations[locale] = JSON.parse(fileContent);
    }

    for (const section in translations[locales[0]]) {
      const sectionData = translations[locales[0]][section];
      for (const component in sectionData) {
        const componentName = component;

        // Ищем файл translations.ts, translations.json или translations.js
        const translationsFilePath = await findTranslationsFile(
          path.join(EXTRACTION_PATH),
          componentName
        );

        if (translationsFilePath) {
          const translationsForComponent = {};
          for (const locale of locales) {
            translationsForComponent[locale] =
              translations[locale][section][componentName];
          }

          // Определяем тип файла (ts, json или js) и вызываем соответствующую функцию
          if (translationsFilePath.endsWith(".ts")) {
            await updateTranslationsFileTs(
              translationsFilePath,
              translationsForComponent
            );
          } else if (translationsFilePath.endsWith(".json")) {
            await updateTranslationsFileJson(
              translationsFilePath,
              translationsForComponent
            );
          } else if (translationsFilePath.endsWith(".js")) {
            await updateTranslationsFileJs(
              translationsFilePath,
              translationsForComponent
            );
          }

          if (LOG_OUTPUT) {
            console.log(
              `Updated translations for ${componentName} in ${translationsFilePath}`
            );
          }
        } else {
          console.warn(
            `Файл translations.ts, translations.json или translations.js не существует для ${componentName} в директории ${EXTRACTION_PATH}.`
          );
        }
      }
    }

    if (LOG_OUTPUT) {
      console.log("Translations processed successfully!");
    }
  } catch (error) {
    console.error("Error processing translations:", error);
  }
}

async function findTranslationsFile(dir, componentName) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const foundPath = await findTranslationsFile(filePath, componentName);
      if (foundPath) {
        return foundPath;
      }
    } else if (
      (file === `${TRANSLATIONS_FILE_NAME}.ts` ||
        file === `${TRANSLATIONS_FILE_NAME}.json` ||
        file === `${TRANSLATIONS_FILE_NAME}.js`) &&
      filePath.includes(componentName)
    ) {
      return filePath;
    }
  }

  return null;
}

function formatObject(obj, indent = 0) {
  const indentStr = "  ".repeat(indent);
  const newIndentStr = "  ".repeat(indent + 1);

  if (typeof obj !== "object" || obj === null) {
    return `'${obj}'`;
  }

  const keys = Object.keys(obj);
  const items = keys.map((key) => {
    const value = obj[key];
    if (typeof value === "object" && value !== null) {
      return `${newIndentStr}${key}: ${formatObject(value, indent + 1)}`;
    }
    return `${newIndentStr}${key}: '${value}'`;
  });

  return `{\n${items.join(",\n")},\n${indentStr}}`;
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
          return `const ${locale}: ${typeDefinition} = ${formattedData};`;
        }
      })
      .join("\n\n");

    // Создаем строку для export default
    const exportDefault = `export default { ${locales.join(
      ", "
    )} } satisfies TLocales;`;

    // Создаем полный контент файла
    let newContent = localeStrings + "\n\n";
    newContent += exportDefault + "\n";

    fs.writeFileSync(filePath, newContent, "utf-8");
  } catch (error) {
    console.error(`Error updating translations TS file: ${filePath}`, error);
    throw error;
  }
}

async function updateTranslationsFileJson(filePath, translations) {
  try {
    const jsonData = {};
    for (const locale in translations) {
      jsonData[locale] = translations[locale];
    }

    const jsonString = JSON.stringify(jsonData, null, 2);
    fs.writeFileSync(filePath, jsonString + "\n", "utf-8");
  } catch (error) {
    console.error(`Error updating translations JSON file: ${filePath}`, error);
    throw error;
  }
}

async function updateTranslationsFileJs(filePath, translations) {
  try {
    const localesObject = {};
    for (const locale in translations) {
      localesObject[locale] = translations[locale];
    }

    const objectString = formatObject(localesObject);
    const jsContent = `const locales = ${objectString};\n\nexport default locales;\n`;

    fs.writeFileSync(filePath, jsContent, "utf-8");
  } catch (error) {
    console.error(`Error updating translations JS file: ${filePath}`, error);
    throw error;
  }
}

processTranslations();
