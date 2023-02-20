import camelCaseKeys from "../../src/helpers/camelCaseKeys";

describe("camelCaseKeys", () => {
  it("recursively converts snake case keys to camel case", () => {
    expect(camelCaseKeys({ foo_bar: null })).toEqual({ fooBar: null });
    expect(camelCaseKeys({ foo_bar_baz: null })).toEqual({ fooBarBaz: null });
    expect(camelCaseKeys({ foo_bar: { baz_qux: null } })).toEqual({ fooBar: { bazQux: null } });
    expect(camelCaseKeys({ foo_bar: [{ baz_qux: null }] })).toEqual({ fooBar: [{ bazQux: null }] });
  });
});
