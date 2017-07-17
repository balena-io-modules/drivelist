/*
 * Copyright 2017 Resin.io
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
const crypto = require('crypto');

/**
 * @summary Calculate a checksum from a string
 * @function
 * @public
 *
 * @param {String} type - checksum type
 * @param {String} string - string
 * @returns {String} checksum
 *
 * @example
 * const md5hash = checksum.calculateFromString('md5', 'foo');
 */
exports.calculateFromString = (type, string) => {
  return crypto.createHash(type).update(string).digest('hex');
};

/**
 * @summary Calculate a checksum from a file
 * @function
 * @public
 *
 * @param {String} type - checksum type
 * @param {String} filePath - file path
 * @param {Function} callback - callback (error, checksum)
 *
 * @example
 * checksum.calculateFromFile('path/to/foo', (error, fileChecksum) => {
 *   if (error) throw error;
 *   console.log(fileChecksum);
 * });
 */
exports.calculateFromFile = (type, filePath, callback) => {
  fs.readFile(filePath, {
    encoding: 'utf8'
  }, (error, content) => {
    if (error) {
      return callback(error);
    }

    return callback(null, exports.calculateFromString(type, content));
  });
};
