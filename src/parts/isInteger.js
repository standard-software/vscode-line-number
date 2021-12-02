const { isNumber } = require(`./isNumber.js`)

const isInteger = (value) => {
  if (!isNumber(value)) {
    return false;
  }
  return Math.round(value) === value;
};

module.exports = { isInteger }
