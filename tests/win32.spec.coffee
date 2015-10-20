chai = require('chai')
expect = chai.expect
win32 = require('../lib/win32')

describe 'Drivelist WIN32:', ->

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
