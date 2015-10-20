chai = require('chai')
expect = chai.expect
darwin = require('../lib/darwin')

describe 'Drivelist Darwin:', ->

	describe '.isSystem()', ->

		describe 'given previous output', ->

			describe 'given /dev/disk0', ->

				beforeEach ->
					@drive =
						device: '/dev/disk1'
						description: 'Macintosh HD'
						size: '249.8 GB'
						mountpoint: '/'

				it 'should return true', (done) ->
					darwin.isSystem @drive, (isSystem) ->
						expect(isSystem).to.be.true
						done()

			describe 'given /dev/disk2', ->

				beforeEach ->
					@drive =
						device: '/dev/disk2'
						description: 'elementary OS'
						size: '15.7 GB'
						mountpoint: '/Volumes/Elementary'

				it 'should return false', (done) ->
					darwin.isSystem @drive, (isSystem) ->
						expect(isSystem).to.be.false
						done()
