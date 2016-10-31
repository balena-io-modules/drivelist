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
const parse = require('./parse');
const scripts = require('./scripts');

/**
 * @summary List available drives
 * @function
 * @public
 *
 * @param {Function} callback - callback (error, drives)
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
  const operatingSystem = os.platform();
  const script = scripts.paths[operatingSystem];

  if (!script) {
    callback(new Error(`Your OS is not supported by this module: ${operatingSystem}`));
    return;
  }

  scripts.run(script, (error, output) => {
    if (error) {
      return callback(error);
    }

    return callback(null, parse(output));
  });
};
