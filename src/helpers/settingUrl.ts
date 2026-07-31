// The harness page's URL is the repro: identifiers as their own params, and
// each changed setting as set=key:value. Values are JSON so their type
// survives, except plain strings, which stay readable.
//
// harness/urlState.js decodes this. test/helpers/settingUrl.test.ts checks that
// the two agree, because a decoder that disagrees with its encoder silently
// loads something other than what the URL says.

const encodeSettingValue = (value) => {
  if (typeof value !== "string") { return JSON.stringify(value); }

  // A string only needs quoting when JSON would read it back as another type,
  // e.g. "true", "0", or "null".
  try {
    JSON.parse(value);
    return JSON.stringify(value);
  } catch {
    return value;
  }
};

const settingsUrl = ({ identifiers = {}, settings = {}, extra = {} } = {}) => {
  const params = new URLSearchParams();

  Object.entries(identifiers).forEach(([key, value]) => {
    if (value === undefined || value === null || `${value}`.trim() === "") { return; }

    params.set(key, `${value}`.trim());
  });

  Object.entries(extra).forEach(([key, value]) => {
    if (value) { params.set(key, `${value}`); }
  });

  Object.entries(settings).forEach(([key, value]) => {
    if (value === undefined) { return; }

    params.append("set", `${key}:${encodeSettingValue(value)}`);
  });

  return params.toString();
};

export default settingsUrl;
export { settingsUrl, encodeSettingValue };
