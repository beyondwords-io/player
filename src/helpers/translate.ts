import basename from "./basename";
import validateTranslations from "./validateTranslations";
import throwError from "./throwError";

const modules = import.meta.glob("../translations/*", { eager: true });
const pairs = Object.entries(modules).map(([k, v]) => [basename(k), v.default]);

const locales = Object.fromEntries(pairs);
const languages = Object.fromEntries(pairs.filter(([_, v]) => v.isDefaultForLanguage).map(([k, v]) => [k.split("-")[0], v]));

validateTranslations(locales, languages);

const translate = (key, { locale } = {}) => {
  const translations = translationsForBrowserPreference();

  if (!translations[key]) {
    throwError([
      `No translations found for the '${key}' translation key.`,
      `Please ensure '${key}: "something"' is set in src/translations/`,
    ]);
  }

  return translations[key];
};

const translationsForBrowserPreference = (locale = null) => {
  const localesToTry = [locale, ...navigator.languages, "en-US"].filter(s => s);

  for (const locale of localesToTry) {
    const language = locale.split("-")[0];

    // navigator.languages can return both locales (en-GB) and languages (en).
    // It doesn't mattter in this case because locales["en"] will be undefined
    // and we're explicitly fetching the language translations separately below.

    if (locales[locale]) { return locales[locale]; }
    if (languages[language]) { return languages[language]; }
  }
};

export default translate;
