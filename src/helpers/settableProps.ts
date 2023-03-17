const settableProps = (object) => {
  const descriptors = Object.getOwnPropertyDescriptors(object);
  const setters = Object.entries(descriptors).filter(([_, { set }]) => set);

  const propNames = setters.map(([k, _]) => k).filter(k => !ignoreList.has(k));
  const keyValues = propNames.map(name => [name, object[name]]);

  return Object.fromEntries(keyValues);
};

const ignoreList = new Set([
  "addEventListener",
  "removeEventListener",
  "mediaElement",
  "userInterface",
  "widgetInterface",
  "controller",
]);

export default settableProps;
