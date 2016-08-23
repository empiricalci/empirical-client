
var fetch = require('node-fetch')
var httpError = require('http-errors')

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
  return fetch(`${host}/api/v1/x/${experimentId}`, {
    headers: headers
  }).then(function (response) {
    if (!response.ok) return Promise.reject(httpError(response.status, `Failed to get experiment: ${response.statusText}`))
    return response.json()
  })
}

exports.createExperiment = function (payload) {
  return fetch(`${host}/api/v1/experiments`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(payload)
  }).then(function (response) {
    if (!response.ok) return Promise.reject(httpError(response.status, `Failed to create experiment: ${response.statusText}`))
    return response.json()
  })
}

exports.updateExperiment = function (experimentId, payload) {
  return fetch(`${host}/api/v1/x/${experimentId}`, {
    method: 'PATCH',
    headers: headers,
    body: JSON.stringify(payload)
  }).then(function (response) {
    if (!response.ok) return Promise.reject(httpError(response.status, `Failed to update experiment: ${response.statusText}`))
    return response.json()
  })
}

