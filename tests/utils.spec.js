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

const m = require('mochainon');
const path = require('path');
const utils = require('../lib/utils');

describe('Utils', function() {

  describe('.isFile()', function() {

    it('should yield true if the path is a file', function(done) {
      utils.isFile(__filename, (error, isFile) => {
        m.chai.expect(error).to.not.exist;
        m.chai.expect(isFile).to.be.true;
        done();
      });
    });

    it('should yield false if the path is a directory', function(done) {
      utils.isFile(__dirname, (error, isFile) => {
        m.chai.expect(error).to.not.exist;
        m.chai.expect(isFile).to.be.false;
        done();
      });
    });

    it('should yield false if the does not exist', function(done) {
      utils.isFile(path.join(__dirname, 'hello'), (error, isFile) => {
        m.chai.expect(error).to.not.exist;
        m.chai.expect(isFile).to.be.false;
        done();
      });
    });

  });

});
