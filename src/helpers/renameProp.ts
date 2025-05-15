const renameProp = (from, to, object, mapFn = () => {}) => {
  if (typeof object[from] === "undefined") { return; }

  object[to] = mapFn(object[from]);
  delete object[from];
};

export default renameProp;
