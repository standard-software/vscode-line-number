const { isUndefined } = require(`./type/isUndefined.js`);
const { isNull } = require(`./type/isNull.js`);
const { isBoolean } = require(`./type/isBoolean.js`);
const { isNumber } = require(`./type/isNumber.js`);
const { isInteger } = require(`./type/isInteger.js`);
const { __max } = require(`./array/__max.js`);
const { _indexOfFirst } = require(`./string/_indexOfFirst.js`);
const { _indexOfLast } = require(`./string/_indexOfLast.js`);
const { _isFirst } = require(`./string/_isFirst.js`);
const { _isLast } = require(`./string/_isLast.js`);
const { _findFirstIndex } = require(`./array/_findFirstIndex.js`);
const { _findFirst } = require(`./array/_findFirst.js`);
const { _deleteIndex } = require(`./string/_deleteIndex.js`);
const { _deleteLength } = require(`./string/_deleteLength.js`);
const { _deleteFirst } = require(`./string/_deleteFirst.js`);
const { _deleteLast } = require(`./string/_deleteLast.js`);
const { _trimFirst } = require(`./string/_trimFirst.js`);
const { _trimLast } = require(`./string/_trimLast.js`);
const { _trim } = require(`./string/_trim.js`);
const { _subLength } = require(`./string/_subLength.js`);
const { _subIndex } = require(`./string/_subIndex.js`);
const { _subFirst } = require(`./string/_subFirst.js`);
const { _subLast } = require(`./string/_subLast.js`);
const { _insert } = require(`./string/_insert.js`);
const { _includeCount } = require(`./string/_includeCount.js`);
const { _stringToIntegerDefault } = require(`./convert/_stringToIntegerDefault.js`);
const { _subFirstDelimFirst } = require(`./string/_subFirstDelimFirst.js`);
const { _subLastDelimFirst } = require(`./string/_subLastDelimFirst.js`);

module.exports = {
  isUndefined, isNull, isBoolean, isNumber, isInteger,
  __max,
  _indexOfFirst, _indexOfLast,
  _isFirst, _isLast,
  _findFirstIndex, _findFirst,
  _deleteIndex, _deleteLength,
  _deleteFirst, _deleteLast,
  _trimFirst, _trimLast, _trim,
  _subLength, _subIndex,
  _subFirst, _subLast,
  _insert,
  _includeCount,
  _stringToIntegerDefault,
  _subFirstDelimFirst, _subLastDelimFirst,
};
