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
  currentVersion,
  {
    //
    releaseType = 'initial',
    releaseChange = 'minor', // TODO: think about this
    buildMetadata = {
      // add suport for git sha
      // $(echo 3d91209a0aab66bcefa0b733abd456da3f109fd2 | cut -c1-8)
      inst: new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, ''),
      num: 1,
    },
  } = {}
) {
  // ------------------------------------
  const functionName = incrementVersion.name
  core.debug('Start ' + functionName)
  // ------------------------------------
  // ------------------------------------
  // argument(input) variable setup
  const functionArguments = {
    currentVersion: currentVersion,
    //
    releaseType: releaseType,
    releaseChange: releaseChange,
    buildMetadata: {
      inst: buildMetadata.inst,
      num: buildMetadata.num,
    },
  }
  // ------------------------------------
  // ------------------------------------
  // return(output) variable setup
  var functionReturn = {
    old: functionArguments.currentVersion,
    new: null, // TODO: mmmmm
  }
  // ------------------------------------
  core.info('Version change type[' + functionArguments.releaseType + ']')
  // determine the new version based on the release type and change
  if (functionArguments.releaseType === 'released') {
    //
    functionReturn.new = functionArguments.currentVersion
    core.info('Version is already released, no increment required')
  } else if (functionArguments.releaseType === 'initial') {
    //
    functionReturn.new = semverInc(
      functionArguments.currentVersion,
      functionArguments.releaseChange
    )
        core.info('Initial version, so ' + functionArguments.releaseChange + ' incrementing')

  } else if (functionArguments.releaseType === 'releasing') {
    functionReturn.new = semverInc(
      functionArguments.currentVersion,
      functionArguments.releaseChange
    )
    core.info(
      'Releasing version, so incrementing current version[' +
        functionArguments.currentVersion +
        '] to version[' +
        functionReturn.new +
        ']'
    )
  } else if (functionArguments.releaseType === 'build') {
    functionReturn.new = semverInc(
      functionArguments.currentVersion,
      functionArguments.releaseChange
    )
    let buildData =
      functionArguments.buildMetadata.inst +
      '.' +
      functionArguments.buildMetadata.num
    let build = buildData.replace(/[^0-9A-Za-z-.]/g, '') // sanitize to valid semver build metadata
    functionReturn.new = functionReturn.new + '+build.' + build
    core.info(
      'Build version, so incrementing current version[' +
        functionArguments.currentVersion +
        '] to version[' +
        functionReturn.new +
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
  core.debug('End ' + functionName)
  return {
    version: {
      old: functionReturn.old,
      new: functionReturn.new,
    },
  }
} // incrementVersion
// EOF
