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

const yaml = require('js-yaml');

/**
 * @summary Parse drivelist scripts output
 * @function
 * @public
 *
 * @param {String} input - input text
 * @returns {Object} parsed drivelist script output
 *
 * @example
 * const drives = parse([
 *   'device: /dev/disk1',
 *   'description: Macintosh HD',
 *   'size: 249.8 GB',
 *   'mountpoint: /',
 *   '',
 *   'device: /dev/disk2',
 *   'description: elementary OS',
 *   'size: 15.7 GB',
 *   'mountpoint: /Volumes/Elementary'
 * ].join('\n'));
 *
 * console.log(drives);
 *
 * > [
 * >   {
 * >     device: '/dev/disk1',
 * >     description: 'Macintosh HD',
 * >     size: '249.8 GB',
 * >     mountpoint: '/'
 * >   }
 * >  ,
 * >   {
 * >     device: '/dev/disk2',
 * >     description: 'elementary OS',
 * >     size: '15.7 GB',
 * >     mountpoint: '/Volumes/Elementary'
 * >   }
 * > ]
 */
module.exports = (input) => {
  if (!input || !input.trim()) {
    return [];
  }

  const allowedEscapes = [ 'b', 'f', 'n', 'r', 't', 'v' ];

  return input.split(/\n\s*\n/g)
    .map((device) => {
      device = device.split(/\r?\n/g)
        .filter((line) => {
          return /^(\s\s-\s)?[a-z]+:/i.test(line);
        })
        .map((line) => {
          return line
            .replace(/\\[^.\\]/g, (match, index, string) => {
              const escapedCharacter = match[match.length - 1];

              // Remove non printable ascii characters
              // See http://stackoverflow.com/a/24229554
              if (string[index - 1] === '\\' || allowedEscapes.indexOf(escapedCharacter) !== -1) {
                return match;
              }

              return escapedCharacter;
            })
            .replace(/[^\x20-\x7E]+/g, '')
            .replace(/"/g, (match, index, string) => {
              if (string.indexOf('"') === index || string.lastIndexOf('"') === index) {
                return match;
              }

              return '\\"';
            });
        })
        .join('\n');

      const result = yaml.safeLoad(device);

      if (typeof result === 'string') {
        const data = {};
        data[result] = null;
        return data;
      }

      if (!result || !result.device) {
        return null;
      }

      return result;
    })
    .filter((result) => {
      return Boolean(result);
    });
};
