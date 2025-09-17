// BOF
// ------------------------------------
// External modules
// ------------------------------------
const core = require('@actions/core') // Microsoft's actions toolkit
// ------------------------------------
//
// ------------------------------------
module.exports = async function incrementVersion(argVersion) {
  // ------------------------------------
  core.debug('Start incrementVersion')
  var version = null

  // ------------------------------------
  core.debug('End incrementVersion')
  return {
    currentVersion: argVersion,
    newVersion: version,
  }
} // getReleaseType
// EOF
