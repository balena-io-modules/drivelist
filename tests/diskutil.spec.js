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

const fs = require('fs');
const path = require('path');
const m = require('mochainon');
const mockSpawn = require('mock-spawn');
const plist = require('fast-plist');
const diskutil = require('../lib/diskutil');

describe('Drivelist', function() {

  context('diskutil', function() {

    it('can handle devices without partitions', function() {

      const listData = fs.readFileSync(path.join(__dirname, 'data', 'diskutil', 'no-partition-list.plist'), 'utf8');
      const deviceData = fs.readFileSync(path.join(__dirname, 'data', 'diskutil', 'no-partition-info.plist'), 'utf8');

      const globalList = plist.parse(listData);
      const deviceInfo = plist.parse(deviceData);
      const devices = [ deviceInfo ].map(diskutil.transform);

      diskutil.setMountpoints(devices, globalList);

      m.chai.expect(devices).to.deep.equal([
        {
          enumerator: 'diskutil',
          busType: 'PCI-Express',
          busVersion: null,
          device: '/dev/disk1',
          devicePath: null,
          raw: '/dev/rdisk1',
          description: 'Macintosh HD',
          error: null,
          size: 999250984960,
          blockSize: 4096,
          logicalBlockSize: 4096,
          mountpoints: [
            {
              path: '/',
              label: 'Macintosh HD'
            }
          ],
          isReadOnly: false,
          isSystem: true,
          isVirtual: true,
          isRemovable: false,
          isCard: null,
          isSCSI: false,
          isUSB: false,
          isUAS: null
        }
      ]);

    });

    it('can handle an empty return from os', function() {
      const childProcess = require('child_process');
      const spawn = mockSpawn();

      // Return `diskutil list -plist` with null data
      spawn.setDefault(spawn.simple(0, null));

      m.sinon.stub(childProcess, 'spawn').callsFake(spawn);

      diskutil.list(function(infoError) {
        m.chai.expect(infoError).to.be.an('error');
        m.chai.expect(infoError.message).to.startsWith('Command "');
        m.chai.expect(infoError.message).to.endsWith('" returned without data');
      });
    });

  });

});
