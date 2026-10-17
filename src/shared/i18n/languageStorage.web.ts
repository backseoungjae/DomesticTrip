import type { LanguageStorage } from './LanguageProvider';
import type { AppLanguage } from './instance';

// Native persistence uses SQLite. Web remains a session-only preview until
// SQLite's web runtime is configured; Settings explicitly states this limit.
let language: AppLanguage | null = null;
export const languageStorage: LanguageStorage = {
  persistent: false,
  async load() {
    return language;
  },
  async save(nextLanguage) {
    language = nextLanguage;
  },
};
