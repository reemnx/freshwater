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

function isParseable(dataToParse) {
  try {
    return JSON.parse(dataToParse);
  } catch (error) {
    return 0;
  }
}

module.exports = { filterBy, isParseable, orderBy };
