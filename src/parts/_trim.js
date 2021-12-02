const { isUndefined } = require(`./isUndefined.js`)
const { _findFirst } = require(`./_findFirst.js`)
const { _isFirst } = require(`./_isFirst.js`)
const { _isLast } = require(`./_isLast.js`)
const { _deleteFirst } = require(`./_deleteFirst.js`)
const { _deleteLast } = require(`./_deleteLast.js`)

const _trim = (
  str,
  valueFirstArray = [` `, `\r`, `\n`, `\t`],
  valueLastArray = valueFirstArray,
) => {
  while (true) {
    const value = _findFirst(
      valueFirstArray, value => _isFirst(str, value),
    );
    if (isUndefined(value)) {
      break;
    }
    str = _deleteFirst(str, value.length);
  }
  while (true) {
    const value = _findFirst(
      valueLastArray, value => _isLast(str, value),
    );
    if (isUndefined(value)) {
      break;
    }
    str = _deleteLast(str, value.length);
  }
  return str;
};

module.exports = { _trim }
