const emptySet = new Set();

const propertyValues = (component, ignoreList = emptySet) => {
  const propNames = Object.keys(component.$$.props).filter(name => !ignoreList.has(name));
  const keyValues = propNames.map(name => [name, component[name]]);

  return Object.fromEntries(keyValues);
};

export default propertyValues;
