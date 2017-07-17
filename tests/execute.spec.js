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
const fs = require('fs');
const _ = require('lodash');
const os = require('os');
const rimraf = require('rimraf');
const childProcess = require('child_process');
const execute = require('../lib/execute');

describe('Execute', function() {

  describe('.extractAndRun()', function() {

    const script1 = _.attempt(() => {
      if (os.platform() === 'win32') {
        return {
          checksumType: 'md5',
          checksum: 'a62bf332fa9cc62e5c3933f45c3136fc',
          content: '@echo off\necho foo bar baz',
          originalFilename: 'hello.bat'
        };
      }

      return {
        checksumType: 'md5',
        checksum: 'acab65be0f57742ee0507c6f12255436',
        content: '#!/bin/bash\necho "foo bar baz"',
        originalFilename: 'hello.sh'
      };
    });

    const script2 = _.attempt(() => {
      if (os.platform() === 'win32') {
        return {
          checksumType: 'md5',
          checksum: '6f8e04c811c0f0ed392bf6f5872ae1ea',
          content: '@echo off\necho bar baz qux',
          originalFilename: 'hello.bat'
        };
      }

      return {
        checksumType: 'md5',
        checksum: '9710ef6a1941c4ee6e0fade11ec14fab',
        content: '#!/bin/bash\necho "bar baz qux"',
        originalFilename: 'hello.sh'
      };
    });

    it('should execute a script for the first time', function(done) {
      rimraf(execute.getTemporaryScriptFilePath(script1), (error) => {
        m.chai.expect(error).to.not.exist;
        execute.extractAndRun(script1, (scriptError, output) => {
          m.chai.expect(scriptError).to.not.exist;
          m.chai.expect(output.trim()).to.equal('foo bar baz');
          done();
        });
      });
    });

    it('should be able to execute a script multiple times', function(done) {
      execute.extractAndRun(script1, (error1, output1) => {
        m.chai.expect(error1).to.not.exist;

        // The purpose of the trim is to get rid of
        // operating system-specific line endings
        m.chai.expect(output1.trim()).to.equal('foo bar baz');

        execute.extractAndRun(script1, (error2, output2) => {
          m.chai.expect(error2).to.not.exist;
          m.chai.expect(output2.trim()).to.equal('foo bar baz');
          done();
        });
      });
    });

    it('should execute the original script if the temporary was modified', function(done) {
      fs.writeFile(execute.getTemporaryScriptFilePath(script1), script2.content, (error) => {
        m.chai.expect(error).to.not.exist;

        execute.extractAndRun(script1, (scriptError, output) => {
          m.chai.expect(scriptError).to.not.exist;
          m.chai.expect(output.trim()).to.equal('foo bar baz');
          done();
        });
      });
    });

    it('should add executable permissions to an existing temporary file if needed', function(done) {
      fs.writeFile(execute.getTemporaryScriptFilePath(script1), script1.content, (error) => {
        m.chai.expect(error).to.not.exist;

        fs.chmod(execute.getTemporaryScriptFilePath(script1), 0o666, (chmodError) => {
          m.chai.expect(chmodError).to.not.exist;

          execute.extractAndRun(script1, (scriptError, output) => {
            m.chai.expect(scriptError).to.not.exist;
            m.chai.expect(output.trim()).to.equal('foo bar baz');
            done();
          });
        });
      });
    });

    describe('given an error when running the script', function() {

      beforeEach(function() {
        this.childProcessExecFileStub = m.sinon.stub(childProcess, 'execFile');
        const error = new Error('script error');
        error.code = 27;
        this.childProcessExecFileStub.yields(error);
      });

      afterEach(function() {
        this.childProcessExecFileStub.restore();
      });

      it('should yield the error', function(done) {
        execute.extractAndRun({
          checksumType: 'md5',
          checksum: '90c55a38064627dca337dfa5fc5be120',
          content: 'dummy content',
          originalFilename: 'foo'
        }, (error, output) => {
          m.chai.expect(error).to.be.an.instanceof(Error);
          m.chai.expect(error.message).to.equal('script error (code 27, signal none)');
          m.chai.expect(output).to.not.exist;
          done();
        });
      });

    });

    describe('given the script outputs to stderr with exit code 0', function() {

      beforeEach(function() {
        this.childProcessExecFileStub = m.sinon.stub(childProcess, 'execFile');
        this.childProcessExecFileStub.yields(null, 'foo bar', 'script error');
      });

      afterEach(function() {
        this.childProcessExecFileStub.restore();
      });

      it('should ignore stderr', function(done) {
        execute.extractAndRun({
          checksumType: 'md5',
          checksum: '90c55a38064627dca337dfa5fc5be120',
          content: 'dummy content',
          originalFilename: 'foo'
        }, (error, output) => {
          m.chai.expect(error).to.not.exist;
          m.chai.expect(output).to.equal('foo bar');
          done();
        });
      });

    });

    describe('given the script outputs to stdout and a blank string to stderr', function() {

      beforeEach(function() {
        this.childProcessExecFileStub = m.sinon.stub(childProcess, 'execFile');
        this.childProcessExecFileStub.yields(null, 'foo bar', '   ');
      });

      afterEach(function() {
        this.childProcessExecFileStub.restore();
      });

      it('should yield the result', function(done) {
        execute.extractAndRun({
          checksumType: 'md5',
          checksum: '90c55a38064627dca337dfa5fc5be120',
          content: 'dummy content',
          originalFilename: 'foo'
        }, (error, output) => {
          m.chai.expect(error).to.not.exist;
          m.chai.expect(output).to.equal('foo bar');
          done();
        });
      });

    });

    describe('given the script outputs to stdout', function() {

      beforeEach(function() {
        this.childProcessExecFileStub = m.sinon.stub(childProcess, 'execFile');
        this.childProcessExecFileStub.yields(null, 'foo bar', '');
      });

      afterEach(function() {
        this.childProcessExecFileStub.restore();
      });

      it('should yield the result', function(done) {
        execute.extractAndRun({
          checksumType: 'md5',
          checksum: '90c55a38064627dca337dfa5fc5be120',
          content: 'dummy content',
          originalFilename: 'foo'
        }, (error, output) => {
          m.chai.expect(error).to.not.exist;
          m.chai.expect(output).to.equal('foo bar');
          done();
        });
      });

    });

  });

});
