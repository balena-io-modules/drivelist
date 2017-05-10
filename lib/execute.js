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

const debug = require('debug')(require('../package.json').name);
const Bluebird = require('bluebird');
const fs = Bluebird.promisifyAll(require('fs'));
const childProcess = require('child_process');
const path = require('path');
const tmp = require('tmp');
tmp.setGracefulCleanup();

/**
 * @summary Create a temporary script file with the given contents
 * @function
 * @private
 *
 * @param {String} extension - temporary script file extension
 * @param {String} contents - temporary script contents
 * @fulfil {String} - temporary script file path
 * @returns {Promise}
 *
 * @example
 * createTemporaryScriptFile('.sh', '#!/bin/bash\necho "Foo"').then((temporaryPath) => {
 *   console.log(temporaryPath);
 * })
 */
const createTemporaryScriptFile = (extension, contents) => {
  return new Bluebird((resolve, reject) => {
    tmp.file({
      postfix: extension,

      // 0755 to decimal, because strict
      // mode disallows octal literals
      mode: 493

    }, (error, temporaryPath, fileDescriptor) => {
      if (error) {
        return reject(error);
      }

      return fs.writeFileAsync(fileDescriptor, contents)
        .return(fileDescriptor)
        .then(fs.closeAsync)
        .return(temporaryPath)
        .then(resolve)
        .catch(reject);
    });
  });
};

/**
 * @summary Extract and run an inline script
 * @function
 * @public
 *
 * @param {Object} script - script
 * @param {String} script.content - script content
 * @param {String} script.originalFilename - script original filename
 * @param {Function} callback - callback (error, output)
 *
 * @example
 * scripts.run({
 *   content: '#!/bin/bash\necho Foo',
 *   originalFilename: 'myscript.sh'
 * }, (error, output) => {
 *   if (error) {
 *     throw error;
 *   }
 *
 *   console.log(output);
 * });
 */
exports.extractAndRun = (script, callback) => {
  const extension = path.extname(script.originalFilename);
  createTemporaryScriptFile(extension, script.content).then((temporaryPath) => {
    return new Bluebird((resolve, reject) => {

      // On Windows, if the directory containing the temporary
      // path includes an ampersand (e.g. if the username contains
      // an ampersand) then `.execFile` will fail, even with proper
      // quoting, which is why we're using `.exec` instead.
      return childProcess.exec(`"${temporaryPath}"`, (error, stdout, stderr) => {
        if (error) {

          // For debugging purposes
          error.message += ` (code ${error.code})`;
          debug('stderr: %s', stderr);
          debug('stdout: %s', stdout);

          return reject(error);
        }

        // Don't throw an error if we get `stderr` output from
        // the drive detection scripts at this point, given that
        // if the script already exitted with code zero, then
        // we consider them warnings that we can safely ignore.
        if (stderr.trim().length) {
          debug('stderr: %s', stderr);
        }

        return resolve(stdout);
      });
    });
  }).asCallback(callback);
};
