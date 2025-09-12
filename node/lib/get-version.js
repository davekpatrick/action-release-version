// BOF
// ------------------------------------
// External modules
// ------------------------------------
const core = require('@actions/core') // Microsoft's actions toolkit
const github = require('@actions/github') // Microsoft's actions github toolkit
// semver module
const semverClean = require('semver/functions/clean')
const semverParse = require('semver/functions/parse')
const semverRsort = require('semver/functions/rsort')
const semverMaxSatisfying = require('semver/ranges/max-satisfying')
// ------------------------------------
//
// ------------------------------------
module.exports = async function getVersion(
  argApiToken,
  argTagPrefix = 'v',
  argInceptionVersionTag = '0.0.0'
) {
  // ------------------------------------
  core.debug('Start getVersion')
  var versionTag = null
  // doc: https://github.com/actions/toolkit/blob/main/packages/github/README.md
  //      https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#event-object-common-properties
  //
  // https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts
  // https://docs.github.com/en/actions/learn-github-actions/variables
  // env.GITHUB_EVENT_NAME
  core.info('contextType[' + github.context.eventName + ']')
  // need to remove the secrets from the context
  core.debug('context[' + JSON.stringify(github.context) + ']')
  // setup authenticated github client
  // doc: https://github.com/actions/toolkit/blob/main/packages/github/README.md
  //      https://octokit.github.io/rest.js/v18#authentication
  const octokit = github.getOctokit(argApiToken)
  //
  let gitOwner = github.context.payload.repository.owner.name
  let gitRepo = github.context.payload.repository.name
  core.debug('gitOwner[' + gitOwner + '] gitRepo[' + gitRepo + ']')
  // ------------------------------------
  if (github.context.eventName === 'release') {
    // doc: https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#releaseevent
    let tagData = github.context.payload.release.tag_name
    let getRef = 'tags/' + tagData
    core.info('Release event detected, with tag[' + tagData + ']')
    // validate the tag exists
    let getRefData = await octokit.rest.git.getRef({
      owner: gitOwner,
      repo: gitRepo,
      ref: getRef,
    })
    core.debug('returnData[' + JSON.stringify(getRefData) + ']')
    if (getRefData.status !== 200) {
      core.setFailed('Unable to retrieve ref[' + getRef + '] data')
    }
    core.info('tagSha[' + getRefData.data.object.sha + ']')
    // ensure we have a valid semver tag
    let tagSemVer = semverClean(tagData)
    if (tagSemVer === null) {
      core.setFailed('Invalid semver tag[' + tagData + ']')
    }
    versionTag = tagSemVer
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
    core.debug(
      'getBeforeCommitBranches[' + JSON.stringify(getBeforeCommitBranches) + ']'
    )


    // get all matching refs (tags)
    // https://docs.github.com/en/rest/reference/git#list-matching-references
    let matchingTags = await octokit.rest.git.listMatchingRefs({
      owner: gitOwner,
      repo: gitRepo,
      ref: 'tags/' + argTagPrefix,
    })
    core.debug('matchingTags[' + JSON.stringify(matchingTags) + ']')
    let semverTags = []
    if (matchingTags.data.length === 0) {
      core.warning('No current version found')
      semverTags.push(argInceptionVersionTag)
    } else {
      // build a list of valid release verions
      // TODO:
      // - add exclude filter
      // - support for Github repository variables , RELEASE_VERSION
      // - explore github graphQL to retrieve the latest tags
      for (let instance of matchingTags.data) {
        let tagRef = instance.ref // e.g. refs/tags/v1.2.3
        core.debug('tagRef[' + tagRef + ']')
        let tagName = tagRef.replace('refs/tags/', '') // e.g. v1.2.3
        // Attempt to parse a string as a semantic version, returning either a SemVer object or null
        let tagData =  semverParse(tagName)
        // discart null/empty semverTag
        if ( tagData === null) {
          // invalid semver tag
          core.debug('Invalid semver tagName[' + tagName + '] ')
        } else {
          // check for build version tags e.g v1.2.3+build.1
          if ( tagData.build.length > 0  ) {
            // do not add to the list of semver tags, as this is not a release version
            // TODO: review this .. maybe we should include an option to increment build verions
            core.debug("detected build[" + tagData.build + "], ignoring this tag")
          } else {
            // confirming it does not already exists
            if ( ! semverTags.includes( tagData.version) ) {
              semverTags.push(tagData.version)
            }
          }
        }
      }
    }
    // 
    let semverTagsSorted = semverRsort(semverTags)
    let latestVersion = semverMaxSatisfying(semverTagsSorted, '*')
    if (latestVersion === null) {
      core.setFailed('unable to locate latest version')
    } else {
      versionTag = latestVersion
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
      versionTag = argInceptionVersionTag
    } else {
      // loop through the tags to find one that is part of the current branch
      for (const tag of matchingTags.data) {
        // get the tag name
        let tagName = tag.ref.replace('refs/tags/', '') // e.g. v1.2.3
        core.debug('tagName[' + tagName + ']')
        // check if it is a valid semver tag
        let tagSemVer = semverClean(tagName)
        if (tagSemVer === null) {
          core.warning('Invalid semver tag[' + tagName + ']')
          continue // skip to the next tag
        }
        // get the commit sha for the tag
        let tagCommitSha = tag.object.sha
        core.debug('tagCommitSha[' + tagCommitSha + ']')
        /*
        // check if the tag commit sha is an ancestor of the pull request commit sha
        // https://docs.github.com/en/rest/commits/commits?apiVersion=2022-11-28#compare-two-commits
        let compareCommits = await octokit.rest.repos.compareCommits({
          owner: gitOwner,
          repo: gitRepo,
          base: tagCommitSha,
          head: gitSha,
        })
        core.debug('compareCommits[' + JSON.stringify(compareCommits) + ']')
        if (compareCommits.status !== 200) {
          core.warning(
            'Unable to compare commits for tag[' + tagName + '] head[' + gitSha + ']'
          )
          continue // skip to the next tag
        }
        if (compareCommits.data.status === 'ahead' || compareCommits.data.status === 'identical') {
          // the tag is an ancestor of the pull request commit
          core.info('Found matching tag[' + tagName + '] for pull request')
          // use this tag
          //versionTag = tagSemVer
          //break // exit the loop  
        } else {
          core.debug('Tag[' + tagName + '] is not part of the pull request branch compareCommitsStatus[' + compareCommits.data.status + ']')
        }
        */
      

        // 
      }

      // now need to find the latest tag that is part of the current branch
      // for now just use the latest tag
      // later we need to ensure the tag is part of the current branch
      // e.g. by using git merge-base --is-ancestor <tag> <branch>
      // get the latest tag
      let latestTagRef = matchingTags.data[0].ref // e.g. refs/tags/v1.2.3
      core.debug('latestTagRef[' + latestTagRef + ']')
      let latestTag = latestTagRef.replace('refs/tags/', '') // e.g. v1.2.3
      core.debug('latestTag[' + latestTag + ']')
      // ensure we have a valid semver tag
      let tagSemVer = semverClean(latestTag)
      if (tagSemVer === null) {
        core.setFailed('Invalid semver tag[' + latestTag + ']')
      } else {
        versionTag = tagSemVer
      }
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
      core.setFailed('No version input provided for workflow_dispatch event')
    }
    let inputVersion = github.context.payload.inputs.version
    core.info('inputVersion[' + inputVersion + ']')
    let semVer = semverClean(inputVersion)
    if (semVer === null) {
      // strange, the input provided is invalid
      core.setFailed('Invalid semver version[' + inputVersion + ']')
    }
    versionTag = semVer


  } else {
    //
    core.info('Unknown event type[' + github.context.eventName + ']')
    core.info(`context[${JSON.stringify(github.context)}}]`)
  }
  // ------------------------------------
  core.debug('End getVersion')
  return versionTag
} // getVersion
// EOF
