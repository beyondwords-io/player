const diffObject = (objBefore, objAfter) => {
  const keys = new Set([...Object.keys(objBefore), ...Object.keys(objAfter)]);
  const diff = {};

  for (const key of keys) {
    const valueBefore = objBefore[key];
    const valueAfter = objAfter[key];

    if (valueBefore !== valueAfter) {
      diff[key] = { previousValue: valueBefore, currentValue: valueAfter };
    }
  }

  return diff;
};

export default diffObject;
