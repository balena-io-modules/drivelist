chai = require('chai')
expect = chai.expect
sinon = require('sinon')
chai.use(require('sinon-chai'))
childProcess = require('child_process')
linux = require('../lib/linux')

describe 'Drivelist LINUX:', ->

	describe 'given correct output from lsblk', ->

		beforeEach ->
			@childProcessStub = sinon.stub(childProcess, 'exec')
			@childProcessStub.yields null, '''
				NAME MODEL              SIZE
				sda  WDC WD10JPVX-75J 931,5G
				sdb  STORAGE DEVICE    14,7G
				sr0  DVD+-RW GU90N     1024M
			''', undefined

		afterEach ->
			@childProcessStub.restore()

		it 'should extract the necessary information', (done) ->
			linux.list (error, drives) ->
				expect(error).to.not.exist

				expect(drives).to.deep.equal [
					{
						device: '/dev/sda'
						description: 'WDC WD10JPVX-75J'
						size: '931.5G'
					}
					{
						device: '/dev/sdb'
						description: 'STORAGE DEVICE'
						size: '14.7G'
					}
					{
						device: '/dev/sr0'
						description: 'DVD+-RW GU90N'
						size: '1024M'
					}
				]

				return done()

	describe 'given lsblk output without model', ->

		beforeEach ->
			@childProcessStub = sinon.stub(childProcess, 'exec')
			@childProcessStub.yields null, '''
				NAME    MODEL           SIZE
				sda     SD Plus         3.8G
				mmcblk0                14.4G
			''', undefined

		afterEach ->
			@childProcessStub.restore()

		it 'should default model to undefined', (done) ->
			linux.list (error, drives) ->
				expect(error).to.not.exist

				expect(drives).to.deep.equal [
					{
						device: '/dev/sda'
						description: 'SD Plus'
						size: '3.8G'
					}
					{
						device: '/dev/mmcblk0'
						description: undefined
						size: '14.4G'
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
			linux.list (error, drives) ->
				expect(error).to.be.an.instanceof(Error)
				expect(error.message).to.equal('Hello World')
				expect(drives).not.exist
				done()
