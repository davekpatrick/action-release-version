// BOF
// ------------------------------------
// External modules
// ------------------------------------
const core = require('@actions/core') // Microsoft's actions toolkit
// semver module requirements
const semverInc = require('semver/functions/inc')
// ------------------------------------
//
// ------------------------------------
module.exports = async function incrementVersion(
  argCurrentVersion,
  argReleaseType = 'initial',
  argReleaseChange = 'minor', // TODO: think about this
  argBuildMetadata = {
    // add suport for git sha 
    // $(echo 3d91209a0aab66bcefa0b733abd456da3f109fd2 | cut -c1-8)
    inst: new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, ''),
    num: 1,
  }
) {
  // ------------------------------------
  core.debug('Start incrementVersion')
  var version = null
  // ------------------------------------
  core.info('Version change type[' + argReleaseChange + ']')
  // determine the new version based on the release type and change
  if (argReleaseType === 'released') {
    //
    version = argCurrentVersion
    core.info('Version is already released, no increment required')
  } else if (argReleaseType === 'initial') {
    //
    version = argCurrentVersion
    core.info('Initial version, so incrementing required')
  } else if (argReleaseType === 'releasing') {
    version = semverInc(argCurrentVersion, argReleaseChange)
    core.info(
      'Releasing version, so incrementing current version[' +
        argCurrentVersion +
        '] to version[' +
        version +
        ']'
    )
  } else if (argReleaseType === 'build') {
    version = semverInc(argCurrentVersion, argReleaseChange)
    core.debug(argReleaseChange)
    let buildData = argBuildMetadata.inst + '.' + argBuildMetadata.num
    let build = buildData.replace(/[^0-9A-Za-z-.]/g, '') // sanitize to valid semver build metadata
    version = version + '+build.' + build
    core.info(
      'Build version, so incrementing current version[' +
        argCurrentVersion +
        '] to version[' +
        version +
        ']'
    )
  }

  /*

  }
if (currentVersion === null) {
      // TODO: review logic here
      // no current version, so start at argInceptionVersionTag (aka 0.0.0) and increment
      outVersionTag = semver.inc(argInceptionVersionTag, 'minor')
    } else {
      // increment the current version
      if (
        getReleaseTypeData.type === 'released' ||
        getReleaseTypeData.type === 'initial'
      ) {
        // already released or manually triggered, so use the current version
        currentVersion = getVersionData.version
        outVersionTag = currentVersion
      } else {
        // increment based on the change type determined
        //outVersionTag = semver.inc(currentVersion, getReleaseTypeData.change)
        outVersionTag = semver.inc(currentVersion, 'minor')
      }
    }
*/

  // ------------------------------------
  core.debug('End incrementVersion')
  return {
    version: {
      old: argCurrentVersion,
      new: version,
    },
  }
} // incrementVersion
// EOF
