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
  it('should get an experiment', function (done) {
    client.getExperiment('empirical-bot/my-solver/my-solver/myBuild')
    .then(function (experiment) {
      assert(experiment.protocol)
      assert(experiment.protocol.project)
      assert(experiment.version)
      assert(!experiment.protocol.project.repo.private_key, 'Should not expose private key!')
      done()
    }).catch(done)
  })
  var experimentId
  it('should create an experiment for an existing protocol', function (done) {
    client.createExperiment({
      project_id: 'empirical-bot/my-solver',
      protocol: 'my-solver',
      head_sha: 'ff396b8f154c3488f40460c0bedbf951aa06949c'
    }).then(function (experiment) {
      assert(experiment.id)
      experimentId = experiment.id
      assert.equal(experiment.author, 'empirical-bot')
      assert.equal(experiment.version_id, 'Ny1OY60ag')
      assert.equal(experiment.protocol_id, 'empirical-bot/my-solver/my-solver')
      done()
    }).catch(done)
  })
  it('should create a protocol if it doesn\'t exists ', function (done) {
    client.createExperiment({
      project_id: 'empirical-bot/my-solver',
      protocol: 'my-new-protocol',
      head_sha: 'ff396b8f154c3488f40460c0bedbf951aa06949c'
    }).then(function (experiment) {
      assert(experiment.id)
      assert.equal(experiment.author, 'empirical-bot')
      assert.equal(experiment.version_id, 'Ny1OY60ag')
      assert.equal(experiment.protocol_id, 'empirical-bot/my-solver/my-new-protocol')
      done()
    }).catch(done)
  })
  it('shouldn\'t create an experiment for a project you don\'t have access to', function (done) {
    client.createExperiment({
      project_id: 'empirical-tester/hello-world',
      protocol: 'my-solver',
      head_sha: 'ff396b8f154c3488f40460c0bedbf951aa06949c'
    }).then(function (experiment) {
      done(new Error('An experiment was created'))
    }).catch(function (err) {
      assert.equal(err.status, 401)
      done()
    })
  })
  it('should update an experiment', function (done) {
    client.updateExperiment(`empirical-bot/my-solver/my-solver/${experimentId}`, {
      status: 'success'
    }).then(function (experiment) {
      assert.equal(experiment.status, 'success')
      assert.equal(experiment.id, experimentId)
      done()
    }).catch(done)
  })
  it('shouldn\'t be able to update another user\'s experiment', function (done) {
    client.updateExperiment('empirical-tester/hello-world/hello-world/myExperiment', {
      status: 'failed'
    }).then(function (experiment) {
      done(new Error('Shouldn\'t be able to update another users\'s experiment'))
    }).catch(function (err) {
      assert.equal(err.status, 401)
      done()
    })
  })
})
