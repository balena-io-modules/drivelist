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
const execute = require('../lib/execute');
const drivelist = require('../lib/drivelist');
const scripts = require('../lib/scripts.json');

describe('Drivelist', function() {

  describe('.list()', function() {

    describe('given scripts run succesfully', function() {

      beforeEach(function() {
        this.executeExtractAndRunStub = m.sinon.stub(execute, 'extractAndRun');

        this.executeExtractAndRunStub.withArgs(scripts.linux).yields(null, [
          'enumerator: lsblk',
          'busType: UNKNOWN',
          'busVersion: "0.0"',
          'device: /dev/sda',
          'raw: /dev/sda',
          'description: "Samsung SSD 850"',
          'error: null',
          'size: 120034123776',
          'blockSize: null',
          'logicalBlockSize: null',
          'mountpoints:',
          '  - path: "/"',
          '  - path: "/boot/efi"',
          'isReadOnly: False',
          'isSystem: True',
          'isVirtual: null',
          'isRemovable: null',
          'isCard: null',
          'isSCSI: null',
          'isUSB: null',
          'isUAS: null'
        ].join('\n'));
      });

      afterEach(function() {
        this.executeExtractAndRunStub.restore();
      });

      describe('given linux', function() {

        beforeEach(function() {
          this.osPlatformStub = m.sinon.stub(os, 'platform');
          this.osPlatformStub.returns('linux');
        });

        afterEach(function() {
          this.osPlatformStub.restore();
        });

        it('should execute the linux script', function(done) {
          drivelist.list((error, drives) => {
            m.chai.expect(error).to.not.exist;
            m.chai.expect(drives).to.deep.equal([
              {
                enumerator: 'lsblk',
                busType: 'UNKNOWN',
                busVersion: '0.0',
                device: '/dev/sda',
                raw: '/dev/sda',
                description: 'Samsung SSD 850',
                error: null,
                size: 120034123776,
                blockSize: null,
                logicalBlockSize: null,
                mountpoints: [ {
                  path: '/'
                }, {
                  path: '/boot/efi'
                } ],
                isReadOnly: false,
                isSystem: true,
                isVirtual: null,
                isRemovable: null,
                isCard: null,
                isSCSI: null,
                isUSB: null,
                isUAS: null
              }
            ]);
            done();
          });
        });

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
