'use strict';

var assert = require('assert');
var stream = require('stream');

var Chunk = require('./chunk');
var Head = require('./head');

describe('Head', function () {

  describe('seek', function () {

    it('seeks 0 bytes from an empty chunk', function (done) {
      var c = new Chunk();
      new Head(c).seek(0).then(function (head) {
        assert(head);
        assert.equal(head._chunk, c);
        assert.equal(head._offset, 0);
      }).done(done);
    });

    it('seeks bytes inside a chunk', function (done) {
      var c = new Chunk(new Buffer('abc'));
      new Head(c).seek(2).then(function (head) {
        assert(head);
        assert.equal(head._chunk, c);
        assert.equal(head._offset, 2);
      }).done(done);
    });

    it('seeks bytes across two chunks', function (done) {
      var s = new stream.PassThrough();
      var c = new Chunk(new Buffer('abc'), s);
      new Head(c).seek(4).then(function (head) {
        assert(head);
        assert.notEqual(head._chunk, c);
        assert.equal(head._offset, 1);
      }).done(done);
      s.write('def');
    });

    it('seeks twice across three chunks', function (done) {
      var s = new stream.PassThrough();
      var c = new Chunk(new Buffer('abc'), s);
      new Head(c).seek(4).then(function (head1) {
        assert(head1);
        assert.notEqual(head1._chunk, c);
        assert.equal(head1._offset, 1);
        return head1.seek(3).then(function (head2) {
          assert(head2);
          assert.notEqual(head2._chunk, head1.chunk);
          assert.equal(head2._offset, 1);
        });
      }).done(done);
      s.write('def');
      s.write('ghij');
    });

  });

  describe('read', function () {

    it('reads 0 bytes from an empty chunk', function (done) {
      var c = new Chunk();
      new Head(c).read(0).then(function (buf) {
        assert.equal(buf.length, 0);
      }).done(done);
    });

    it('reads bytes inside a chunk', function (done) {
      var c = new Chunk('abc');
      new Head(c).read(2).then(function (buf) {
        assert.equal(buf.toString(), 'ab');
      }).done(done);
    });

    it('reads bytes inside a chunk after a seek', function (done) {
      var c = new Chunk('abc');
      new Head(c).seek(1).then(function (head) {
        return head.read(2);
      }).then(function (buf) {
        assert.equal(buf.toString(), 'bc');
      }).done(done);
    });
  });

});
