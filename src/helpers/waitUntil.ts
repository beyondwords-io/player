const waitUntil = (conditionFn) => {
  if (conditionFn()) { return; }

  return new Promise(resolve => {
    setInterval(() => conditionFn() && resolve(), 10);
  });
};

export default waitUntil;
