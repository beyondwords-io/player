import basename from "./basename";
import throwError from "./throwError";

const modules = import.meta.glob("../translations/*", { eager: true });
const pairs = Object.entries(modules).map(([k, v]) => [basename(k), v.default]);

const locales = Object.fromEntries(pairs);
const languages = Object.fromEntries(pairs.filter(([_, v]) => v.isDefaultForLanguage).map(([k, v]) => [k.slice(0, 2), v]));

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
    const language = locale.slice(0, 2);

    if (locales[locale]) { return locales[locale]; }
    if (languages[language]) { return languages[language]; }
  }
};

export default translate;
