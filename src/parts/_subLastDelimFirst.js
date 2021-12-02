const { _indexOfFirst } = require(`./_indexOfFirst.js`)
const { _subLength } = require(`./_subLength.js`)

const _subLastDelimFirst = (str, delimiter) => {
  const index = _indexOfFirst(str, delimiter);
  if (index === -1) {
    return ``;
  } else {
    return _subLength(str, index + delimiter.length);
  }
};

module.exports = { _subLastDelimFirst }
