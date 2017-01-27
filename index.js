
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

function requestUpload (url, data, type) {
  return fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      filePath: data.filePath,
      checksum: data.checksum,
      contentType: data.contentType,
      contentLength: data.contentLength
    })
  }).then(function (response) {
    if (!response.ok) return Promise.reject(httpError(response.status, `Failed to create upload request: ${response.statusText}`))
    return response.json()
  })
}

exports.upload = function (endpoint, filePath, workspacePath, artifactType = 'data') {
  return new Promise(function (resolve, reject) {
    fs.readFile(filePath, function (err, data) {
      if (err) reject(err)
      var checksum = md5(data)
      var contentLength = fs.statSync(filePath).size
      var contentType = mime.contentType(path.extname(filePath))
      filePath = workspacePath ? path.relative(workspacePath, filePath) : filePath
      requestUpload(`${host}/api/v1/${endpoint}/${artifactType}`, {
        filePath,
        checksum,
        contentType,
        contentLength
      })
      .then(function (asset) {
        return fetch(asset.signedUrl, {
          method: 'PUT',
          body: data,
          headers: {
            'Content-Length': contentLength,
            'Content-Type': contentType
          }
        }).then(function (response) {
          if (!response.ok) return reject(httpError(response.status, `Failed to upload file: ${response.statusText}`))
          resolve(asset)
        })
      })
      .catch(reject)
    })
  })
}

exports.uploadLogs = function (endpoint, filePath) {
  return exports.upload(endpoint, filePath, undefined, 'logs')
}
