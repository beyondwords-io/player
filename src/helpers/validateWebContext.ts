import throwError from "./throwError";

const validateWebContext = () => {
  if (typeof window !== "undefined") { return; }

  throwError([
    "Trying to initialize BeyondWords.Player in a server context but this is unsupported.",
    "Please only initialize the player in a context where the global window object is available.",
    "For example, by initializing the player inside a useEffect hook in a React application.",
  ]);
};

export default validateWebContext;
