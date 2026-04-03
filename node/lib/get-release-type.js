// BOF
// ------------------------------------
// External modules
// ------------------------------------
const core = require('@actions/core') // Microsoft's actions toolkit
const github = require('@actions/github') // Microsoft's actions github toolkit
// semver module requirements
const semverMaxSatisfying = require('semver/ranges/max-satisfying')
const semverDiff = require('semver/functions/diff')
// ------------------------------------
// ------------------------------------
module.exports = async function getReleaseType(
  apiToken,
  {
    //
    inceptionVersionTag = '0.0.0',
    inceptionVersionIncrement = 'minor',
    //
    versionTagCurrent = inceptionVersionTag,
    versionTagHistory = [inceptionVersionTag],
  } = {}
) {
  const functionName = getReleaseType.name
  core.debug('Start ' + functionName)
  // ------------------------------------
  // ------------------------------------
  // argument(input) variable setup
  const functionArguments = {
    apiToken: apiToken,
    //
    versionTagCurrent: versionTagCurrent,
    versionTagHistory: versionTagHistory,
    //
    inceptionVersionTag: inceptionVersionTag,
    inceptionVersionIncrement: inceptionVersionIncrement,
  }
  // ------------------------------------
  // ------------------------------------
  // return(output) variable setup
  var functionReturn = {
    event: null,
    type: null,
    change: null,
  }
  // ------------------------------------
  // declare return variables
  // event
  //  - release
  //  - manual
  //  - push
  //  - pull
  //  - unknown
  // type:
  //  - noop         e.g. no change, a no-operation event
  //  - initial      e.g. first version detected
  //  - released     e.g. 1.0.0
  //  - releasing    e.g. from 1.0.0-release.1 to 1.0.0
  //  - prerelease
  //  - build
  // change: ( e.g. from 0.1.0 to 1.0.0 )
  //  - release     e.g  1.0.0
  //  - prerelease  e.g. 1.0.0-release.1
  //  - premajor    e.g. 1.0.0-alpha.1
  //  - major       e.g. 1.0.0
  //  - preminor    e.g. 0.2.0-beta.1
  //  - minor       e.g. 0.2.0
  //  - prepatch    e.g. 0.1.1-rc.1
  //  - patch       e.g. 0.1.1
  //
  // ------------------------------------
  const githubRepoOwner = github.context.payload.repository.owner.login
  const githubRepoName = github.context.payload.repository.name
  // ------------------------------------
  // setup authenticated github client
  // doc: https://github.com/actions/toolkit/blob/main/packages/github/README.md
  //      https://octokit.github.io/rest.js/v18#authentication
  const octokit = github.getOctokit(functionArguments.apiToken)
  if (octokit === null || octokit === undefined) {
    throw new Error('Unable to create authenticated GitHub client')
  }
  // ------------------------------------
  // remove the inception version from the version history
  var versionHistory = functionArguments.versionTagHistory
  if (versionHistory.includes(functionArguments.inceptionVersionTag)) {
    versionHistory = versionHistory.filter(
      (version) => version !== functionArguments.inceptionVersionTag
    )
  }
  core.debug('versionHistory[' + JSON.stringify(versionHistory) + ']')
  // ------------------------------------
  // get default branch name
  var gitDefaultBranch = null
  try {
    const gitRepoData = await octokit.rest.repos.get({
      owner: githubRepoOwner,
      repo: githubRepoName,
    })
    core.debug('gitRepoData[' + JSON.stringify(gitRepoData) + ']')
    gitDefaultBranch = gitRepoData.data.default_branch //
    if (
      gitDefaultBranch === null ||
      gitDefaultBranch === '' ||
      gitDefaultBranch === undefined
    ) {
      throw new Error('Unable to locate the repository default branch')
    }
    core.info('gitDefaultBranch[' + gitDefaultBranch + ']')
  } catch (error) {
    throw new Error(
      'Failed to get repository information[' + error.message + ']'
    )
  }
  // ------------------------------------
  // process the event types
  if (github.context.eventName === 'release') {
    // ------------------------------------
    // a release event has occurred - use the tag that triggered the workflow
    functionReturn.event = github.context.eventName
    // check how much version history we have
    if (versionHistory.length === 0) {
      functionReturn.type = 'initial' //
      functionReturn.change = 'none' //
      core.info('Initial release version detected')
    } else {
      core.debug('Locating previous version')
      // locate the previous version
      let previousVersion = semverMaxSatisfying(
        versionHistory,
        '<' + functionArguments.versionTagCurrent,
        { includePrerelease: true }
      )
      if (previousVersion === null || previousVersion === undefined) {
        // this should not happen as we have version history
        throw new Error('No previous versions found')
      } else {
        // determine the release type based on the difference between the current and previous version
        core.info('Previous version located [' + previousVersion + ']')
        let versionDiff = semverDiff(
          previousVersion,
          functionArguments.versionTagCurrent,
          {
            includePrerelease: true,
          }
        )
        core.info('versionDiff[' + versionDiff + ']')
        if (versionDiff === null || versionDiff === undefined) {
          // no difference found between the current and previous version
          throw new Error(
            'No difference between current[' +
              functionArguments.versionTagCurrent +
              '] and previous[' +
              previousVersion +
              '] versions'
          )
        } else {
          // this is a release event ... so we have an already released the version
          functionReturn.type = 'released'
          functionReturn.change = versionDiff
        }
      }
    }
    core.info('type[' + functionReturn.type + ']')
  } else if (github.context.eventName === 'workflow_dispatch') {
    // ------------------------------------
    // a workflow_dispatch event has occurred - do not increment the version
    functionReturn.event = 'manual'
    // check how much version history we have
    if (versionHistory.length === 0) {
      functionReturn.type = 'initial'
      if (
        functionArguments.versionTagCurrent ===
        functionArguments.inceptionVersionTag
      ) {
        // we have no version history and the current version is the inception version
        // which means the user has not set the version correctly
        functionReturn.change = functionArguments.inceptionVersionIncrement
        core.warning(
          'Current version is equal to inception version, ensuring increment to[' +
            functionReturn.change +
            ']'
        )
      } else {
        functionReturn.change = 'none' // no change as first version and set manually
      }
      core.info('Manual initial release version detected')
    } else {
      // locate the previous version
      let previousVersion = semverMaxSatisfying(
        versionHistory,
        '<' + functionArguments.versionTagCurrent,
        { includePrerelease: true }
      )
      if (previousVersion === null || previousVersion === undefined) {
        // this should not happen as we have version history
        throw new Error('No previous versions found')
      } else {
        // determine the release type based on the difference between the current and previous version
        core.info('Previous version located [' + previousVersion + ']')
        let versionDiff = semverDiff(
          previousVersion,
          functionArguments.versionTagCurrent,
          {
            includePrerelease: true,
          }
        )
        core.info('versionDiff[' + versionDiff + ']')
        if (versionDiff === null || versionDiff === undefined) {
          // no difference found between the current and previous version
          throw new Error(
            'No difference between current[' +
              functionArguments.versionTagCurrent +
              '] and previous[' +
              previousVersion +
              '] versions'
          )
        } else {
          // determine the type of change
          functionReturn.type = 'releasing'
          functionReturn.change = versionDiff
        }
      }
    }
    core.info('type[' + functionReturn.type + ']')
  } else if (github.context.eventName === 'pull_request') {
    // ------------------------------------
    // a pull_request event has occurred
    functionReturn.event = github.context.eventName
    functionReturn.type = 'build' // TODO: should we have different types...
    // check how much version history we have
    if (versionHistory.length === 0) {
      if (
        functionArguments.versionTagCurrent ===
        functionArguments.inceptionVersionTag
      ) {
        functionReturn.change = functionArguments.inceptionVersionIncrement // first version, so make it at least 0.1.0
      } else {
        // current version is not the inception version tag
        // so do not increment the version, just use the current version
        functionReturn.change = 'none'
      }
      core.info('Initial release version detected')
    } else {
      //
      let gitHeadRef = github.context.payload.pull_request.head.ref
      let gitBaseRef = github.context.payload.pull_request.base.ref
      core.info(
        'gitHeadRef[' + gitHeadRef + '] -> gitBaseRef[' + gitBaseRef + ']'
      )
      // get pull request information
      let pullRequestTitle = github.context.payload.pull_request.title
      let pullRequestBody = github.context.payload.pull_request.body
      let pullRequestLabels = github.context.payload.pull_request.labels
      core.debug('pullRequestTitle[' + pullRequestTitle + ']')
      core.debug('pullRequestBody[' + pullRequestBody + ']')
      core.debug('pullRequestLabels[' + JSON.stringify(pullRequestLabels) + ']')
      //
      // determine the type of change

      // major branch
      // e.g. major/issue-123
      if (
        gitHeadRef.startsWith('major/') ||
        pullRequestTitle.includes('[major]') ||
        pullRequestLabels.some((label) => label.name === 'major')
      ) {
        functionReturn.change = 'major'
        core.info('Major change detected')
      }
      // feature branch
      // e.g. feature/issue-123
      else if (
        gitHeadRef.startsWith('feature/') ||
        pullRequestTitle.includes('[feature]') ||
        pullRequestLabels.some((label) => label.name === 'feature')
      ) {
        functionReturn.change = 'minor'
        core.info('Minor change detected')
      }
      // fix branch
      // e.g. fix/issue-123
      else if (
        gitHeadRef.startsWith('fix/') ||
        pullRequestTitle.includes('[fix]') ||
        pullRequestLabels.some((label) => label.name === 'fix')
      ) {
        functionReturn.change = 'patch'
        core.info('Patch change detected')
      } else {
        // default to patch change
        functionReturn.change = 'minor'
        core.info('default to minor change')
      }
      // check if the pull request is to the default branch
      if (gitBaseRef === gitDefaultBranch) {
        core.info('Pull request to default branch detected')
        // TODO: add support for 'pre'
        //functionReturn.change = 'pre' + functionReturn.change
        //core.info('Pre-release change detected')
      } else {
        core.info('Pull request to non-default branch detected')
      }
    }
    core.info('type[' + functionReturn.type + ']')
  } else if (github.context.eventName === 'push') {
    // ------------------------------------
    // a push event has occurred
    // TODO: determine the type based on ;
    //  - commit messages since the last tag
    //  - branch name
    //  - files changed
    //  - other ?
    functionReturn.event = github.context.eventName

    let gitBeforeCommitSha = github.context.payload.before // sha of the commit before the push
    core.info('beforeCommitSha[' + gitBeforeCommitSha + ']')
    if (gitBeforeCommitSha === '0000000000000000000000000000000000000000') {
      // Handle the "null" commit ID - technically represented as a string of 40 zeros
      // an official Git convention used to represent a non-existent commit or a null parent, including these use cases
      //  - Initial Commit/Root Commit
      //  - Branch Deletion
      //  - Branch Creation
      // DOC: locate offical documentation (TODO)
      //      https://github.com/git/git/commit/f65fdf04a13d2252de8b2b4b161db7c43f2c28ad
      functionReturn.type = 'noop' // no change as null parent detected
      core.debug('type[' + functionReturn.type + ']')
      core.info('non-existent git commit event')
    } else {
      functionReturn.type = 'push'
      core.info('type[' + functionReturn.type + ']')

      // get the commit data before the push
      // https://docs.github.com/en/rest/git/commits?apiVersion=2022-11-28#get-a-commit
      let gitBeforeCommitShaData = await octokit.rest.git.getCommit({
        owner: githubRepoOwner,
        repo: githubRepoName,
        commit_sha: gitBeforeCommitSha, // sha of the commit before the push
      })
      core.debug(
        'gitBeforeCommitShaData[' + JSON.stringify(gitBeforeCommitShaData) + ']'
      )
      let gitBeforeCommitShaMessage = gitBeforeCommitShaData.data.message
      core.info('beforeCommitShaMessage[' + gitBeforeCommitShaMessage + ']')
      // get all branches where the given commit SHA is the latest commit
      // DOC: https://docs.github.com/en/rest/commits/commits?apiVersion=2022-11-28#list-branches-for-head-commit
      let getBeforeCommitBranches = await octokit.request(
        'GET /repos/' +
          githubRepoOwner +
          '/' +
          githubRepoName +
          '/commits/' +
          gitBeforeCommitSha +
          '/branches-where-head',
        {
          owner: githubRepoOwner,
          repo: githubRepoName,
          commit_sha: gitBeforeCommitSha,
        }
      )
      core.debug(
        'getBeforeCommitBranches[' +
          JSON.stringify(getBeforeCommitBranches) +
          ']'
      )
      let beforeCommitBranchList = getBeforeCommitBranches.data.ForEach((i) => {
        i.name
      })
      core.info(
        'beforeCommitBranchList[' + JSON.stringify(beforeCommitBranchList) + ']'
      )
      // TODO: review the branches where the commit exists

      // To list the open or merged pull requests associated with a branch, you can set the commit_sha parameter to the branch name
      // DOC: https://docs.github.com/en/rest/commits/commits?apiVersion=2022-11-28#list-pull-requests-associated-with-a-commit
      let getPullRequest = await octokit.request(
        'GET /repos/' +
          githubRepoOwner +
          '/' +
          githubRepoName +
          '/commits/{commit_sha}/pulls',
        {
          owner: 'OWNER',
          repo: 'REPO',
          commit_sha: 'COMMIT_SHA',
          headers: {
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      )
      core.debug('getPullRequest[' + JSON.stringify(getPullRequest) + ']')
    }
  } else {
    functionReturn.event = 'unknown'
    functionReturn.type = null
    functionReturn.change = null
  }
  // ------------------------------------
  core.debug('End ' + functionName)
  return {
    event: functionReturn.event,
    type: functionReturn.type,
    change: functionReturn.change,
  }
} // getReleaseType
// EOF
