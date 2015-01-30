chai = require('chai')
expect = chai.expect
sinon = require('sinon')
chai.use(require('sinon-chai'))
childProcess = require('child_process')
win32 = require('../lib/win32')

describe 'Drivelist WIN32:', ->

	describe 'given correct output from wmic', ->

		beforeEach ->
			@childProcessStub = sinon.stub(childProcess, 'exec')
			@childProcessStub.yields null, '''
				Caption                            DeviceID               Size
				WDC WD10JPVX-75JC3T0               \\\\.\\PHYSICALDRIVE0  1000202273280
				Generic STORAGE DEVICE USB Device  \\\\.\\PHYSICALDRIVE1  15718510080
			''', undefined

		afterEach ->
			@childProcessStub.restore()

		it 'should extract the necessary information', (done) ->
			win32.list (error, drives) ->
				expect(error).to.not.exist

				expect(drives).to.deep.equal [
					{
						device: '\\\\.\\PHYSICALDRIVE0'
						description: 'WDC WD10JPVX-75JC3T0'
						size: '1000 GB'
					}
					{
						device: '\\\\.\\PHYSICALDRIVE1'
						description: 'Generic STORAGE DEVICE USB Device'
						size: '15 GB'
					}
				]

				return done()

	describe 'given stderr output', ->

		beforeEach ->
			@childProcessStub = sinon.stub(childProcess, 'exec')
			@childProcessStub.yields(null, undefined, 'Hello World')

		afterEach ->
			@childProcessStub.restore()

		it 'should return an error containing stderr output', (done) ->
			win32.list (error, drives) ->
				expect(error).to.be.an.instanceof(Error)
				expect(error.message).to.equal('Hello World')
				expect(drives).not.exist
				done()
