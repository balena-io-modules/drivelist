/*
 * Copyright 2018 Resin.io
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

const fs = require('fs');
const path = require('path');
const util = require('util');
const m = require('mochainon');
const parseJSON = require('../lib/lsblk/json');
const parsePairs = require('../lib/lsblk/pairs');

const inspect = (value) => {
  console.log(util.inspect(value, {
    colors: true,
    depth: null
  }));
};

describe('Drivelist', function() {

  context('lsblk', function() {

    it('can handle --pairs output on Ubuntu 14.04', function() {

      const listData = fs.readFileSync(path.join(__dirname, 'data', 'lsblk', 'ubuntu-14.04-1.txt'), 'utf8');
      const devices = parsePairs(listData);

      const expected = [ {
        enumerator: 'lsblk:pairs',
        busType: 'UNKNOWN',
        busVersion: null,
        device: '/dev/sda',
        devicePath: null,
        raw: '/dev/sda',
        description: '(/boot/efi, /, [SWAP], /home)',
        error: null,
        size: 1024209543168,
        blockSize: 512,
        logicalBlockSize: 512,
        mountpoints: [ {
          path: '/boot/efi',
          label: undefined
        }, {
          path: '',
          label: undefined
        }, {
          path: '',
          label: undefined
        }, {
          path: '/',
          label: undefined
        }, {
          path: '[SWAP]',
          label: undefined
        }, {
          path: '/home',
          label: undefined
        }, {
          path: '',
          label: undefined
        } ],
        isReadOnly: false,
        isSystem: true,
        isVirtual: null,
        isRemovable: false,
        isCard: null,
        isSCSI: null,
        isUSB: null,
        isUAS: null
      } ];

      inspect(parsePairs(listData));

      m.chai.expect(devices).to.deep.equal(expected);

    });

    it('can handle --pairs output on Ubuntu 14.04, sample 2', function() {

      const listData = fs.readFileSync(path.join(__dirname, 'data', 'lsblk', 'ubuntu-14.04-2.txt'), 'utf8');
      const devices = parsePairs(listData);

      const expected = [ {
        enumerator: 'lsblk:pairs',
        busType: 'UNKNOWN',
        busVersion: null,
        device: '/dev/fd0',
        devicePath: null,
        raw: '/dev/fd0',
        description: 'fd0',
        error: null,
        size: null,
        blockSize: 512,
        logicalBlockSize: 512,
        mountpoints: [],
        isReadOnly: false,
        isSystem: false,
        isVirtual: null,
        isRemovable: true,
        isCard: null,
        isSCSI: null,
        isUSB: null,
        isUAS: null
      }, {
        enumerator: 'lsblk:pairs',
        busType: 'UNKNOWN',
        busVersion: null,
        device: '/dev/sda',
        devicePath: null,
        raw: '/dev/sda',
        description: '(/, [SWAP])',
        error: null,
        size: null,
        blockSize: 512,
        logicalBlockSize: 512,
        mountpoints: [ {
          path: '/',
          label: undefined
        }, {
          path: '',
          label: undefined
        }, {
          path: '[SWAP]',
          label: undefined
        } ],
        isReadOnly: false,
        isSystem: true,
        isVirtual: null,
        isRemovable: false,
        isCard: null,
        isSCSI: null,
        isUSB: null,
        isUAS: null
      } ];

      inspect(parsePairs(listData));

      m.chai.expect(devices).to.deep.equal(expected);

    });

    it('can handle mountpoints on root devices', function() {

      const listData = require('./data/lsblk/no-children-mountpoints.json');
      const actual = parseJSON.transform(listData);

      const expected = [ {
        enumerator: 'lsblk:json',
        busType: 'UNKNOWN',
        busVersion: null,
        device: '/dev/sda',
        devicePath: null,
        raw: '/dev/sda',
        description: '',
        error: null,
        size: null,
        blockSize: 512,
        logicalBlockSize: 512,
        mountpoints: [ {
          path: '/media/jwentz/Temp',
          label: undefined
        } ],
        isReadOnly: false,
        isSystem: false,
        isVirtual: null,
        isRemovable: true,
        isCard: null,
        isSCSI: null,
        isUSB: null,
        isUAS: null
      }, {
        enumerator: 'lsblk:json',
        busType: 'UNKNOWN',
        busVersion: null,
        device: '/dev/nvme0n1',
        devicePath: null,
        raw: '/dev/nvme0n1',
        description: '([SWAP], /boot/efi, /)',
        error: null,
        size: null,
        blockSize: 512,
        logicalBlockSize: 512,
        mountpoints: [ {
          path: '[SWAP]',
          label: undefined
        }, {
          path: '/boot/efi',
          label: undefined
        }, {
          path: '/',
          label: undefined
        } ],
        isReadOnly: false,
        isSystem: true,
        isVirtual: null,
        isRemovable: false,
        isCard: null,
        isSCSI: null,
        isUSB: null,
        isUAS: null
      } ];

      inspect(actual);

      m.chai.expect(actual).to.deep.equal(expected);

    });

  });

});
