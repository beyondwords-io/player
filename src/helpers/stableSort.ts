const stableSort = (array, comparisonFn) => {
  const withIndexes = array.map((element, index) => [element, index]);

  withIndexes.sort(([a, i], [b, j]) => {
    const result = comparisonFn(a, b);

    if (result === -1) { return -1; }
    if (result === 1) { return 1; }

    if (i < j) { return -1; }
    if (i > j) { return 1; }

    return 0;
  });

  return withIndexes.map(([element, _index]) => element);
};

export default stableSort;
