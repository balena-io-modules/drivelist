/*
 * Copyright 2016 Resin.io
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const m = require('mochainon');
const os = require('os');
const assert = require('assert');
const drivelist = require('..');

describe('Drivelist', function() {

  describe('.list()', function() {

    it('should yield results', function(done) {
      drivelist.list((error, devices) => {
        if (error) {
          console.log('stdout:\n' + error.stdout);
          console.log('stderr:\n' + error.stderr);
          assert.ifError(error);
        }
        devices.forEach((device) => {
          assert.ok(
            device.enumerator,
            `Invalid enumerator: ${device.enumerator}`
          );
          assert.ok(
            device.busType,
            `Invalid busType: ${device.busType}`
          );
          assert.ok(
            device.device,
            `Invalid device: ${device.device}`
          );
          assert.ok(
            device.raw,
            `Invalid raw: ${device.raw}`
          );
          assert.ok(
            device.description,
            `Invalid description: ${device.description}`
          );
          assert.ok(
            device.error === null,
            `Invalid error: ${device.error}`
          );
          assert.ok(
            Number.isFinite(device.size),
            `Invalid size: ${device.size}`
          );
          assert.ok(
            Number.isFinite(device.blockSize),
            `Invalid blockSize: ${device.blockSize}`
          );
          assert.ok(
            Number.isFinite(device.logicalBlockSize),
            `Invalid logicalBlockSize: ${device.logicalBlockSize}`
          );
          assert.ok(
            Array.isArray(device.mountpoints),
            `Invalid mountpoints: ${device.mountpoints}`
          );
          assert.ok(
            device.isReadOnly == null || typeof device.isReadOnly === 'boolean',
            `Invalid isReadOnly flag: ${device.isReadOnly}`
          );
          assert.ok(
            device.isSystem == null || typeof device.isSystem === 'boolean',
            `Invalid isSystem flag: ${device.isSystem}`
          );
          assert.ok(
            device.isVirtual == null || typeof device.isVirtual === 'boolean',
            `Invalid isVirtual flag: ${device.isVirtual}`
          );
          assert.ok(
            device.isRemovable == null || typeof device.isRemovable === 'boolean',
            `Invalid isRemovable flag: ${device.isRemovable}`
          );
          assert.ok(
            device.isCard == null || typeof device.isCard === 'boolean',
            `Invalid isCard flag: ${device.isCard}`
          );
          assert.ok(
            device.isSCSI == null || typeof device.isSCSI === 'boolean',
            `Invalid isSCSI flag: ${device.isSCSI}`
          );
          assert.ok(
            device.isUSB == null || typeof device.isUSB === 'boolean',
            `Invalid isUSB flag: ${device.isUSB}`
          );
          assert.ok(
            device.isUAS == null || typeof device.isUAS === 'boolean',
            `Invalid isUAS flag: ${device.isUAS}`
          );
        });
        done();
      });
    });

    describe('given an unsupported os', function() {

      beforeEach(function() {
        this.osPlatformStub = m.sinon.stub(os, 'platform');
        this.osPlatformStub.returns('foobar');
      });

      afterEach(function() {
        this.osPlatformStub.restore();
      });

      it('should yield an unsupported error', function(done) {
        drivelist.list((error, drives) => {
          m.chai.expect(error).to.be.an.instanceof(Error);
          m.chai.expect(error.message).to.equal('Your OS is not supported by this module: foobar');
          m.chai.expect(drives).to.not.exist;
          done();
        });
      });

    });

  });

});
