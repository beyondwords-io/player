const snakeCaseKeys = (value) => {
  if (typeof value !== 'object' || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(snakeCaseKeys);
  }

  return Object.fromEntries(Object.entries(value).map(([k, v]) => (
    [k.replace(/([A-Z])/g, c => `_${c.toLowerCase()}`), snakeCaseKeys(v)]
  )));
};

export default snakeCaseKeys;
