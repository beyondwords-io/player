interface DefaultPlayerLayout {
  chatLabel: boolean;
  chip: boolean;
  download: boolean;
  info: boolean;
  overflow: boolean;
  queue: boolean;
  skips: boolean;
  speed: boolean;
}

interface DefaultPlayerLayoutAvailability {
  chat: boolean;
  chip: boolean;
  close: boolean;
  download: boolean;
  info: boolean;
  overflow: boolean;
  queue: boolean;
  showTierCta: boolean;
  skips: boolean;
  speed: boolean;
  transport: boolean;
}

interface DefaultPlayerLayoutMeasurements {
  baseGap: number;
  centredColumn: number;
  chatLabel: number;
  chatOrb: number;
  chip: number;
  control: number;
  gap: number;
  play: number;
  speed: number;
  stackedColumn: number;
  tierLock: number;
}

interface DefaultPlayerLayoutInput {
  availableWidth: number;
  availability: DefaultPlayerLayoutAvailability;
  centredTrack: boolean;
  measurements: DefaultPlayerLayoutMeasurements;
}

const DEFAULT_PLAYER_LAYOUT_MEASUREMENTS: DefaultPlayerLayoutMeasurements = {
  baseGap: 16,
  centredColumn: 112,
  chatLabel: 102,
  chatOrb: 44,
  chip: 108,
  control: 32,
  gap: 12,
  play: 40,
  speed: 30,
  stackedColumn: 100,
  tierLock: 32,
};

const widthNeededForDefaultPlayerLayout = (
  plan: DefaultPlayerLayout,
  { availability, centredTrack, measurements: m }: Omit<DefaultPlayerLayoutInput, "availableWidth">
): number => m.gap + m.baseGap + m.play
  + m.gap + (centredTrack ? m.centredColumn : m.stackedColumn)
  + (plan.chip ? m.gap + m.chip : 0)
  + (plan.skips ? 2 * (m.gap + m.control) : 0)
  + (plan.speed ? m.gap + m.speed : 0)
  + (availability.showTierCta ? m.tierLock : 0)
  + (plan.overflow ? m.gap + m.control : 0)
  + (plan.queue ? m.gap + m.control : 0)
  + (plan.download ? m.gap + m.control : 0)
  + (plan.info ? m.gap + m.control : 0)
  + (availability.chat ? m.gap + 1 + m.gap + (plan.chatLabel ? m.chatLabel : m.chatOrb) : 0)
  + (availability.close ? m.gap + m.control : 0);

const planDefaultPlayerLayout = (input: DefaultPlayerLayoutInput): DefaultPlayerLayout => {
  const { availability, availableWidth } = input;
  const plan: DefaultPlayerLayout = {
    chatLabel: true,
    chip: availability.chip,
    download: availability.download,
    info: availability.info,
    overflow: availability.overflow,
    queue: availability.queue,
    skips: availability.skips,
    speed: availability.speed,
  };

  const giveAway = [
    () => {
      plan.download = false;
      plan.info = false;
      plan.overflow = plan.overflow || availability.download || availability.info;
    },
    () => {
      plan.speed = false;
      plan.overflow = plan.overflow || availability.transport;
    },
    () => {
      plan.skips = false;
      plan.overflow = plan.overflow || availability.transport;
    },
    () => {
      plan.queue = false;
      plan.overflow = plan.overflow || availability.queue;
    },
    () => { plan.chip = false; },
    () => { plan.chatLabel = false; },
  ];

  for (const step of giveAway) {
    if (widthNeededForDefaultPlayerLayout(plan, input) <= availableWidth) { break; }
    step();
  }

  return plan;
};

export default planDefaultPlayerLayout;
export {
  DEFAULT_PLAYER_LAYOUT_MEASUREMENTS,
  widthNeededForDefaultPlayerLayout,
};
export type {
  DefaultPlayerLayout,
  DefaultPlayerLayoutAvailability,
  DefaultPlayerLayoutInput,
  DefaultPlayerLayoutMeasurements,
};
