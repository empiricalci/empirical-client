/* eslint-env mocha */

var assert = require('assert')

describe('Client', function () {
  var client = require('..').init({
    host: 'http://localhost:1337',
    user: 'empirical-bot',
    password: 'password'
  })
  it('should access profile', function (done) {
    client.getProfile().then(function (profile) {
      assert.equal(profile.username, 'empirical-bot')
      done()
    }).catch(done)
  })
  it('should get the github auth token', function (done) {
    client.getAuthToken().then(function (data) {
      assert.equal(data.username, 'empirical-bot')
      assert(data.token)
      done()
    }).catch(done)
  })
  it('should create a project', function (done) {
    client.createProject('empirical-bot/myProject')
    .then(function (project) {
      assert.equal(project.owner, 'empirical-bot')
      assert.equal(project.name, 'myProject')
      done()
    }).catch(done)
  })
  it('should get an experiment', function (done) {
    client.getExperiment('empirical-bot/my-solver/x/myBuild')
    .then(function (experiment) {
      assert(experiment.protocol)
      done()
    }).catch(done)
  })
  var experimentId
  it('should create an experiment ', function (done) {
    client.createExperiment('empirical-bot/my-solver', {
      protocol: 'my-new-protocol',
      message: 'my-message',
      status: 'failed',
      environment: {
        build: '.'
      },
      source: {
        repo: 'https://github.com/empirical-bot/my-solver',
        commit: 'ff396b8f154c3488f40460c0bedbf951aa06949c'
      }
    }).then(function (experiment) {
      experimentId = experiment.id
      assert(experiment.id)
      assert.equal(experiment.project_id, 'empirical-bot/my-solver')
      assert.equal(experiment.author, 'empirical-bot')
      assert.equal(experiment.protocol, 'my-new-protocol')
      done()
    }).catch(done)
  })
  it('shouldn\'t create an experiment for a project you don\'t have access to', function (done) {
    client.createExperiment('empirical-tester/hello-world', {
      protocol: 'my-solver',
      message: 'something',
      status: 'failed',
      source: {
        repo: 'empirical-tester/hello-world',
        commit: 'ff396b8f154c3488f40460c0bedbf951aa06949c'
      }
    }).then(function (experiment) {
      done(new Error('An experiment was created'))
    }).catch(function (err) {
      assert.equal(err.status, 401)
      done()
    })
  })
  it('should update an experiment', function (done) {
    client.updateExperiment(`empirical-bot/my-solver/x/${experimentId}`, {
      status: 'success'
    }).then(function (experiment) {
      assert.equal(experiment.status, 'success')
      assert.equal(experiment.id, experimentId)
      done()
    }).catch(done)
  })
  it('shouldn\'t be able to update another user\'s experiment', function (done) {
    client.updateExperiment('empirical-tester/hello-world/x/myExperiment', {
      status: 'failed'
    }).then(function (experiment) {
      done(new Error('Shouldn\'t be able to update another users\'s experiment'))
    }).catch(function (err) {
      assert.equal(err.status, 401)
      done()
    })
  })
  it('should upload logs', function (done) {
    client.uploadLogs(`empirical-bot/my-solver/x/${experimentId}`, './test/test-logs.log')
    .then(function (asset) {
      assert.equal(asset.experimentId, experimentId)
      done()
    }).catch(done)
  })
  const testResult = {
    name: 'my-table',
    type: 'table',
    data: [['Country', 'Year', 'Population'],
      ['United States', 2000, 282200000],
      ['Canada', 2000, 27790000],
      ['United States', 2005, 295500000],
      ['Canada', 2005, 32310000],
      ['United States', 2010, 309000000],
      ['Canada', 2010, 34000000]
    ]
  }
  it('should create a result', function (done) {
    client.createResult(`empirical-bot/my-solver/x/${experimentId}`, testResult).then(function (response) {
      assert.equal(response.status, 'success')
      done()
    }).catch(done)
  })
})
