// BOF
// ------------------------------------
// External modules
// ------------------------------------
const core = require('@actions/core') // Microsoft's actions toolkit
const github = require('@actions/github') // Microsoft's actions github toolkit
// semver module requirements
const semverClean = require('semver/functions/clean')
const semverParse = require('semver/functions/parse')
const semverMaxSatisfying = require('semver/ranges/max-satisfying')
// ------------------------------------
// ------------------------------------
module.exports = async function getVersion(
  apiToken,
  {
    //
    tagPrefix = 'v',
    inceptionVersionTag = '0.0.0',
    versionTag = null, // just use this input as the 'current' version
  } = {}
) {
  const functionName = getVersion.name
  core.debug('Start ' + functionName)
  // ------------------------------------
  // getVersion
  // Retrieve the current version tag from the repository
  // based on the event that triggered the workflow
  //
  // TODO:
  // - add exclude filter
  // - support for Github repository variables, RELEASE_VERSION
  // - support for configuration file for RELEASE_VERSION
  // - explore github graphQL to retrieve the latest tags
  // ------------------------------------
  // ------------------------------------
  // argument(input) variable setup
  const functionArguments = {
    apiToken: apiToken,
    //
    tagPrefix: tagPrefix,
    inceptionVersionTag: inceptionVersionTag,
    versionTag: versionTag,
  }
  // ------------------------------------
  // ------------------------------------
  const githubEventType = github.context.eventName
  const githubRepoOwner = github.context.payload.repository.owner.login
  const githubRepoName = github.context.payload.repository.name
  // ------------------------------------
  // ------------------------------------
  // return(output) variable setup
  var functionReturn = {
    trigger: null,
    version: null,
    history: [],
  }
  // what event triggered this release version action
  // e.g. push, pull_request, release, workflow_dispatch
  // DOC: https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types
  functionReturn.trigger = githubEventType
  core.debug('versionTagPrefix[' + functionArguments.tagPrefix + ']')
  core.debug(
    'inceptionVersionTag[' + functionArguments.inceptionVersionTag + ']'
  )
  // setup authenticated github client
  // doc: https://github.com/actions/toolkit/blob/main/packages/github/README.md
  //      https://octokit.github.io/rest.js/v18#authentication
  const octokit = github.getOctokit(functionArguments.apiToken)
  if (octokit === null || octokit === undefined) {
    throw new Error('Unable to create authenticated GitHub client')
  }
  // ------------------------------------
  // build an array of release version tags
  // get all matching refs (tags)
  // https://docs.github.com/en/rest/reference/git#list-matching-references
  let matchingTags = await octokit.rest.git.listMatchingRefs({
    owner: githubRepoOwner,
    repo: githubRepoName,
    ref: 'tags/' + functionArguments.tagPrefix,
  })
  core.debug('matchingTags[' + JSON.stringify(matchingTags) + ']')
  if (matchingTags.data.length === 0) {
    core.warning('No current version found')
    functionReturn.history.push(functionArguments.inceptionVersionTag) // starting point
  } else {
    // build a list of valid release version tags
    // i.e. valid semver tags without build metadata
    // e.g. v1.2.3+build.1 is not a release version
    //      v1.2.3 is a release version
    for (let instance of matchingTags.data) {
      let tagRef = instance.ref // e.g. refs/tags/v1.2.3
      core.debug('tagRef[' + tagRef + ']')
      let tagName = tagRef.replace('refs/tags/', '') // e.g. v1.2.3
      // Attempt to parse a string as a semantic version, returning either a SemVer object or null
      let tagData = semverParse(tagName)
      // discard null/empty semverTag
      if (tagData === null) {
        // invalid semver tag
        core.debug('invalidVersionTag[' + tagName + '] ')
        continue // skip to the next tag
      } else {
        // check for build version tags e.g v1.2.3+build.1
        if (tagData.build.length > 0) {
          // do not add to the list of semver tags, as this is not a release version
          // TODO: review this .. maybe we should include an option to increment build versions
          core.debug('ignoringBuild[' + tagData.build + ']')
          continue // skip to the next tag
        } else {
          // confirming it does not already exists in the list
          if (!functionReturn.history.includes(tagData.version)) {
            core.debug('addingVersionTag[' + tagData.version + ']')
            functionReturn.history.push(tagData.version)
          }
        }
      }
    }
  }
  core.info('versionHistorySize[' + functionReturn.history.length + ']')
  // ------------------------------------
  // process the event types
  if (
    functionArguments.versionTag !== undefined &&
    functionArguments.versionTag !== null &&
    functionArguments.versionTag !== ''
  ) {
    // use the provided 'current' version
    core.info(
      'Version specified as action input[' + functionArguments.versionTag + ']'
    )
    let semVer = semverClean(functionArguments.versionTag)
    if (semVer === null || semVer === '' || semVer === undefined) {
      // strange, the input provided is invalid
      throw new Error(
        'Invalid semver version[' + functionArguments.versionTag + ']'
      )
    }
    functionReturn.version = semVer
  } else if (functionReturn.trigger === 'release') {
    // doc: https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#releaseevent
    let gitTag = github.context.payload.release.tag_name
    let gitRef = 'tags/' + gitTag
    // ensure the tag exists
    let gitRefData = await octokit.rest.git.getRef({
      owner: githubRepoOwner,
      repo: githubRepoName,
      ref: gitRef,
    })
    core.debug('gitRefData[' + JSON.stringify(gitRefData) + ']')
    if (gitRefData.status !== 200) {
      throw new Error('Unable to retrieve ref[' + gitRef + '] data')
    }
    let gitSha = gitRefData.data.object.sha
    core.info('Release detected, with ref[' + gitRef + '] sha[' + gitSha + ']')
    // ensure we have a valid semver tag
    let tagSemVer = semverClean(gitTag)
    if (tagSemVer === null) {
      throw new Error('Invalid semver tag[' + gitTag + ']')
    }
    functionReturn.version = tagSemVer
  } else if (functionReturn.trigger === 'push') {
    // doc: https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#pushevent
    let gitRef = github.context.ref
    let gitSha = github.context.sha
    let gitShaBefore = github.context.payload.before // sha of the commit before the push
    core.info('Push detected, with ref[' + gitRef + '] sha[' + gitSha + ']')
    core.debug('gitShaBefore[' + gitShaBefore + ']')

    // get the latest version from the functionReturn.history
    // using semver maxSatisfying with range *
    // should return the highest version
    let latestVersion = semverMaxSatisfying(functionReturn.history, '*', {
      includePrerelease: true,
    })
    if (latestVersion === null) {
      throw new Error('unable to locate latest version')
    } else {
      functionReturn.version = latestVersion
    }
  } else if (functionReturn.trigger === 'pull_request') {
    // doc: https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#pullrequestevent
    let gitRef = github.context.ref
    let gitSha = github.context.sha
    core.info(
      'Pull Request detected, with ref[' +
        gitRef +
        '] commitsha[' +
        gitSha +
        ']'
    )
    // get the latest version from the functionReturn.history
    // using semver maxSatisfying with range *
    // should return the highest version
    let latestVersion = semverMaxSatisfying(functionReturn.history, '*', {
      includePrerelease: true,
    })
    if (latestVersion === null) {
      throw new Error('unable to locate latest version')
    } else {
      functionReturn.version = latestVersion
    }
  } else if (functionReturn.trigger === 'workflow_dispatch') {
    // doc: https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#workflow_dispatch
    core.info('Workflow Dispatch detected')
    // pull the "version" from the input
    // TODO: should we validate the input name/version exists in the action definition
    //       should we allow an alternative input name via action input?
    if (
      github.context.payload.inputs.version === null ||
      github.context.payload.inputs.version === undefined ||
      github.context.payload.inputs.version === ''
    ) {
      throw new Error('No version input provided for workflow_dispatch event')
    }
    let inputVersion = github.context.payload.inputs.version
    core.info('inputVersion[' + inputVersion + ']')
    let semVer = semverClean(inputVersion)
    if (semVer === null) {
      // strange, the input provided is invalid
      throw new Error('Invalid semver version[' + inputVersion + ']')
    }
    functionReturn.version = semVer
  } else {
    //
    core.info('Unknown event type[' + functionReturn.trigger + ']')
    // TODO: should this be an error or warning and return null ? e.g. for schedule event
    // get the latest version from the functionReturn.history
    // using semver maxSatisfying with range *
    // should return the highest version
    let latestVersion = semverMaxSatisfying(functionReturn.history, '*', {
      includePrerelease: true,
    })
    if (latestVersion === null) {
      throw new Error('unable to locate latest version')
    } else {
      functionReturn.version = latestVersion
    }
  }
  // ------------------------------------
  core.debug('End ' + functionName)
  return {
    trigger: functionReturn.trigger,
    version: functionReturn.version,
    history: functionReturn.history,
  }
} // getVersion
// EOF
