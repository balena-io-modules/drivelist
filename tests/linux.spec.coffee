chai = require('chai')
expect = chai.expect
sinon = require('sinon')
chai.use(require('sinon-chai'))
childProcess = require('child_process')
linux = require('../lib/linux')

describe 'Drivelist LINUX:', ->

	describe '.isSystem()', ->

		describe 'given a system drive', ->

			beforeEach ->
				@drive =
					device: '/dev/sda'
					description: 'WDC WD10JPVX-75J'
					size: '931,5G'

				@childProcessStub = sinon.stub(childProcess, 'exec')
				@childProcessStub.yields null, '''
					NAME MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
					sda    8:0    0 931,5G  0 disk
				''', undefined

			afterEach ->
				@childProcessStub.restore()

			it 'should return true', (done) ->
				linux.isSystem @drive, (isSystem) ->
					expect(isSystem).to.be.true
					done()

		describe 'given a problematic removable drive', ->

			beforeEach ->
				@drive =
					device: '/dev/sdb'
					description: 'Flash Reader'
					size: '14,9G'

				@childProcessStub = sinon.stub(childProcess, 'exec')
				@childProcessStub.yields null, '''
					NAME MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
					sdb    8:16   1  14.9G  0 disk
				''', undefined

			afterEach ->
				@childProcessStub.restore()

			it 'should return false', (done) ->
				linux.isSystem @drive, (isSystem) ->
					expect(isSystem).to.be.false
					done()

		describe 'given a removable drive', ->

			beforeEach ->
				@drive =
					device: '/dev/sdc'
					description: 'Storage Media'
					size: '7,3G'

				@childProcessStub = sinon.stub(childProcess, 'exec')
				@childProcessStub.yields null, '''
					NAME MAJ:MIN RM   SIZE RO TYPE MOUNTPOINT
					sdc    8:32   1   7,3G  0 disk
				''', undefined

			afterEach ->
				@childProcessStub.restore()

			it 'should return false', (done) ->
				linux.isSystem @drive, (isSystem) ->
					expect(isSystem).to.be.false
					done()
