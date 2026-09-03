import throwError from "./throwError";

interface TranslationRecord {
  isDefaultForLanguage?: boolean;
  [key: string]: string | boolean | undefined;
}

type TranslationMap = Record<string, TranslationRecord>;

const validateTranslations = (locales: TranslationMap, languages: TranslationMap): void => {
  validateAtLeastOneDefault(locales, languages);
  validateAtMostOneDefault(locales);
  validateTranslationKeys(locales);
};

const validateAtLeastOneDefault = (locales: TranslationMap, languages: TranslationMap): void => {
  for (const locale of Object.keys(locales)) {
    const language = locale.split("-")[0];
    if (languages[language]) { continue; }

    throwError([
      `The language '${language}' has no default locale set. Should it be '${locale}' ?`,
      `If so, please set 'isDefaultForLanguage: true' in src/translations/${locale}.ts`
    ]);
  }
};

const validateAtMostOneDefault = (locales: TranslationMap): void => {
  const defaults: Record<string, string[]> = {};

  for (const [locale, translations] of Object.entries(locales)) {
    const language = locale.split("-")[0];
    if (!translations.isDefaultForLanguage) { continue; }

    defaults[language] ||= [];
    defaults[language].push(locale);
  }

  for (const [language, locales] of Object.entries(defaults)) {
    if (locales.length === 1) { continue; }

    throwError([
      `The language '${language}' has more than one default locale: ${locales.map(s => `'${s}'`).join(", ")}`,
      "Please ensure 'isDefaultForLanguage: true' is set in exactly one file.",
    ]);
  }
};

const validateTranslationKeys = (locales: TranslationMap): void => {
  const allKeys = Object.values(locales).map(Object.keys).flat();
  const uniqKeys = new Set(allKeys.filter(k => k !== "isDefaultForLanguage"));

  for (const [locale, translations] of Object.entries(locales)) {
    for (const key of uniqKeys) {
      if (translations[key]) { continue; }

      throwError([
        `The locale '${locale}' is missing the translation key '${key}'.`,
        `Please set '${key}: "something"' in src/translations/${locale}.ts`,
      ]);
    }
  }
};

export default validateTranslations;
export type { TranslationMap, TranslationRecord };
