const findSegmentIndex = (segments, time) => (
  segments.findIndex(s => s.startTime <= time && time < s.startTime + s.duration)
);

export default findSegmentIndex;
