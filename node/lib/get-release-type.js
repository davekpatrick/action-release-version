// BOF
// ------------------------------------
// External modules
// ------------------------------------
const core = require('@actions/core') // Microsoft's actions toolkit
const github = require('@actions/github') // Microsoft's actions github toolkit
// semver module
const semverMaxSatisfying = require('semver/ranges/max-satisfying')
const semverDiff = require('semver/functions/diff')
// ------------------------------------
//
// ------------------------------------
module.exports = async function getReleaseType(
  argApiToken,
  argCurrentVersion,
  argVersionHistory
) {
  // ------------------------------------
  core.debug('Start getReleaseType')
  var outEvent = null
  var outType = null
  var outChange = null
  // ------------------------------------
  // declare return variables
  // event
  //  - release
  //  - manual
  //  - push
  //  - pull
  //  - unknown
  // type:
  //  - none         e.g. no change detected
  //  - initial      e.g. first version detected
  //  - released     e.g. 1.0.0
  //  - releasing    e.g. from 1.0.0-release.1 to 1.0.0
  //  - prerelease
  //  - build
  // change: ( e.g. from 0.1.0 to 1.0.0 )
  //  - prerelease  e.g. 1.0.0-release.1
  //  - release     e.g  1.0.0
  //  - premajor    e.g. 1.0.0-alpha.1
  //  - major       e.g. 1.0.0
  //  - preminor    e.g. 0.2.0-beta.1
  //  - minor       e.g. 0.2.0
  //  - prepatch    e.g. 0.1.1-rc.1
  //  - patch       e.g. 0.1.1
  //
  // ------------------------------------
  core.info('contextType[' + github.context.eventName + ']')
  core.debug('context[' + JSON.stringify(github.context) + ']')
  // get the repo owner and name
  // TODO:
  // investigate github.context.payload.repository.owner.name vs login
  //  if these can be different and which to use
  //  especially for enterprise accounts
  // e.g. if the repo is owned by an organization
  //
  // github.context.payload.repository.owner.login
  //  - is the login name
  //  - can this different from the actual name ?
  // github.context.payload.repository.owner.name
  //  - is the actual name
  //  - was using this but no longer exists in payload for some reason
  const gitRepoOwnerLogin = github.context.payload.repository.owner.login
  const gitRepoOwnerName = github.context.payload.repository.owner.name
  const gitRepo = github.context.payload.repository.name
  core.debug(
    'gitRepoOwnerLogin[' +
      gitRepoOwnerLogin +
      '] gitRepoOwnerName[' +
      gitRepoOwnerName +
      '] gitRepo[' +
      gitRepo +
      ']'
  )
  if (gitRepoOwnerName === undefined) {
    core.debug('Undefined GitHub repository.owner.name')
  }
  let gitOwner = gitRepoOwnerLogin
  // ensure we have valid repository information
  if (gitOwner === null || gitOwner === '' || gitOwner === undefined) {
    throw new Error('Unable to locate the repository owner')
  }
  if (gitRepo === null || gitRepo === '' || gitRepo === undefined) {
    throw new Error('Unable to locate the repository name')
  }
  core.debug('gitOwner[' + gitOwner + '] gitRepo[' + gitRepo + ']')
  // ------------------------------------
  // setup authenticated github client
  // doc: https://github.com/actions/toolkit/blob/main/packages/github/README.md
  //      https://octokit.github.io/rest.js/v18#authentication
  const octokit = github.getOctokit(argApiToken)
  if (octokit === null || octokit === undefined) {
    throw new Error('Unable to create authenticated GitHub client')
  }
  // ------------------------------------
  // remove the current version from the version history
  var versionHistory = argVersionHistory
  if (versionHistory.includes(argCurrentVersion)) {
    versionHistory = versionHistory.filter(
      (version) => version !== argCurrentVersion
    )
  }
  core.debug('versionHistory[' + JSON.stringify(versionHistory) + ']')
  // ------------------------------------
  // get default branch name
  var gitDefaultBranch = null
  try {
    const gitRepoData = await octokit.rest.repos.get({
      owner: gitOwner,
      repo: gitRepo,
    })
    core.debug('gitRepoData[' + JSON.stringify(gitRepoData) + ']')
    gitDefaultBranch = gitRepoData.data.default_branch
    core.debug('gitDefaultBranch[' + gitDefaultBranch + ']')
  } catch (error) {
    throw new Error('Unable to locate the repository default branch')
  }

  // ------------------------------------
  // process the event types
  if (github.context.eventName === 'release') {
    // ------------------------------------
    // a release event has occurred - use the tag that triggered the workflow
    outEvent = github.context.eventName
    // check how much version history we have
    if (versionHistory.length === 0) {
      outType = 'initial'
      outChange = null
      core.info('Initial release version detected')
    } else {
      core.debug('Locating previous version')
      // locate the previous version
      let previousVersion = semverMaxSatisfying(
        versionHistory,
        '<' + argCurrentVersion,
        { includePrerelease: true }
      )
      if (previousVersion === null || previousVersion === undefined) {
        // this should not happen as we have version history
        // TODO:  ... should we fail here ?
        outType = 'initial'
        outChange = null
        core.warning('No previous versions found')
      } else {
        // determine the release type based on the difference between the current and previous version
        core.info('Previous version located [' + previousVersion + ']')
        let versionDiff = semverDiff(previousVersion, argCurrentVersion, {
          includePrerelease: true,
        })
        core.info('versionDiff[' + versionDiff + ']')
        if (versionDiff === null || versionDiff === undefined) {
          // no difference found between the current and previous version
          throw new Error(
            'No difference between current[' +
              argCurrentVersion +
              '] and previous[' +
              previousVersion +
              '] versions'
          )
        } else {
          // this is a release event ... so we have an already released version
          outType = 'released'
          outChange = versionDiff
        }
      }
    }
    core.info('outType[' + outType + ']')
  } else if (github.context.eventName === 'workflow_dispatch') {
    // ------------------------------------
    // a workflow_dispatch event has occurred - do not increment the version
    outEvent = 'manual'
    // check how much version history we have
    if (versionHistory.length === 0) {
      outType = 'initial'
      outChange = null
      core.info('Initial release version detected')
    } else {
      // locate the previous version
      let previousVersion = semverMaxSatisfying(
        versionHistory,
        '<' + argCurrentVersion,
        { includePrerelease: true }
      )
      if (previousVersion === null || previousVersion === undefined) {
        // this should not happen as we have version history
        throw new Error('No previous versions found')
      } else {
        // determine the release type based on the difference between the current and previous version
        core.info('Previous version located [' + previousVersion + ']')
        let versionDiff = semverDiff(previousVersion, argCurrentVersion, {
          includePrerelease: true,
        })
        core.info('versionDiff[' + versionDiff + ']')
        if (versionDiff === null || versionDiff === undefined) {
          // no difference found between the current and previous version
          throw new Error(
            'No difference between current[' +
              argCurrentVersion +
              '] and previous[' +
              previousVersion +
              '] versions'
          )
        } else {
          // determine the type of change
          outType = 'releasing'
          outChange = versionDiff
        }
      }
    }
    core.info('outType[' + outType + ']')
  } else if (github.context.eventName === 'push') {
    // ------------------------------------
    // a push event has occurred - determine the type based on commit messages since the last tag
    outEvent = github.context.eventName
    outType = 'push'
    core.info('outType[' + outType + ']')
  } else if (github.context.eventName === 'pull_request') {
    // ------------------------------------
    // a pull_request event has occurred
    outEvent = github.context.eventName

    // determine the type of change
    if (versionHistory.length === 0) {
      outType = 'initial'
      outChange = null
      core.info('Initial release version detected')
    } else {
      //
      outType = 'build'
      let gitHeadRef = github.context.payload.pull_request.head.ref
      let gitBaseRef = github.context.payload.pull_request.base.ref
      core.info(
        'gitHeadRef[' + gitHeadRef + '] => gitBaseRef[' + gitBaseRef + ']'
      )
      //
      if (gitBaseRef === gitDefaultBranch) {
        core.info('Pull request to default branch detected')
        // fix branch
        // e.g. fix/issue-123
        if (gitHeadRef.startsWith('fix/')) {
          outChange = 'prepatch'
          core.info('Patch change detected')
        }
        // feature branch
        // e.g. feature/issue-123
        else if (gitHeadRef.startsWith('feature/')) {
          outChange = 'preminor'
          core.info('Minor change detected')
        }
        // major branch
        // e.g. major/issue-123
        else if (gitHeadRef.startsWith('major/')) {
          outChange = 'premajor'
          core.info('Major change detected')
        } else {
          // default to patch change
          outChange = 'preminor'
          core.info('default to minor change')
        }
      } else {
        core.info('Pull request to non-default branch detected')
        // fix branch
        // e.g. fix/issue-123
        if (gitHeadRef.startsWith('fix/')) {
          outChange = 'patch'
          core.info('Patch change detected')
        }
        // feature branch
        // e.g. feature/issue-123
        else if (gitHeadRef.startsWith('feature/')) {
          outChange = 'minor'
          core.info('Minor change detected')
        }
        // major branch
        // e.g. major/issue-123
        else if (gitHeadRef.startsWith('major/')) {
          outChange = 'major'
          core.info('Major change detected')
        } else {
          // default to patch change
          outChange = 'minor'
          core.info('default to minor change')
        }
      }
    }
    core.info('outType[' + outType + ']')
  } else {
    outEvent = 'unknown'
    outType = null
    outChange = null
  }
  // ------------------------------------
  core.debug('End getReleaseType')
  return {
    event: outEvent,
    type: outType,
    change: outChange,
  }
} // getReleaseType
// EOF
