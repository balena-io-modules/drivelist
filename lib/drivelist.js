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

/**
 * @module drivelist
 */

const os = require('os');
const bindings = require('bindings');
const lsblk = require('./lsblk');

/**
 * @summary List available drives
 * @function
 * @public
 *
 * @param {Function} callback - callback (error, drives)
 * @returns {Undefined}
 *
 * @example
 * const drivelist = require('drivelist');
 *
 * drivelist.list((error, drives) => {
 *   if (error) {
 *     throw error;
 *   }
 *
 *   drives.forEach((drive) => {
 *     console.log(drive);
 *   });
 * });
 */
exports.list = (callback) => {
  switch (os.platform()) {
    case 'win32':
      bindings('drivelist').list(callback);
      break;
    case 'darwin':
      bindings('drivelist').list(callback);
      break;
    case 'linux':
      lsblk(callback);
      break;
    default:
      return callback(new Error(`Your OS is not supported by this module: ${os.platform()}`));
  }
};
