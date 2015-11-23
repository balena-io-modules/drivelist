child_process = require('child_process')
_ = require('lodash')
chai = require('chai')
expect = chai.expect
sinon = require('sinon')
chai.use(require('sinon-chai'))
scripts = require('../lib/scripts')

describe 'Scripts:', ->

	describe '.paths', ->

		it 'should be a plain object', ->
			expect(_.isPlainObject(scripts.paths)).to.be.true

		it 'should have a win32 string property', ->
			expect(scripts.paths.win32).to.be.a('string')

		it 'should have a linux string property', ->
			expect(scripts.paths.linux).to.be.a('string')

		it 'should have a darwin string property', ->
			expect(scripts.paths.darwin).to.be.a('string')

	describe '.run()', ->

		describe 'given an error when running the script', ->

			beforeEach ->
				@childProcessExecFileStub = sinon.stub(child_process, 'execFile')
				@childProcessExecFileStub.yields(new Error('script error'))

			afterEach ->
				@childProcessExecFileStub.restore()

			it 'should yield the error', (done) ->
				scripts.run 'foo', (error, output) ->
					expect(error).to.be.an.instanceof(Error)
					expect(error.message).to.equal('script error')
					expect(output).to.not.exist
					done()

		describe 'given the script outputs to stderr', ->

			beforeEach ->
				@childProcessExecFileStub = sinon.stub(child_process, 'execFile')
				@childProcessExecFileStub.yields(null, '', 'script error')

			afterEach ->
				@childProcessExecFileStub.restore()

			it 'should yield an error', (done) ->
				scripts.run 'foo', (error, output) ->
					expect(error).to.be.an.instanceof(Error)
					expect(error.message).to.equal('script error')
					expect(output).to.not.exist
					done()

		describe 'given the script outputs to stdout and a blank string to stderr', ->

			beforeEach ->
				@childProcessExecFileStub = sinon.stub(child_process, 'execFile')
				@childProcessExecFileStub.yields(null, 'foo bar', '   ')

			afterEach ->
				@childProcessExecFileStub.restore()

			it 'should yield the result', (done) ->
				scripts.run 'foo', (error, output) ->
					expect(error).to.not.exist
					expect(output).to.equal('foo bar')
					done()

		describe 'given the script outputs to stdout', ->

			beforeEach ->
				@childProcessExecFileStub = sinon.stub(child_process, 'execFile')
				@childProcessExecFileStub.yields(null, 'foo bar', '')

			afterEach ->
				@childProcessExecFileStub.restore()

			it 'should yield the result', (done) ->
				scripts.run 'foo', (error, output) ->
					expect(error).to.not.exist
					expect(output).to.equal('foo bar')
					done()
