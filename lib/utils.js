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

/**
 * @summary Test if a path represents a file
 * @function
 * @public
 *
 * @param {String} path - path
 * @param {Function} callback - callback(error, isFile)
 *
 * @example
 * utils.isFile('my/file', (error, isFile) => {
 *   if (error) throw error;
 *
 *   if (isFile) {
 *     console.log('This is a file!');
 *   }
 * });
 */
exports.isFile = (path, callback) => {
  fs.stat(path, (error, stats) => {
    if (error) {
      if (error.code === 'ENOENT') {
        return callback(null, false);
      }

      return callback(error);
    }

    return callback(null, stats.isFile());
  });
};
