
import translate from "./translate";

const humanizeTime = (n: number) => {
  const rounded = Math.floor(n);

  if (rounded === 0) { return translate("secondsPlural").replace("{n}", 0); }

  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;

  return [humanizeUnit(minutes, "minutes"), humanizeUnit(seconds, "seconds")].filter((s) => s).join(" ");
};

const humanizeUnit = (n: number, units: string) => {
  if (n === 0) { return; }
  const key = n === 1 ? `${units}Singular` : `${units}Plural`;
  return translate(key).replace("{n}", n);
};

export default humanizeTime;
