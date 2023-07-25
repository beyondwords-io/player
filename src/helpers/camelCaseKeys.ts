const camelCaseKeys = (value) => {
  if (typeof value !== "object" || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(camelCaseKeys);
  }

  return Object.fromEntries(Object.entries(value).map(([k, v]) => (
    [k.toLowerCase().split("_").reduce((acc, part) => `${acc}${part[0].toUpperCase()}${part.slice(1)}`), v]
  )));
};

export default camelCaseKeys;
