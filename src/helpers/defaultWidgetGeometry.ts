import parseMargin from "./parseMargin";

type WidgetPosition = string | boolean | null | undefined;
type WidgetWidth = string | number | null | undefined;

interface DefaultWidgetGeometryInput {
  docked: boolean;
  isDefault: boolean;
  margin: string | null | undefined;
  position: WidgetPosition;
  width: WidgetWidth;
}

interface DefaultWidgetGeometry {
  margin: string | null | undefined;
  position: WidgetPosition;
  width: WidgetWidth;
}

interface FixedWidgetGeometryInput {
  docked: boolean;
  isWidget: boolean;
  margin: string | null | undefined;
  position: WidgetPosition;
  width: WidgetWidth;
}

interface FixedWidgetGeometry {
  fixed: boolean;
  side: WidgetPosition;
  widthStyle: string | number;
}

const automaticWidth = (margin: string): string => {
  const sideMargins = parseMargin(margin);
  return `min(440px, calc(100vw - ${sideMargins.left} - ${sideMargins.right}))`;
};

const isAutomaticWidth = (width: WidgetWidth): boolean => width === "auto" || width === 0 || width === "0";

const resolveDefaultWidgetGeometry = ({
  docked,
  isDefault,
  margin,
  position,
  width,
}: DefaultWidgetGeometryInput): DefaultWidgetGeometry => {
  const effectiveMargin = margin || "16px";

  return {
    position: isDefault && position === "auto" ? "center" : position,
    width: isDefault && isAutomaticWidth(width)
      ? docked ? "100vw" : automaticWidth(effectiveMargin)
      : width,
    margin: isDefault && docked ? "0" : margin,
  };
};

const resolveFixedWidgetGeometry = ({
  docked,
  isWidget,
  margin,
  position,
  width,
}: FixedWidgetGeometryInput): FixedWidgetGeometry => {
  const fixed = isWidget && !!position;
  const effectiveMargin = margin || "16px";

  return {
    fixed,
    side: position === "auto" || position === true ? "center" : position,
    widthStyle: !fixed
      ? ""
      : docked
        ? "100%"
        : isAutomaticWidth(width) ? automaticWidth(effectiveMargin) : width || "",
  };
};

export { resolveDefaultWidgetGeometry, resolveFixedWidgetGeometry };
export type {
  DefaultWidgetGeometry,
  DefaultWidgetGeometryInput,
  FixedWidgetGeometry,
  FixedWidgetGeometryInput,
  WidgetPosition,
  WidgetWidth,
};
