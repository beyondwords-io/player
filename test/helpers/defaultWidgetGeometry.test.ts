import { resolveDefaultWidgetGeometry, resolveFixedWidgetGeometry } from "../../src/helpers/defaultWidgetGeometry";

describe("default widget geometry", () => {
  it("centres and sizes an automatic default widget", () => {
    expect(resolveDefaultWidgetGeometry({
      docked: false,
      isDefault: true,
      margin: "16px 24px",
      position: "auto",
      width: "auto",
    })).toEqual({
      margin: "16px 24px",
      position: "center",
      width: "min(440px, calc(100vw - 24px - 24px))",
    });
  });

  it("docks the default widget edge to edge on mobile", () => {
    expect(resolveDefaultWidgetGeometry({ docked: true, isDefault: true, margin: "16px", position: "auto", width: 0 })).toEqual({
      margin: "0",
      position: "center",
      width: "100vw",
    });
  });

  it("passes legacy widget geometry through", () => {
    expect(resolveDefaultWidgetGeometry({ docked: true, isDefault: false, margin: "20px", position: "right", width: "360px" })).toEqual({
      margin: "20px",
      position: "right",
      width: "360px",
    });
  });

  it("resolves the fixed surface geometry from the same inputs", () => {
    expect(resolveFixedWidgetGeometry({ docked: false, isWidget: true, margin: "16px", position: "auto", width: "auto" })).toEqual({
      fixed: true,
      side: "center",
      widthStyle: "min(440px, calc(100vw - 16px - 16px))",
    });
  });
});
