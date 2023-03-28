const basename = (path) => {
  const filename = path.split("/").pop();
  const basename = filename.split(".")[0];

  return basename;
};

export default basename;
