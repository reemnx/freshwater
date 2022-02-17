const config = require("../config/index");

function filterBy(list, type) {
  const filteredList = list.filter((item) => isParseable(item[type]));
  return filteredList;
}

function orderBy(list, type = "asc", key) {
  // desc => Big to small
  // asc => Small to big
  if (type === "asc") {
    return list.sort((a, b) => a[key] - b[key]);
  } else {
    return list.sort((a, b) => b[key] - a[key]);
  }
}

function setThrottleRate(watchersLength) {
  let throttle;
  if (watchersLength == 1) {
    throttle = 1;
  } else if (watchersLength == 2) {
    throttle = 1.7;
  } else {
    throttle = 3.75;
  }
  config.opensea_throttle_rate = throttle;
}

function isParseable(dataToParse) {
  try {
    return JSON.parse(dataToParse);
  } catch (error) {
    return 0;
  }
}

module.exports = { filterBy, isParseable, orderBy, setThrottleRate };
