// BOF
// ------------------------------------
const packageName = '@@NPM_PACKAGE_NAME@@'
const packageVersion = '@@NPM_PACKAGE_VERSION@@'
// ------------------------------------
// External modules
// ------------------------------------
const core = require('@actions/core') // Microsoft's actions toolkit
const semver = require('semver') // Node's semver package
// ------------------------------------
// Internal modules
// ------------------------------------
const getVersion = require('./get-version')
const getReleaseType = require('./get-release-type')
//
module.exports = async function main() {
  try {
    core.startGroup('Initialization')
    core.info(
      'package[' + packageName + ']' + ' version[' + packageVersion + ']'
    )
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
    if (
      argApiToken !== null &&
      argApiToken !== '' &&
      argApiToken !== undefined
    ) {
      core.debug('API token input provided')
      apiToken = argApiToken
    } else if (
      envApiToken !== null &&
      envApiToken !== '' &&
      envApiToken !== undefined
    ) {
      core.debug('API token Environment variable found')
      apiToken = envApiToken
    } else {
      throw new Error('No API token found')
    }
    // ensure we mask the token in logs
    core.debug('API token length[' + apiToken.length + ']')
    core.setSecret(apiToken)
    core.endGroup()
    core.startGroup('Preparation')
    // ------------------------------------
    // ------------------------------------
    //
    //
    //core.info(JSON.stringify(process.env))
    // ------------------------------------
    // get the "current" version
    // methods
    // - via argVersion input
    // - on release event, use the tag that triggered the workflow
    // - on workflow_dispatch event, use the input version
    // - get the latest tag from the repo
    // - Repository action variable, RELEASE_VERSION
    // - if no version found, use argInceptionoutVersionTag
    // ------------------------------------
    var getVersionData = {}
    var currentVersion = null
    var outVersionTag = null
    if (argVersion !== null && argVersion !== '') {
      core.debug('argVersion[' + argVersion + ']')
      let semVer = semver.clean(argVersion)
      if (semVer === null || semVer === '' || semVer === undefined) {
        // strange, the input provided is invalid
        throw new Error('Invalid semver version[' + argVersion + ']')
      }
      currentVersion = semVer
      core.info(
        'currentVersion[' + currentVersion + '] as dictated by action input'
      )
      outVersionTag = currentVersion
      return outVersionTag
    } else {
      getVersionData = await getVersion(
        apiToken,
        argTagPrefix,
        argInceptionVersionTag
      )
      currentVersion = getVersionData.version
    }
    core.debug('getVersionData[' + JSON.stringify(getVersionData) + ']')
    core.info('currentVersion[' + currentVersion + ']')
    // ------------------------------------
    // determine the increment type ..initial thoughts
    // methods
    // - if no current version, start at argInceptionVersionTag and increment minor
    //  types:
    //   - major
    //     methods
    //      - pull request with "BREAKING CHANGE" in the body
    //      - pull request title contains "[major]"
    //      - pull request label "major"
    //      - branch prefix "major/"
    //   - minor
    //     methods
    //      - default if no other type matched
    //      - pull request title contains "[minor]"
    //      - pull request title contains "[feature]"
    //      - pull request label "minor"
    //      - pull request label "feature"
    //      - branch prefix "feature/"
    //   - patch
    //     methods
    //      - pull request title contains "[patch]"
    //      - pull request label "patch"
    //      - pull request label "fix"
    //      - branch prefix "fix/"
    //      - branch prefix "bug/"
    //   - premajor
    //     methods
    //      - pull request title contains "[major][pre|prerequisite]"
    //      - pull request label "major" & "pre|prerequisite"
    //      - branch prefix "premajor/"
    //   - preminor
    //     methods
    //      - pull request title contains "[preminor]"
    //      - pull request label "preminor"
    //      - branch prefix "preminor/"
    //   - prepatch
    //     methods
    //      - pull request title contains "[prepatch]"
    //      - pull request label "prepatch"
    //      - branch prefix "prepatch/"
    //   - prerelease
    //     methods
    //      - pull request title contains "[prerelease]"
    //      - pull request label "prerelease"
    //      - branch prefix "prerelease/"
    // ------------------------------------
    // increment the current version
    // methods
    // - if no current version, start at argInceptionVersionTag and increment minor
    // - if current version is from a release, do not increment
    // - if current version is from a workflow_dispatch, do not increment
    // - otherwise increment based on the type determined above
    // ------------------------------------
    const getReleaseTypeData = await getReleaseType(
      apiToken,
      getVersionData.version,
      getVersionData.history
    )
    core.info('getReleaseTypeData[' + JSON.stringify(getReleaseTypeData) + ']')
    core.endGroup()
    core.startGroup('Execution')

    if (currentVersion === null) {
      // TODO: review logic here
      // no current version, so start at argInceptionVersionTag (aka 0.0.0) and increment
      outVersionTag = semver.inc(argInceptionVersionTag, 'minor')
    } else {
      // increment the current version
      if (
        getReleaseTypeData.event === 'released' ||
        getReleaseTypeData.event === 'manual'
      ) {
        // already released or manually triggered, so use the current version
        outVersionTag = currentVersion
      } else {
        // increment based on the change type determined
        //outVersionTag = semver.inc(currentVersion, getReleaseTypeData.change)
        outVersionTag = semver.inc(currentVersion, 'minor')
      }
    }
    // ------------------------------------
    core.endGroup()

    core.info(`version[${outVersionTag}]`)
    // remember output is defined in action metadata file
    core.setOutput('versionTag', `${outVersionTag}`)
    return outVersionTag
  } catch (error) {
    // Should any error occur, the action will fail and the workflow will stop
    // Using the actions toolkit (core) package to log a message and set exit code
    core.setFailed(error.message)
    process.exit(core.ExitCode.Failure)
  }
}
// EOF
