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

const packageJSON = require('../package.json');
const debug = require('debug')(packageJSON.name);
const fs = require('fs');
const childProcess = require('child_process');
const path = require('path');
const os = require('os');
const rimraf = require('rimraf');
const checksum = require('./checksum');
const utils = require('./utils');
const MODE_EXECUTABLE = 0o755;

/**
 * @summary Get the path to the temporary location of a script
 * @function
 * @private
 *
 * @description
 * Exposed for testing purposes.
 *
 * @param {Object} script - script
 * @returns {String} temporary path
 *
 * @example
 * const scripts = require('./scripts.json');
 * const path = execute.getTemporaryScriptFilePath(scripts.darwin);
 * console.log(path);
 */
exports.getTemporaryScriptFilePath = (script) => {
  const scriptFileName = `${packageJSON.name}-${packageJSON.version}-${script.originalFilename}`;
  return path.join(os.tmpdir(), scriptFileName);
};

/**
 * @summary Create an executable file with certain text contents
 * @function
 * @private
 *
 * @param {String} content - string contents
 * @param {String} output - output file path
 * @param {Function} callback - callback (error)
 *
 * @example
 * createExecutableFile('#!/bin/bash\necho "foo"', 'myscript.sh', (error) => {
 *   if (error) throw error;
 * });
 */
const createExecutableFile = (content, output, callback) => {

  // Lets cleanup the output location just in case its something
  // that might prevent us from creating the file later on, like
  // a directory with the exact same name.
  rimraf(output, (error) => {

    if (error) {
      return callback(error);
    }

    return fs.writeFile(output, content, {
      mode: MODE_EXECUTABLE
    }, callback);
  });
};

/**
 * @summary Create a script file, caching when possible
 * @function
 * @private
 *
 * @param {Object} script - script object
 * @param {String} output - output file path
 * @param {Function} callback - callback (error)
 *
 * @example
 * const scripts = require('./scripts.json');
 * createScriptFile(scripts.darwin, 'myscript.sh', (error) => {
 *   if (error) throw error;
 * });
 */
const createScriptFile = (script, output, callback) => {
  utils.isFile(output, (error, isFile) => {
    if (error) {
      return callback(error);
    }

    if (!isFile) {
      debug('Creating script for the first time', output);
      return createExecutableFile(script.content, output, callback);
    }

    // Integrity check, so we don't expose a vulnerability by letting
    // other processes make this module run arbitrary code.
    checksum.calculateFromFile(script.checksumType, output, (checksumError, scriptChecksum) => {
      if (checksumError) {
        return callback(checksumError);
      }

      if (script.checksum === scriptChecksum) {
        debug('Reusing script', output);

        // Ensure the file has execution permissions, just in case
        return fs.chmod(output, MODE_EXECUTABLE, callback);

      }

      debug('Checksum mismatch, recreating', output);
      createExecutableFile(script.content, output, callback);
    });
  });
};

/**
 * @summary Execute a platform script
 * @function
 * @private
 *
 * @param {String} scriptPath - script path
 * @param {Function} callback - callback (error, output)
 *
 * @example
 * executeScript('path/to/script.sh', (error, output) => {
 *   if (error) throw error;
 *   console.log(output);
 * });
 */
const executeScript = (scriptPath, callback) => {
  childProcess.execFile(scriptPath, (error, stdout, stderr) => {
    if (error) {
      error.message += ` (code ${error.code}, signal ${error.signal || 'none'})`;
      debug('error:', error);
      debug('stderr: %s', stderr);
      debug('stdout: %s', stdout);
      return callback(error);
    }

    // Don't throw an error if we get `stderr` output from
    // the drive detection scripts at this point, given that
    // if the script already exitted with code zero, then
    // we consider them warnings that we can safely ignore.
    if (stderr.trim().length) {
      debug('stderr: %s', stderr);
    }

    callback(null, stdout);
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
  const temporaryFileName = exports.getTemporaryScriptFilePath(script);

  createScriptFile(script, temporaryFileName, (error) => {
    if (error) {
      return callback(error);
    }

    executeScript(temporaryFileName, callback);
  });
};
