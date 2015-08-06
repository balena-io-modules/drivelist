chai = require('chai')
expect = chai.expect
sinon = require('sinon')
chai.use(require('sinon-chai'))
childProcess = require('child_process')
win32 = require('../lib/win32')

describe 'Drivelist WIN32:', ->

	describe '.list()', ->

		describe 'given correct output from win_drives.vbs', ->

			beforeEach ->
				@childProcessStub = sinon.stub(childProcess, 'exec')
				@childProcessStub.yields null, '''
					WDC WD10JPVX-75JC3T0             	\\\\.\\PHYSICALDRIVE0	C:	1000202273280
				''', undefined

			afterEach ->
				@childProcessStub.restore()

			it 'should extract the necessary information', (done) ->
				win32.list (error, drives) ->
					expect(error).to.not.exist

					expect(drives).to.deep.equal [
						device: '\\\\.\\PHYSICALDRIVE0'
						description: 'WDC WD10JPVX-75JC3T0'
						size: '1000 GB'
						mountpoint: 'C:'
					]

					return done()

		describe 'given a USB drive', ->

			beforeEach ->
				@childProcessStub = sinon.stub(childProcess, 'exec')
				@childProcessStub.yields null, '''
					WDC WD10JPVX-75JC3T0         	\\\\.\\PHYSICALDRIVE0	C:	1000202273280
					Sony Storage Media USB Device	\\\\.\\PHYSICALDRIVE1	D:	7797565440
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
							mountpoint: 'C:'
						}
						{
							device: '\\\\.\\PHYSICALDRIVE1'
							description: 'Sony Storage Media USB Device'
							size: '7 GB'
							mountpoint: 'D:'
						}
					]

					return done()

		describe 'given a device with unknown size', ->

			beforeEach ->
				@childProcessStub = sinon.stub(childProcess, 'exec')
				@childProcessStub.yields null, '''
					WDC WD10JPVX-75JC3T0             	\\\\.\\PHYSICALDRIVE0	C:	1000202273280
					Generic STORAGE DEVICE USB Device	\\\\.\\PHYSICALDRIVE1	D:
				''', undefined

			afterEach ->
				@childProcessStub.restore()

			it 'should set the unknown size to undefined', (done) ->
				win32.list (error, drives) ->
					expect(error).to.not.exist

					expect(drives).to.deep.equal [
						{
							device: '\\\\.\\PHYSICALDRIVE0'
							description: 'WDC WD10JPVX-75JC3T0'
							size: '1000 GB'
							mountpoint: 'C:'
						}
						{
							device: '\\\\.\\PHYSICALDRIVE1'
							description: 'Generic STORAGE DEVICE USB Device'
							size: undefined
							mountpoint: 'D:'
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

	describe '.isSystem()', ->

		describe 'given Physicaldrive0', ->

			beforeEach ->
				@drive =
					device: '\\\\.\\PHYSICALDRIVE0'
					description: 'WDC WD10JPVX-75JC3T0'
					size: '1000 GB'

			it 'should return true', (done) ->
				win32.isSystem @drive, (isSystem) ->
					expect(isSystem).to.be.true
					done()

		describe 'given Physicaldrive1', ->

			beforeEach ->
				@drive =
					device: '\\\\.\\PHYSICALDRIVE1'
					description: 'Generic STORAGE DEVICE USB Device'
					size: undefined

			it 'should return false', (done) ->
				win32.isSystem @drive, (isSystem) ->
					expect(isSystem).to.be.false
					done()
