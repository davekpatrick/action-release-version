// BOF
// ------------------------------------
// External modules
// ------------------------------------
const core = require('@actions/core') // Microsoft's actions toolkit
const github = require('@actions/github') // Microsoft's actions github toolkit
// semver module
const semverClean = require('semver/functions/clean')
const semverParse = require('semver/functions/parse')
const semverMaxSatisfying = require('semver/ranges/max-satisfying')
// ------------------------------------
module.exports = async function getVersion(
  argApiToken,
  argTagPrefix = 'v',
  argInceptionVersionTag = '0.0.0'
) {
  // ------------------------------------
  // getVersion
  // Retrieve the current version tag from the repository
  // based on the event that triggered the workflow
  //
  // TODO:
  // - add exclude filter
  // - support for Github repository variables , RELEASE_VERSION
  // - explore github graphQL to retrieve the latest tags
  // ------------------------------------
  core.debug('Start getVersion')
  var outVersion = null
  var outHistory = []
  // doc: https://github.com/actions/toolkit/blob/main/packages/github/README.md
  //      https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#event-object-common-properties
  //
  // https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts
  // https://docs.github.com/en/actions/learn-github-actions/variables
  // env.GITHUB_EVENT_NAME
  core.info('contextType[' + github.context.eventName + ']')
  // need to remove the secrets from the context
  core.debug('context[' + JSON.stringify(github.context) + ']')
  // get the repo owner and name
  // TODO:
  // investigate github.context.payload.repository.owner.name
  //
  // github.context.payload.repository.owner.login
  //  - is the login name
  //  - can this different from the actual name ?
  // github.context.payload.repository.owner.name
  //  - is the actual name
  //  - as using this but no longer exists in payload for some reason
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
  // setup authenticated github client
  // doc: https://github.com/actions/toolkit/blob/main/packages/github/README.md
  //      https://octokit.github.io/rest.js/v18#authentication
  const octokit = github.getOctokit(argApiToken)
  if (octokit === null || octokit === undefined) {
    throw new Error('Unable to create authenticated GitHub client')
  }
  // ------------------------------------
  // build an array of release version tags

  // get all matching refs (tags)
  // https://docs.github.com/en/rest/reference/git#list-matching-references
  let matchingTags = await octokit.rest.git.listMatchingRefs({
    owner: gitOwner,
    repo: gitRepo,
    ref: 'tags/' + argTagPrefix,
  })
  core.debug('matchingTags[' + JSON.stringify(matchingTags) + ']')
  if (matchingTags.data.length === 0) {
    core.warning('No current version found')
    outHistory.push(argInceptionVersionTag) // starting point
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
        core.debug('Invalid versionTag[' + tagName + '] ')
        continue // skip to the next tag
      } else {
        // check for build version tags e.g v1.2.3+build.1
        if (tagData.build.length > 0) {
          // do not add to the list of semver tags, as this is not a release version
          // TODO: review this .. maybe we should include an option to increment build versions
          core.debug('Ignoring build[' + tagData.build + ']')
          continue // skip to the next tag
        } else {
          // confirming it does not already exists in the list
          if (!outHistory.includes(tagData.version)) {
            core.debug('Adding versionTag[' + tagData.version + ']')
            outHistory.push(tagData.version)
          }
        }
      }
    }
  }
  // ------------------------------------
  // process the event types
  if (github.context.eventName === 'release') {
    // doc: https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#releaseevent
    let tagData = github.context.payload.release.tag_name
    let getRef = 'tags/' + tagData
    core.info('Release event detected, with tag[' + tagData + ']')
    // ensure the tag exists
    let getRefData = await octokit.rest.git.getRef({
      owner: gitOwner,
      repo: gitRepo,
      ref: getRef,
    })
    core.debug('getRefData[' + JSON.stringify(getRefData) + ']')
    if (getRefData.status !== 200) {
      throw new Error('Unable to retrieve ref[' + getRef + '] data')
    }
    core.info('tagSha[' + getRefData.data.object.sha + ']')
    // ensure we have a valid semver tag
    let tagSemVer = semverClean(tagData)
    if (tagSemVer === null) {
      throw new Error('Invalid semver tag[' + tagData + ']')
    }
    outVersion = tagSemVer
  } else if (github.context.eventName === 'push') {
    // doc: https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#pushevent
    let gitRef = github.context.ref
    let gitSha = github.context.sha
    let gitBeforeCommitSha = github.context.payload.before // sha of the commit before the push
    core.info(
      'Push event detected, with ref[' + gitRef + '] commitSha[' + gitSha + ']'
    )
    core.info('beforeCommitSha[' + gitBeforeCommitSha + ']')
    // get the commit data before the push
    // https://docs.github.com/en/rest/git/commits?apiVersion=2022-11-28#get-a-commit
    let gitBeforeCommitShaData = await octokit.rest.git.getCommit({
      owner: gitOwner,
      repo: gitRepo,
      commit_sha: gitBeforeCommitSha, // sha of the commit before the push
    })
    core.debug(
      'gitBeforeCommitShaData[' + JSON.stringify(gitBeforeCommitShaData) + ']'
    )
    // get all branches where the given commit SHA is the latest commit
    // DOC: https://docs.github.com/en/rest/commits/commits?apiVersion=2022-11-28#list-branches-for-head-commit
    let getBeforeCommitBranches = await octokit.request(
      'GET /repos/' +
        gitOwner +
        '/' +
        gitRepo +
        '/commits/' +
        gitBeforeCommitSha +
        '/branches-where-head',
      {
        owner: gitOwner,
        repo: gitRepo,
        commit_sha: gitBeforeCommitSha,
      }
    )
    core.info(
      'getBeforeCommitBranches[' + JSON.stringify(getBeforeCommitBranches) + ']'
    )
    // get the latest version from the outHistory
    // using semver maxSatisfying with range *
    // should return the highest version
    let latestVersion = semverMaxSatisfying(outHistory, '*', {
      includePrerelease: true,
    })
    if (latestVersion === null) {
      throw new Error('unable to locate latest version')
    } else {
      outVersion = latestVersion
    }
  } else if (github.context.eventName === 'pull_request') {
    // doc: https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#pullrequestevent
    let gitRef = github.context.ref
    let gitSha = github.context.sha
    core.info(
      'Pull Request event detected, with ref[' +
        gitRef +
        '] commitsha[' +
        gitSha +
        ']'
    )
    // get the latest version from the outHistory
    // using semver maxSatisfying with range *
    // should return the highest version
    let latestVersion = semverMaxSatisfying(outHistory, '*', {
      includePrerelease: true,
    })
    if (latestVersion === null) {
      throw new Error('unable to locate latest version')
    } else {
      outVersion = latestVersion
    }
  } else if (github.context.eventName === 'workflow_dispatch') {
    // doc: https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#workflow_dispatch
    core.info('Workflow Dispatch event detected')
    core.info(`context[${JSON.stringify(github.context)}}]`)
    // pull the version from the input
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
    outVersion = semVer
  } else {
    //
    core.info('Unknown event type[' + github.context.eventName + ']')
    core.info(`context[${JSON.stringify(github.context)}}]`)
  }
  // ------------------------------------
  core.debug('End getVersion')
  return {
    version: outVersion,
    history: outHistory,
  }
} // getVersion
// EOF
