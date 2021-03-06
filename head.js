'use strict';

var Promise = require('bluebird');

var assert = require('assert');

var bytes = require('bytes');

/**
 * @class Head
 * @param {Chunk} chunk - the chunk to point to
 * @param {number} offset - the byte offset inside the chunk
 */
var Head = module.exports = function (chunk, offset) {
  this._chunk = chunk;
  this._offset = offset || 0;
  assert(this._offset >= 0, 'offset must not be negative');
};

/**
 * Seeks forward a given number of bytes.
 * @param {number|string} n - number of bytes, e.g. '4mb'
 * @returns {Promise.<?Head>} - a new head if enough bytes are left, null otherwise
 */
Head.prototype.seek = function (n) {
  if (typeof n === 'string') {
    n = bytes(n);
  }
  if (n < 0) {
    return Promise.reject('cannot seek backwards');
  }
  if (n === 0) {
    return Promise.resolve(this);
  }
  var off = this._offset;
  var len = this._chunk.data.length;
  if (off + n < this._chunk.data.length) {
    return Promise.resolve(new Head(this._chunk, off + n));
  }
  if (!this._chunk.hasNext()) {
    return Promise.resolve(null);
  }
  return this._chunk.next(function (chunk) {
    return new Head(chunk).seek(n - (len - off));
  }.bind(this));
};

/**
 * Reads a maximum number of bytes.
 * @param {number|string} n - number of bytes, e.g. '4mb'
 * @returns {Promise.<Buffer>} - a buffer with length less or equal n
 */
Head.prototype.read = function (n) {
  if (typeof n === 'string') {
    n = bytes(n);
  }
  return this._read(n, []).then(Buffer.concat);
};

Head.prototype._read = function (n, bufs) {
  var buf = this._chunk.data.slice(this._offset, this._offset + n);
  var len = buf.length;
  if (len > 0) {
    bufs.push(buf);
  }
  if (len < n) {
    if (this._chunk.hasNext()) {
      return this._chunk.next(function (chunk) {
        var head = new Head(chunk);
        return head._read(n - len, bufs);
      });
    }
  }
  return Promise.resolve(bufs);
};
