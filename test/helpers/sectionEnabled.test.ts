import sectionEnabled from "../../src/helpers/sectionEnabled";

describe("sectionEnabled", () => {
  it("returns true if the segment's section is a member of the enabled sections", () => {
    expect(sectionEnabled("current", { section: "title" }, "all")).toEqual(true);
    expect(sectionEnabled("current", { section: "body" }, "all")).toEqual(true);

    expect(sectionEnabled("current", { section: "title" }, "body")).toEqual(false);
    expect(sectionEnabled("current", { section: "body" }, "body")).toEqual(true);

    expect(sectionEnabled("current", { section: "title" }, "none")).toEqual(false);
    expect(sectionEnabled("current", { section: "body" }, "none")).toEqual(false);
  });

  describe("when a double-barrelled section specified is given", () => {
    it("checks membership of the 'current' and 'hovered' segment independently", () => {
      expect(sectionEnabled("current", { section: "title" }, "none-all")).toEqual(false);
      expect(sectionEnabled("hovered", { section: "title" }, "all-none")).toEqual(false);

      expect(sectionEnabled("current", { section: "body" }, "body-none")).toEqual(true);
      expect(sectionEnabled("hovered", { section: "body" }, "body-none")).toEqual(false);
    });
  });
});
