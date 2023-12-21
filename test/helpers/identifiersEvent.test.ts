import identifiersEvent from "../../src/helpers/identifiersEvent";

describe("identifiersEvent", () => {
  it("it returns a new IdentifiersChanged event", () => {
    const event = identifiersEvent();

    expect(event.type).toEqual("IdentifiersChanged");
    expect(event.description).toBeDefined();
    expect(event.initiatedBy).toEqual("browser");
  });

  it("assigns a unique id to each event", () => {
    const event1 = identifiersEvent();
    const event2 = identifiersEvent();

    expect(event1.id).toBeDefined();
    expect(event2.id).toBeDefined();

    expect(event1.id).not.toEqual(event2.id);
  });
});
