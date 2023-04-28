const settableProps = (object) => {
  // TODO: make this better - perhaps by adding player.props()
  const propNames = Object.keys(object.$$.props).filter(k => !ignoreList.has(k));
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
