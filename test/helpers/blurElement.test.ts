import blurElement from "../../src/helpers/blurElement";

describe("blurElement", () => {
  it("blurs the event's currentTarget", () => {
    const button = document.createElement("button");
    const spy = vi.spyOn(button, "blur");
    const event = { currentTarget: button };

    blurElement(event);

    expect(spy).toHaveBeenCalledOnce();
  });

  it("does not blur the element when the NVDA screen reader sends an artifical mouseup event", () => {
    const button = document.createElement("button");
    const spy = vi.spyOn(button, "blur");
    const event = { currentTarget: button, detail: 0 };

    blurElement(event);

    expect(spy).not.toHaveBeenCalled();
  });
});
