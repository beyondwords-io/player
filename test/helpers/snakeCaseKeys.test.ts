import snakeCaseKeys from "../../src/helpers/snakeCaseKeys";

describe("snakeCaseKeys", () => {
  it("recursively converts camel case keys to snake case", () => {
    expect(snakeCaseKeys({ fooBar: null })).toEqual({ foo_bar: null });
    expect(snakeCaseKeys({ fooBarBaz: null })).toEqual({ foo_bar_baz: null });
    expect(snakeCaseKeys({ fooBar: { bazQux: null } })).toEqual({ foo_bar: { baz_qux: null } });
    expect(snakeCaseKeys({ fooBar: [{ bazQux: null }] })).toEqual({ foo_bar: [{ baz_qux: null }] });
  });
});
