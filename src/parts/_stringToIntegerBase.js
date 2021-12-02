const { _matchFormat } = require(`./_matchFormat.js`)
const { isInteger } = require(`./isInteger.js`)

const _stringToIntegerBase = (
  value,
  defaultValueFunc,
  radix = 10,
) => {
  if (value === ``) {
    return defaultValueFunc();
  }
  if (!_matchFormat(String(radix) + `_base_number`, value)) {
    return defaultValueFunc();
  }

  const result = parseInt(value, radix);
  if (!isInteger(result)) {
    return defaultValueFunc();
  }
  return result;
};

module.exports = { _stringToIntegerBase }
