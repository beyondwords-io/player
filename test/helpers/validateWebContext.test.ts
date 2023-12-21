import validateWebContext from "../../src/helpers/validateWebContext";

describe("validateWebContext", () => {
  it("errors if the function runs in a server context", () => {
    expect(() => validateWebContext({ windowObject: undefined })).toThrowError(/unsupported/i);
  });

  it("does not error if the function runs in a web context", () => {
    validateWebContext({ windowObject: window });
    validateWebContext();
  });
});
