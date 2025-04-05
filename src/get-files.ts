import { readdirSync, statSync } from 'fs';
import path from 'path';

export function getFiles(dir: string) {
  const results: string[] = [];

  function traverse(currentDir: string) {
    const files = readdirSync(currentDir);

    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = statSync(filePath);

      if (stat.isDirectory()) {
        if (
          !(
            file === 'node_modules' ||
            file === '.next' ||
            file === '.vscode' ||
            file === '.scripts' ||
            file === 'public'
          )
        ) {
          traverse(filePath);
        }
      } else {
        results.push(filePath.replace(/src\\/, ''));
      }
    }
  }

  traverse(dir);
  return results;
}
