const formatTime = (time) => {
  const hours = Math.floor(time / 3600).toString();
  let minutes = Math.floor((time % 3600) / 60).toString();
  let seconds = Math.floor(time % 60).toString();

  if (seconds.length < 2) { seconds = `0${seconds}`; }

  if (time < 3600) {
    return `${minutes}:${seconds}`;
  } else {
    if (minutes.length < 2) { minutes = `0${minutes}`; }
    return `${hours}:${minutes}:${seconds}`;
  }
};

export default formatTime;
