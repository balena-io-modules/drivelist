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

const m = require('mochainon');
const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const scripts = require('../lib/scripts.json');

describe('Scripts', function() {

  const checkCompiledScript = (script, scriptPath) => {
    it(`should match ${path.basename(scriptPath)}`, function(done) {
      fs.readFile(scriptPath, {
        encoding: 'utf8'
      }, (error, content) => {
        m.chai.expect(error).to.not.exist;
        m.chai.expect(_.omit(script, 'checksum')).to.deep.equal({
          originalFilename: path.basename(scriptPath),
          content,
          type: 'text',
          checksumType: 'md5'
        });

        done();
      });
    });
  };

  describe('.linux', function() {
    checkCompiledScript(scripts.linux, path.join(__dirname, '..', 'scripts', 'linux.sh'));
  });

  describe('.darwin', function() {
    checkCompiledScript(scripts.darwin, path.join(__dirname, '..', 'scripts', 'darwin.sh'));
  });

});
