'use strict';

const m = require('mochainon');
const drivelist = require('../lib/drivelist');

describe('IntervalEmitter', function() {

  describe('given no available drives', function() {

    beforeEach(function() {
      this.drivesListStub = m.sinon.stub(drivelist, 'list');
      this.drivesListStub.yields(null, []);
    });

    afterEach(function() {
      this.drivesListStub.restore();
    });

    it('should emit an empty array', function(done) {
      const scanner = new drivelist.IntervalEmitter(1000);
      scanner.on('drives', function(drives) {
        m.chai.expect(drives).to.deep.equal([]);
        scanner.stop();
        done();
      });

      scanner.start();
    });

  });

  describe('given available drives', function() {

    const DRIVES0 = [ 'a', 'b' ];
    const DRIVES1 = [ 'b', 'c' ];
    const DRIVES2 = [ 'c' ];

    beforeEach(function() {
      this.drivesListStub = m.sinon.stub(drivelist, 'list');
      this.drivesListStub.onCall(0).yields(null, DRIVES0);
      this.drivesListStub.onCall(1).yields(null, DRIVES1);
      this.drivesListStub.onCall(2).yields(null, DRIVES2);
    });

    afterEach(function() {
      this.drivesListStub.restore();
    });

    it('should emit the drives', function(done) {
      const scanner = new drivelist.IntervalEmitter(10);

      let called = 0;
      scanner.on('drives', function(drives) {
        if (called === 0) {
          m.chai.expect(drives).to.deep.equal(DRIVES0);
        } else if (called === 1) {
          m.chai.expect(drives).to.deep.equal(DRIVES1);
        } else {
          m.chai.expect(drives).to.deep.equal(DRIVES2);
          scanner.stop();
          done();
        }
        called += 1;
      });

      scanner.start();
    });
  });

  describe('given an error when listing the drives', function() {

    beforeEach(function() {
      this.drivesListStub = m.sinon.stub(drivelist, 'list');
      this.drivesListStub.yields(new Error('scan error'));
    });

    afterEach(function() {
      this.drivesListStub.restore();
    });

    it('should emit the error', function(done) {
      const scanner = new drivelist.IntervalEmitter(2000);
      scanner.on('error', function(error) {
        m.chai.expect(error).to.be.an.instanceof(Error);
        m.chai.expect(error.message).to.equal('scan error');
        scanner.stop();
        done();
      });
      scanner.start();
    });
  });
});
