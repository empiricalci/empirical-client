
var fetch = require('node-fetch')
var httpError = require('http-errors')
var md5 = require('md5')
var fs = require('fs')
var path = require('path')
var mime = require('mime-types')

var host = 'https://empiricalci.com'
var headers

exports.init = function (options) {
  if (options.host) host = options.host
  var auth
  if (options.auth) auth = options.auth
  if (options.user && options.password) auth = new Buffer(`${options.user}:${options.password}`).toString('base64')
  headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + auth
  }
  return this
}

exports.setAuth = function (user, password) {
  const auth = new Buffer(`${user}:${password}`).toString('base64')
  headers['Authorization'] = 'Basic ' + auth
}

exports.getProfile = function () {
  return fetch(`${host}/api/v1/profile`, {
    headers: headers
  }).then(function (response) {
    if (!response.ok) return Promise.reject(httpError(response.status, 'Failed to get profile'))
    return response.json()
  })
}

exports.getAuthToken = function () {
  return fetch(`${host}/api/v1/profile/auth_token`, {
    headers: headers
  }).then(function (response) {
    if (!response.ok) return Promise.reject(httpError(response.status, `Failed to get auth token: ${response.statusText}`))
    return response.json()
  })
}

exports.getKeys = function (projectId) {
  return fetch(`${host}/api/v1/projects/${projectId}/keys`, {
    headers: headers
  }).then(function (response) {
    if (!response.ok) return Promise.reject(response.status)
    return response.json()
  })
}

exports.getExperiment = function (experimentId) {
  return fetch(`${host}/api/v1/${experimentId}`, {
    headers: headers
  }).then(function (response) {
    if (!response.ok) return Promise.reject(httpError(response.status, `Failed to get experiment: ${response.statusText}`))
    return response.json()
  })
}

exports.createExperiment = function (projectId, payload) {
  return fetch(`${host}/api/v1/${projectId}/x`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload)
  }).then(function (response) {
    if (!response.ok) return Promise.reject(httpError(response.status, `Failed to create experiment: ${response.statusText}`))
    return response.json()
  })
}

exports.updateExperiment = function (experimentId, payload) {
  return fetch(`${host}/api/v1/${experimentId}`, {
    method: 'PATCH',
    headers: headers,
    body: JSON.stringify(payload)
  }).then(function (response) {
    if (!response.ok) return Promise.reject(httpError(response.status, `Failed to update experiment: ${response.statusText}`))
    return response.json()
  })
}

function requestUpload (filePath, checksum, contentType, contentLength, experimentId) {
  return fetch(`${host}/api/v1/data/uploadRequest`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      filePath: filePath,
      experimentId: experimentId,
      checksum: checksum,
      contentType: contentType,
      contentLength: contentLength
    })
  }).then(function (response) {
    if (!response.ok) return Promise.reject(httpError(response.status, `Failed to create upload request: ${response.statusText}`))
    return response.json()
  })
}

exports.upload = function (filePath, experimentId, workspacePath) {
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, function (err, data) {
      if (err) reject(err)
      var checksum = md5(data)
      var contentLength = fs.statSync(filePath).size
      var contentType = mime.contentType(path.extname(filePath))
      filePath = workspacePath ? path.relative(workspacePath, filePath) : filePath
      requestUpload(
        filePath,
        checksum,
        contentType,
        contentLength,
        experimentId
      )
      .then(function (asset) {
        return fetch(asset.signedUrl, {
          method: 'PUT',
          body: data,
          headers: {
            'Content-Length': contentLength,
            'Content-Type': contentType
          }
        }).then(function (response) {
          if (!response.ok) return reject(httpError(response.status, `Failed to upload to s3: ${response.statusText}`))
          resolve(asset)
        })
      })
      .catch(reject)
    })
  })
}

exports.uploadLogs = function (filePath, experimentId) {
  // Upload logs
  return exports.upload(filePath, experimentId)
  .then(function (logs) {
    // Associates logs with experiment
    return exports.updateExperiment(experimentId, {
      logs: logs.id
    })
  })
}

