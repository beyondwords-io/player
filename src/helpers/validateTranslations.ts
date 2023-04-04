import throwError from "./throwError";

const validateTranslations = (locales, languages) => {
  validateAtLeastOneDefault(locales, languages);
  validateAtMostOneDefault(locales);
  validateTranslationKeys(locales, languages);
};

const validateAtLeastOneDefault = (locales, languages) => {
  for (const locale of Object.keys(locales)) {
    const language = locale.split("-")[0];
    if (languages[language]) { continue; }

    throwError([
      `The language '${language}' has no default locale set. Should it be '${locale}' ?`,
      `If so, please set 'isDefaultForLanguage: true' in src/translations/${locale}.ts`
    ]);
  }
};

const validateAtMostOneDefault = (locales) => {
  const defaults = {};

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

const validateTranslationKeys = (locales) => {
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
