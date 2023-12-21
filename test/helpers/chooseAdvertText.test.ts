import chooseAdvertText from "../../src/helpers/chooseAdvertText";

describe("chooseAdvertText", () => {
  it("returns the domain without the leading 'www.' if present", () => {
    expect(chooseAdvertText("https://example.com")).toEqual("example.com");
    expect(chooseAdvertText("https://www.example.com")).toEqual("example.com");
    expect(chooseAdvertText("https://www.example.com/")).toEqual("example.com");
    expect(chooseAdvertText("https://www.example.com/page.html")).toEqual("example.com");
    expect(chooseAdvertText("https://www.example.com/a/b/page.html")).toEqual("example.com");
    expect(chooseAdvertText("https://www.example.com/a/b/page.html?c=d")).toEqual("example.com");
    expect(chooseAdvertText("https://www.example.com/a/b/page.html?c=d&e=f")).toEqual("example.com");
    expect(chooseAdvertText("https://www.example.com/a/b/page.html?c=d&e=f#g")).toEqual("example.com");

    expect(chooseAdvertText("https://something-else.example.com")).toEqual("something-else.example.com");
  });

  it("returns an empty string is a URL is provided without the leading scheme", () => {
    expect(chooseAdvertText("example.com")).toEqual("");
    expect(chooseAdvertText("invalid")).toEqual("");
    expect(chooseAdvertText(null)).toEqual("");
  });
});
