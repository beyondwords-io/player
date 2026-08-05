import basename from "./basename";
import validateTranslations from "./validateTranslations";
import throwError from "./throwError";
import supportedLanguages from "./supportedLanguages";

const modules = import.meta.glob("../translations/*", { eager: true });
const pairs = Object.entries(modules).map(([k, v]) => [basename(k), v.default]);

const locales = Object.fromEntries(pairs.filter(([k, _]) => k.includes("-")));
const languages = Object.fromEntries(pairs.filter(([_, v]) => v.isDefaultForLanguage).map(([k, v]) => [k.split("-")[0], v]));

validateTranslations(locales, languages);

let override = null;

export const setLocale = (locale) => {
  if (locale && !supportedLanguages.includes(locale)) {
    console.warn(`BeyondWords player: '${locale}' is not a supported language, falling back to browser preference.`);
    override = null;
    return;
  }
  override = locale || null;
};

const translate = (key, { locale } = {}) => {
  const translations = translationsForBrowserPreference(locale);
  // Feature copy can ship before every locale has caught up. Fall back one
  // key at a time so a partially translated locale remains usable instead of
  // throwing as soon as a newer control is rendered.
  const translation = translations[key] || languages.en[key];

  if (!translation) {
    throwError([
      `No translations found for the '${key}' translation key.`,
      `Please ensure '${key}: "something"' is set in src/translations/`,
    ]);
  }

  return translation;
};

const translationsForBrowserPreference = (locale = null) => {
  const localesToTry = [locale, override, ...navigator.languages, "en"].filter(s => s);

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
