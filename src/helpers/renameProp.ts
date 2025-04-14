const renameProp = (from, to, object) => {
  if (typeof object[from] === "undefined") { return; }

  object[to] = object[from];
  delete object[from];
};

export default renameProp;
