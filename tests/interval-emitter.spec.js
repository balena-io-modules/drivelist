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

    it('should emit an empty array as `drives`', function(done) {
      const scanner = new drivelist.IntervalEmitter(1000);
      scanner.on('drives', function(drives) {
        m.chai.expect(drives).to.deep.equal([]);
        scanner.stop();
        done();
      });

      scanner.start();
    });

    it('should emit an empty array as `change`', function(done) {
      const scanner = new drivelist.IntervalEmitter(1000);
      scanner.on('drives', function(drives) {
        m.chai.expect(drives).to.deep.equal([]);
        scanner.stop();
        done();
      });

      scanner.start();
    });

    it('should should not emit `add`', function(done) {
      const scanner = new drivelist.IntervalEmitter(10);
      scanner.on('add', function() {
        m.chai.expect.fail();
      });

      let ticks = 0;
      scanner.on('drives', function() {
        if (ticks > 2) {
          scanner.stop();
          done();
        }
        ticks += 1;
      });

      scanner.start();
    });

    it('should should not emit `remove`', function(done) {
      const scanner = new drivelist.IntervalEmitter(10);
      scanner.on('remove', function() {
        m.chai.expect.fail();
      });

      let ticks = 0;
      scanner.on('drives', function() {
        if (ticks > 2) {
          scanner.stop();
          done();
        }
        ticks += 1;
      });

      scanner.start();
    });
  });

  describe('given available drives change over time', function() {

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

    it('should emit the `drives` event', function(done) {
      const scanner = new drivelist.IntervalEmitter(10);

      let called = 0;
      scanner.on('drives', function(drives) {
        if (called === 0) {
          m.chai.expect(drives).to.deep.equal(DRIVES0);
        } else if (called === 1) {
          m.chai.expect(drives).to.deep.equal(DRIVES1);
        } else if (called === 2) {
          m.chai.expect(drives).to.deep.equal(DRIVES2);
          scanner.stop();
          done();
        }
        called += 1;
      });

      scanner.start();
    });

    it('should emit the `add` event', function(done) {
      const scanner = new drivelist.IntervalEmitter(10);

      let called = 0;
      scanner.on('add', function(drives) {
        if (called === 0) {
          m.chai.expect(drives).to.deep.equal(DRIVES0);
        } else if (called === 1) {
          m.chai.expect(drives).to.deep.equal([ 'c' ]);
          scanner.stop();
          done();
        }
        called += 1;
      });
      scanner.start();
    });

    it('should emit the `remove` event', function(done) {
      const scanner = new drivelist.IntervalEmitter(10);

      let called = 0;
      scanner.on('remove', function(drives) {
        if (called === 0) {
          m.chai.expect(drives).to.deep.equal([ 'a' ]);
        } else if (called === 1) {
          m.chai.expect(drives).to.deep.equal([ 'b' ]);
          scanner.stop();
          done();
        }
        called += 1;
      });
      scanner.start();
    });

    it('should emit the `change` event', function(done) {
      const scanner = new drivelist.IntervalEmitter(10);

      let called = 0;
      scanner.on('change', function(newDrives, oldDrives) {
        if (called === 0) {
          m.chai.expect(newDrives).to.deep.equal(DRIVES0);
          m.chai.expect(oldDrives).to.deep.equal(null);
        } else if (called === 1) {
          m.chai.expect(newDrives).to.deep.equal(DRIVES1);
          m.chai.expect(oldDrives).to.deep.equal(DRIVES0);
        } else if (called === 2) {
          m.chai.expect(newDrives).to.deep.equal(DRIVES2);
          m.chai.expect(oldDrives).to.deep.equal(DRIVES1);
          scanner.stop();
          done();
        }
        called += 1;
      });
      scanner.start();
    });
  });

  describe('given available drives do not change over time', function() {
    const DRIVES0 = [ 'a', 'b' ];
    const DRIVES1 = [ 'b', 'a' ];

    beforeEach(function() {
      this.drivesListStub = m.sinon.stub(drivelist, 'list');
      this.drivesListStub.onCall(0).yields(null, DRIVES0);
      this.drivesListStub.onCall(1).yields(null, DRIVES1);
      this.drivesListStub.onCall(2).yields(null, DRIVES1);
    });

    afterEach(function() {
      this.drivesListStub.restore();
    });

    it('should emit `add` once', function(done) {
      const scanner = new drivelist.IntervalEmitter(10);
      let called = 0;
      scanner.on('add', function() {
        if (called === 0) {
          called += 1;
          return;
        }
        m.chai.expect.fail();
      });

      let ticks = 0;
      scanner.on('drives', function() {
        if (ticks > 1) {
          scanner.stop();
          done();
        }
        ticks += 1;
      });

      scanner.start();
    });

    it('should should not emit `remove`', function(done) {
      const scanner = new drivelist.IntervalEmitter(10);
      scanner.on('remove', function() {
        m.chai.expect.fail();
        done();
      });

      let ticks = 0;
      scanner.on('drives', function() {
        if (ticks > 1) {
          scanner.stop();
          done();
        }
        ticks += 1;
      });

      scanner.start();
    });

    it('should should emit `change` once', function(done) {
      const scanner = new drivelist.IntervalEmitter(10);

      let called = 0;
      scanner.on('change', function() {
        if (called === 0) {
          called += 1;
          return;
        }
        m.chai.expect.fail();
      });

      let ticks = 0;
      scanner.on('drives', function() {
        if (ticks > 1) {
          scanner.stop();
          done();
        }
        ticks += 1;
      });

      scanner.start();
    });

    it('should emit `drives`', function(done) {
      const scanner = new drivelist.IntervalEmitter(10);
      let called = 0;
      scanner.on('drives', function(drives) {
        if (called === 0) {
          m.chai.expect(drives).to.deep.equal(DRIVES0);
        } else if (called === 1) {
          m.chai.expect(drives).to.deep.equal(DRIVES1);
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
