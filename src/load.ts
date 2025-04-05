import { existsSync, mkdirSync } from 'fs';
import type { AbstractIntlMessages } from 'next-intl';
import path from 'path';

import { getTranslations } from './get-translations';
import { writeMessages } from './write';

export const loadTranslations = async ({
  extractionPath = './src',
  outputPath = './messages',
  currentLocale,
  locales,
  enableTypeCheck = true,
  loaderFileScript,
  translationsFileName,
  deepTranslationComparison = false,
}: {
  extractionPath?: string;
  outputPath?: string;
  currentLocale: string;
  locales: string[];
  enableTypeCheck?: boolean;
  loaderFileScript?: (file: string) => Record<string, any>;
  translationsFileName?: string;
  deepTranslationComparison?: boolean;
}) => {
  const allMessages = await getTranslations(
    extractionPath,
    locales,
    loaderFileScript,
    translationsFileName,
    deepTranslationComparison,
  );

  // Получение сообщений локали
  const localeMessages = allMessages[currentLocale];

  if (enableTypeCheck) {
    const absolutePath = path.resolve(process.cwd(), outputPath);

    // Проверяет, есть ли директория по outputPath
    const pathExist = existsSync(absolutePath);

    // Если нет, то создать
    if (!pathExist) {
      mkdirSync(outputPath, { recursive: true });
    }

    // И разместить переводы
    writeMessages(absolutePath, allMessages);
  }

  // Возвращаем сообщения для указанной локали с приведением типа AbstractIntlMessages.
  return localeMessages as AbstractIntlMessages;
};
