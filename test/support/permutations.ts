const permutations = (object) => (
  Object.entries(object).reduce((arr, [key, values]) => (
    arr.flatMap(o => values.map(v => ({ ...o, [key]: v })))
  ), [{}])
);

export default permutations;
