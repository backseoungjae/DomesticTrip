import { readSetting, writeSetting } from '@/database/settings';

import type { LanguageStorage } from './LanguageProvider';
import { isAppLanguage } from './instance';

export const languageStorage: LanguageStorage = {
  persistent: true,
  async load() {
    const saved = await readSetting('app_language');
    return isAppLanguage(saved) ? saved : null;
  },
  async save(language) {
    await writeSetting('app_language', language);
  },
};
