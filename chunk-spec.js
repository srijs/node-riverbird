'use strict';

var assert = require('assert');
var stream = require('stream');

var Chunk = require('./chunk');

describe('Chunk', function () {

  describe('hasNext', function () {

    it('returns true before data is available', function () {
      var s = new stream.PassThrough();
      var c = new Chunk(null, s);
      assert(c.hasNext());
    });

    it('returns true after data is available', function () {
      var s = new stream.PassThrough();
      var c = new Chunk(null, s);
      s.end('abc');
      assert(c.hasNext());
    });

    it('returns false after all data has been read', function (done) {
      var s = new stream.PassThrough();
      var c = new Chunk(null, s);
      s.end();
      c.next(function (chunk) {
        assert(!chunk.hasNext());
      }).done(done);
    });

  });

  describe('next', function () {

    describe('error', function () {

      it('catches errors before the next request', function (done) {
        var s = new stream.PassThrough();
        var c = new Chunk(null, s);
        var e = new Error('MEH!');
        s.emit('error', e);
        c.next(null, function (err) {
          assert.equal(err, e);
          done();
        });
      });

      it('catches errors after the next request', function (done) {
        var s = new stream.PassThrough();
        var c = new Chunk(null, s);
        var e = new Error('MEH!');
        c.next(null, function (err) {
          assert.equal(err, e);
          done();
        });
        s.emit('error', e);
      });

      it('catches error in the long form (next-then)', function (done) {
        var s = new stream.PassThrough();
        var c = new Chunk(null, s);
        var e = new Error('MEH!');
        c.next().then(null, function (err) {
          assert.equal(err, e);
          done();
        });
        s.emit('error', e);
      });

      it('catches error in a second handler', function (done) {
        var s = new stream.PassThrough();
        var c = new Chunk(null, s);
        var d = new Buffer('MEH!');
        var e = new Error('MEH!');
        c.next(function (chunk) {
          assert.equal(chunk.data, d);
          chunk.next(null, function (err) {
            assert.equal(err, e);
            done();
          });
        });
        s.write(d);
        s.emit('error', e);
      });

    });

    describe('data', function () {

      it('gets data emitted before the next request', function (done) {
        var s = new stream.PassThrough();
        var c = new Chunk(null, s);
        var d = new Buffer('MEH!');
        s.write(d);
        c.next(function (chunk) {
          assert.equal(chunk.data, d);
          done();
        });
      });

      it('gets data emitted after the next request', function (done) {
        var s = new stream.PassThrough();
        var c = new Chunk(null, s);
        var d = new Buffer('MEH!');
        c.next(function (chunk) {
          assert.equal(chunk.data, d);
          done();
        });
        s.write(d);
      });

      it('gets data in the long form (next-then)', function (done) {
        var s = new stream.PassThrough();
        var c = new Chunk(null, s);
        var d = new Buffer('MEH!');
        c.next().then(function (chunk) {
          assert.equal(chunk.data, d);
          done();
        });
        s.write(d);
      });

      it('gets data in a second handler', function (done) {
        var s = new stream.PassThrough();
        var c = new Chunk(null, s);
        var d1 = new Buffer('MEH!1');
        var d2 = new Buffer('MEH!2');
        c.next(function (chunk1) {
          assert.equal(chunk1.data, d1);
          chunk1.next(function (chunk2) {
            assert.equal(chunk2.data, d2);
            done();
          });
        });
        s.write(d1);
        s.write(d2);
      });

    });

    describe('end', function () {

      it('gets end emitted before the next request', function (done) {
        var s = new stream.PassThrough();
        var c = new Chunk(null, s);
        s.end();
        c.next(function (chunk) {
          assert(!chunk.hasNext());
          done();
        });
      });

      it('gets end emitted after the next request', function (done) {
        var s = new stream.PassThrough();
        var c = new Chunk(null, s);
        c.next(function (chunk) {
          assert(!chunk.hasNext());
          done();
        });
        s.end();
      });

      it('gets end in the long form (next-then)', function (done) {
        var s = new stream.PassThrough();
        var c = new Chunk(null, s);
        c.next().then(function (chunk) {
          assert(!chunk.hasNext());
          done();
        });
        s.end();
      });

      it('gets end in a second handler', function (done) {
        var s = new stream.PassThrough();
        var c = new Chunk(null, s);
        var d = new Buffer('MEH!');
        c.next(function (chunk1) {
          assert.equal(chunk1.data, d);
          chunk1.next(function (chunk2) {
            assert(!chunk2.hasNext());
            done();
          });
        });
        s.end(d);
      });

    });

  });

  describe('hasNextAvailable', function () {

    it('returns false before data is available', function () {
      var s = new stream.PassThrough();
      var c = new Chunk(null, s);
      assert(!c.hasNextAvailable());
    });

    it('returns true after data is available', function (done) {
      var s = new stream.PassThrough();
      var c = new Chunk(null, s);
      s.end('abc');
      c.next(function () {
        assert(c.hasNextAvailable());
      }).done(done);
    });

    it('returns false after all data has been read', function (done) {
      var s = new stream.PassThrough();
      var c = new Chunk(null, s);
      s.end();
      c.next(function (chunk) {
        assert(!chunk.hasNextAvailable());
      }).done(done);
    });

  });

  describe('nextAvailable', function () {

    it('returns data after data is available', function (done) {
      var s = new stream.PassThrough();
      var c = new Chunk(null, s);
      s.end('abc');
      c.next(function (chunk) {
        assert.equal(c.nextAvailable(), chunk);
      }).done(done);
    });

  });

});
