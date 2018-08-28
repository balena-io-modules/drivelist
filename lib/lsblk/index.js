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
const exec = require('../exec');
const parsePairs = require('./pairs');
const parseJSON = require('./json');

let SUPPORTS_JSON = true;

const getDevicePaths = (callback) => {
  const diskPathDir = '/dev/disk/by-path/';

  fs.readdir(diskPathDir, (error, ls) => {
    if (error) {
      return callback(error);
    }

    const mapping = new Map();
    let count = 0;

    const done = () => {
      count += 1;
      if (count === ls.length) {
        return callback(null, mapping);
      }
    };

    ls.map((filename) => {
      return path.join(diskPathDir, filename);
    }).forEach((filename) => {
      fs.readlink(filename, (linkError, link) => {
        if (linkError) {
          return done();
        }

        const linkPath = path.resolve(path.dirname(filename), link);
        mapping.set(linkPath, path.relative(diskPathDir, filename));
        done();
      });
    });
  });
};

const lsblk = (callback) => {
  const cmd = 'lsblk';
  const argv = [ '--bytes' ];

  if (SUPPORTS_JSON) {
    argv.push('--all', '--json', '--paths', '--output-all');
  } else {
    argv.push('--pairs', '--all');
  }

  exec(cmd, argv, (error, stdout) => {
    if (error && SUPPORTS_JSON) {
      SUPPORTS_JSON = false;
      lsblk(callback);
      return;
    } else if (error) {
      callback(error);
      return;
    }

    let devices = null;

    try {
      devices = SUPPORTS_JSON ? parseJSON(stdout) : parsePairs(stdout);
    } catch (e) {
      callback(e);
      return;
    }

    getDevicePaths((pathError, devicePaths) => {
      if (!pathError) {
        devices.forEach((device) => {
          device.devicePath = devicePaths.get(device.device);
        });
      }

      callback(null, devices);
    });

  });

};

module.exports = lsblk;
