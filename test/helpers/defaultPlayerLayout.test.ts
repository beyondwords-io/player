import planDefaultPlayerLayout, {
  DEFAULT_PLAYER_LAYOUT_MEASUREMENTS,
  widthNeededForDefaultPlayerLayout,
} from "../../src/helpers/defaultPlayerLayout";

const input = (availableWidth: number) => ({
  availableWidth,
  centredTrack: true,
  availability: {
    chat: true,
    chip: true,
    close: false,
    download: true,
    info: true,
    overflow: true,
    queue: true,
    showTierCta: false,
    skips: true,
    speed: true,
    transport: true,
  },
  measurements: DEFAULT_PLAYER_LAYOUT_MEASUREMENTS,
});

describe("default player layout", () => {
  it("keeps every available control when the bar fits", () => {
    expect(planDefaultPlayerLayout(input(1000))).toEqual({
      chatLabel: true,
      chip: true,
      download: true,
      info: true,
      overflow: true,
      queue: true,
      skips: true,
      speed: true,
    });
  });

  it("folds controls in the documented order", () => {
    const fullInput = input(1000);
    const full = planDefaultPlayerLayout(fullInput);
    const fullWidth = widthNeededForDefaultPlayerLayout(full, fullInput);

    expect(planDefaultPlayerLayout(input(fullWidth - 1))).toMatchObject({ download: false, info: false, speed: true });
    expect(planDefaultPlayerLayout(input(500))).toMatchObject({ download: false, info: false, speed: false });
    expect(planDefaultPlayerLayout(input(400))).toMatchObject({ skips: false });
    expect(planDefaultPlayerLayout(input(300))).toMatchObject({ queue: false, chip: false });
    expect(planDefaultPlayerLayout(input(200))).toMatchObject({ chatLabel: false });
  });

  it("uses the measured translated chat width", () => {
    const normal = planDefaultPlayerLayout(input(600));
    const translated = input(600);
    translated.measurements = { ...translated.measurements, chatLabel: 700 };

    expect(normal.chatLabel).toEqual(true);
    expect(planDefaultPlayerLayout(translated).chatLabel).toEqual(false);
  });
});
