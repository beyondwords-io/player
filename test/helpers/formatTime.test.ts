import formatTime from "../../src/helpers/formatTime";

describe("formatTime", () => {
  it("formats the time in seconds as hours:minutes:seconds", () => {
    expect(formatTime(0)).toEqual("0:00");
    expect(formatTime(0.9)).toEqual("0:00");

    expect(formatTime(59)).toEqual("0:59");
    expect(formatTime(59.9)).toEqual("0:59");

    expect(formatTime(60)).toEqual("1:00");
    expect(formatTime(60.9)).toEqual("1:00");

    expect(formatTime(61)).toEqual("1:01");
    expect(formatTime(119)).toEqual("1:59");
    expect(formatTime(599.9)).toEqual("9:59");

    expect(formatTime(600)).toEqual("10:00");
    expect(formatTime(659)).toEqual("10:59");
    expect(formatTime(3599.9)).toEqual("59:59");

    expect(formatTime(3600)).toEqual("1:00:00");
    expect(formatTime(3601)).toEqual("1:00:01");
    expect(formatTime(3659.9)).toEqual("1:00:59");

    expect(formatTime(999999)).toEqual("277:46:39");

    expect(formatTime(-1)).toEqual("0:00");
    expect(formatTime(-123)).toEqual("0:00");
  });
});
