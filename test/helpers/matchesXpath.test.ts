import matchesXpath from "../../src/helpers/matchesXpath";

describe("matchesXpath", () => {
  it("returns true if the xpaths are equal", () => {
    expect(matchesXpath("/html/body/p", "/html/body/p")).toEqual(true);

    expect(matchesXpath("/html/body/p", "/html/body/div/p")).toEqual(false);
    expect(matchesXpath("/html/body/p", null)).toEqual(false);
    expect(matchesXpath("", "/html/body/p")).toEqual(false);
  });

  it("compares indexes at each level if both xpaths have indexes at the same level", () => {
    expect(matchesXpath("/html/body/p[1]", "/html/body/p[1]")).toEqual(true);
    expect(matchesXpath("/html/body/p[1]", "/html/body/p")).toEqual(true);
    expect(matchesXpath("/html/body/p", "/html/body/p[2]")).toEqual(true);
    expect(matchesXpath("/html/body/div/p[1]", "/html/body/div[2]/p")).toEqual(true);
    expect(matchesXpath("/html/body/div[2]/p", "/html/body/div[2]/p[2]")).toEqual(true);
    expect(matchesXpath("/html/body/div[999]/p", "/html/body/div/p[999]")).toEqual(true);

    expect(matchesXpath("/html/body/p[1]", "/html/body/p[2]")).toEqual(false);
    expect(matchesXpath("/html/body/div/p[1]", "/html/body/div/p[2]")).toEqual(false);
  });
});
