import fs from "fs";
import path from "path";

// Функция для форматирования объекта в строку для TypeScript
export function formatObject(obj, indent = 0) {
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

// Функция для чтения файлов локалей
export function readLocales(translationsDir) {
  const localeFiles = fs.readdirSync(translationsDir);
  const locales = localeFiles
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(".json", ""));

  if (locales.length === 0) {
    console.warn("No locale files found in the messages directory.");
    return {};
  }

  const translations = {};
  for (const locale of locales) {
    const filePath = path.join(translationsDir, `${locale}.json`);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    translations[locale] = JSON.parse(fileContent);
  }
  return translations;
}

// Функция для проверки существования директории и ее создания, если она не существует
export function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
