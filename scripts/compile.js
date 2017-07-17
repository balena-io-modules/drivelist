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

const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const checksum = require('../lib/checksum');

const scripts = {
  darwin: path.join(__dirname, 'darwin.sh'),
  linux: path.join(__dirname, 'linux.sh')
};

const object = {
  darwin: {
    content: fs.readFileSync(scripts.darwin, { encoding: 'utf8' }),
    originalFilename: path.basename(scripts.darwin),
    type: 'text',
    checksumType: 'md5'
  },
  linux: {
    content: fs.readFileSync(scripts.linux, { encoding: 'utf8' }),
    originalFilename: path.basename(scripts.linux),
    type: 'text',
    checksumType: 'md5'
  }
};

_.each(object, (value, key) => {
  object[key].checksum = checksum.calculateFromString(object[key].checksumType, object[key].content);
});

fs.writeFileSync(path.join(__dirname, '..', 'lib', 'scripts.json'), JSON.stringify(object, null, 2));

