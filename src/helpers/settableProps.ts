const settableProps = (object) => {
  const descriptors = Object.getOwnPropertyDescriptors(object);
  const setters = Object.entries(descriptors).filter(([_, { set }]) => set);

  const propNames = setters.map(([k, _]) => k);
  const keyValues = propNames.map(name => [name, object[name]]);

  return Object.fromEntries(keyValues);
}

export default settableProps;
