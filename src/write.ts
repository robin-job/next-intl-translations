import { writeFileSync } from 'fs';
import path from 'path';

const extractLocalesAndMessages = (messages: { [key: string]: any }) =>
  Object.entries(messages);

export const writeMessages = (dictionariesPath: string, messages: {}) => {
  const localeMessagesMap = extractLocalesAndMessages(messages);

  const isInProduction = process.env.NODE_ENV === 'production';

  if (isInProduction) {
    console.log('\n');
    console.log('▲ Next Intl Translations');
  }
  for (let index = 0; index < localeMessagesMap.length; index++) {
    const locale = localeMessagesMap[index][0];
    const localeMessages = localeMessagesMap[index][1];

    try {
      const pathToWrite = path.resolve(dictionariesPath, `${locale}.json`);
      const content = JSON.stringify(localeMessages, null, 2);

      writeFileSync(pathToWrite, content);
      if (isInProduction) {
        console.log(`\tSuccessfully merged JSON content for ${locale}`);
      }
    } catch (error) {
      console.error(
        'The following error occured in writer in next-intl-translations.',
        error,
      );
    }
  }

  if (isInProduction) console.log('\n');
};
