const camelCaseKeys = (value) => {
  if (typeof value !== "object" || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(camelCaseKeys);
  }

  return Object.fromEntries(Object.entries(value).map(([k, v]) => (
    [k.replace(/(?!^)_([a-z])/g, (_, c) => c.toUpperCase()), camelCaseKeys(v)]
  )));
};

export default camelCaseKeys;
