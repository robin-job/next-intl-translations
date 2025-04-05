import { readFileSync } from 'fs';
import path from 'path';

import { equal } from './equal';
import { getFiles } from './get-files';

const TRANSLATIONS_FILE_NAME = 'translations';

interface FileMessages {
  [locale: string]: any;
}

const createNestedObject = (obj: { [key: string]: any }, keys: string[]) => {
  let current = obj;

  for (const key of keys) {
    if (!current[key]) {
      current[key] = {};
    }
    current = current[key];
  }

  return { obj, lastKey: current };
};

const processFile = async ({
  file,
  locales,
  messages,
  translationsFileName,
  deepTranslationComparison,
  loader,
}: {
  file: string;
  locales: string[];
  messages: { [key: string]: any };
  translationsFileName: string;
  deepTranslationComparison: boolean;
  loader: (file: string) => Record<string, any>;
}) => {
  const fileSplit = file.split(path.sep);
  const fileParents = fileSplit.filter((parent) => {
    const fileNameWithExtension = path.basename(file);
    return parent !== fileNameWithExtension;
  });
  let fileMessages: FileMessages;

  try {
    if (loader && isATSFilePath(file, translationsFileName)) {
      fileMessages = await loader(file);
    } else if (loader && isAJSONFilePath(file, translationsFileName)) {
      fileMessages = loader(file);
    } else {
      return;
    }
  } catch (error) {
    console.error(`Error parsing file ${file}:`, error);
    throw error;
  }

  locales.forEach((locale, index) => {
    if (!fileMessages[locale]) {
      throw new Error(
        `There are no translations for the locale "${locale}" in ${file.replace(/\\/g, '/')}`,
      );
    }

    if (
      deepTranslationComparison &&
      index > 0 &&
      !equal(fileMessages[locales[index - 1]], fileMessages[locales[index]])
    ) {
      throw new Error(
        `Translations of "${locales[index]}" are different from translations of "${locales[index - 1]}" in ${file.replace(/\\/g, '/')}`,
      );
    }

    const { lastKey } = createNestedObject(messages, [
      locale,
      ...(fileParents.length === 0 ? ['common'] : fileParents),
    ]);
    Object.assign(lastKey, fileMessages[locale]);
  });
};

const isAJSONFilePath = (filePath: string, fileName: string): boolean => {
  const file = path.basename(filePath);
  return file === `${fileName}.json`;
};

const isATSFilePath = (filePath: string, fileName: string): boolean => {
  const file = path.basename(filePath);
  return file === `${fileName}.ts` || file === `${fileName}.js`;
};

const loaderFileJson = (extractionPath: string) => (file: string) => {
  const pathToFile = path.resolve(process.cwd(), extractionPath, file);
  return JSON.parse(readFileSync(pathToFile, 'utf-8'));
};

export const getTranslations = async (
  extractionPath: string,
  locales: string[],
  loaderFileScript?: (file: string) => Record<string, any>,
  translationsFileName: string = TRANSLATIONS_FILE_NAME,
  deepTranslationComparison: boolean = false,
) => {
  const messages: { [key: string]: any } = {};

  try {
    const files = getFiles(extractionPath);

    for (const file of files) {
      if (typeof file === 'string') {
        const params = {
          file,
          extractionPath,
          locales,
          messages,
          translationsFileName,
          deepTranslationComparison,
        };
        if (loaderFileScript && isATSFilePath(file, translationsFileName)) {
          await processFile({ ...params, loader: loaderFileScript });
        } else if (isAJSONFilePath(file, translationsFileName)) {
          await processFile({
            ...params,
            loader: loaderFileJson(extractionPath),
          });
        }
      }
    }
  } catch (error) {
    console.error(
      'The following error occurred in loader in next-intl-translations.',
      error,
    );
  }

  return messages;
};
