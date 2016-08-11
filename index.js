
var fetch = require('node-fetch')

var host = 'https://empiricalci.com'
var headers

exports.init = function (options) {
  if (options.host) host = options.host
  if (options.auth) auth = options.auth
  if (options.user && options.password) auth = new Buffer(`${options.user}:${options.password}`).toString('base64')
  headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + auth
  }
  return this
}

exports.setAuth = function (user, password) {
  auth = new Buffer(`${user}:${password}`).toString('base64')
  headers['Authorization'] = 'Basic ' + auth
}

exports.getProfile = function () {
  return fetch(`${host}/api/v1/profile`, {
    headers: headers
  }).then(function (response) {
    if (!response.ok) return Promise.reject(new Error(response.statusText))
    return response.json()
  })
}

exports.getKeys = function (full_name) {
  return fetch(`${host}/api/v1/projects/${full_name}/keys`, {
    headers: headers
  }).then(function (response) {
    if (!response.ok) return Promise.reject(response.status)
    return response.json()
  })
}

exports.updateExperiment = function (full_name, payload) {
  return fetch(`${host}/api/v1/x/${full_name}`, {
    method: 'PATCH',
    headers: headers,
    body: JSON.stringify(payload)
  }).then(function (response) {
    if (!response.ok) return Promise.reject(new Error(`Failed to update build: ${response.status}`))
    return response.json()
  })
}

exports.getBuild = function (full_name) {
  return fetch(`${host}/api/v1/x/${full_name}`, {
    headers: headers
  }).then(function (response) {
    if (!response.ok) return Promise.reject(response.status)
    return response.json()
  })
}

exports.postResults = function (results) {
  // TODO: Post results
}

exports.uploadWorkspace = function (params) {
  // TODO: Upload workspace

}
