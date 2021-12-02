const { _stringToIntegerBase } = require(`./_stringToIntegerBase.js`)

const _stringToIntegerDefault = (
  value,
  defaultValue,
  radix = 10,
) => {
  return _stringToIntegerBase(
    value,
    () => defaultValue,
    radix,
  );
};

module.exports = { _stringToIntegerDefault }
