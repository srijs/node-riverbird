'use strict';

var Promise = require('bluebird');

/**
 * @class Chunk
 * @param {Buffer} data - initial data
 * @param {stream.Readable} stream - stream to read from
 */
var Chunk = module.exports = function (data, stream) {

  this.data = new Buffer(0);

  if (Buffer.isBuffer(data)) {
    this.data = data;
  }

  if (typeof data === 'string') {
    this.data = new Buffer(data);
  }

  if (stream) {

    this._stream = stream;
 
    stream.pause();
    stream.removeAllListeners('error');
    stream.removeAllListeners('data');
    stream.removeAllListeners('end');

    this._next = new Promise(function (resolve, reject) {
      stream.on('error', reject);
      stream.on('data', function (data) {
        resolve(new Chunk(data, stream));
      });
      stream.on('end', function () {
        resolve(new Chunk());
      });
    });

  }

};

/**
 * Checks whether there are more chunks to read.
 * @returns {boolean} - false if end of stream
 */
Chunk.prototype.hasNext = function () {
  return !!this._next;
};

/**
 * Reads the next chunk in the stream.
 * @param {Function} onSuccess - the handler to call on success
 * @param {Function} onFailure - the handler to call on failure
 * @returns {Promise} - a promise, resolved on success, rejected on failure
 */
Chunk.prototype.next = function (onSuccess, onFailure) {
  // Switch chunk from present to past,
  // resume and unlink stream.
  var stream = this._stream;
  if (stream) {
    this._stream = null;
    stream.resume();
  }
  return this._next.then(onSuccess, onFailure);
};
