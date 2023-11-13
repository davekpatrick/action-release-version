// BOF
// ------------------------------------
// External modules
// ------------------------------------
const core = require('@actions/core') // Microsoft's actions toolkit
const semver = require('semver') // Node's semver package
// ------------------------------------
// Internal modules
// ------------------------------------
const getVersion = require('./get-version')
//
module.exports = async function releaseVersion() {
  try {
    // Remember that inputs are defined in action metadata file
    const argTagPrefix = core.getInput('tagPrefix')
    const argInceptionVersionTag = core.getInput('inceptionVersionTag')
    const argVersion = core.getInput('argVersion')



    const argApiToken = core.getInput('apiToken')
    const envApiToken = process.env.GITHUB_TOKEN // doc: https://nodejs.org/dist/latest-v8.x/docs/api/process.html
    //
    core.debug('tagPrefix[' + argTagPrefix + ']')
    // Ensure we have a usable API token
    var apiToken = null
    if (argApiToken !== null && argApiToken !== '') {
      core.debug('API token input provided')
      apiToken = argApiToken
    } else if (envApiToken !== null && envApiToken !== '') {
      core.debug('Environment API token found')
      apiToken = envApiToken
    } else {
      core.setFailed('No API token found')
    }
    core.setSecret(apiToken) // ensure we don't log the token
    //
    //
    //core.info(JSON.stringify(process.env))
    // ------------------------------------
    // get the "current" version, using the version input if provided
    var currentVersion = null
    if (argVersion !== null && argVersion !== '') {
      core.debug('argVersion[' + argVersion + ']')
      let semVer = semver.clean(argVersion)
      if (semVer === null) {
        // strange, the input provided is invalid
        core.setFailed('Invalid semver version[' + argVersion + ']')
      }
      currentVersion = semVer
    } else {
      currentVersion = await getVersion(
        apiToken,
        argTagPrefix,
        argInceptionVersionTag
      )
    }
    core.info('currentVersion[' + currentVersion + ']')
    // ------------------------------------
    // increment the current version
    var versionTag = null
    if (currentVersion === null) {
      // no current version, so start at argInceptionVersionTag (aka 0.0.0) and increment
      versionTag = semver.inc(argInceptionVersionTag, 'minor')
    } else {
      // increment the current version
      versionTag = semver.inc(currentVersion, 'minor')
    }
    // ------------------------------------
    



    core.info(`version[${versionTag}]`)
    // remember output is defined in action metadata file
    core.setOutput('versionTag', `${versionTag}`)
    return versionTag
  } catch (error) {
    // Should any error occur, the action will fail and the workflow will stop
    // Using the actions toolkit (core) package to log a message and set exit code
    core.setFailed(error.message)
  }
}
// EOF
