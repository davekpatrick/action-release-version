// BOF
// ------------------------------------
// External modules
// ------------------------------------
const core   = require('@actions/core');                // Microsoft's actions toolkit
const github = require('@actions/github');              // Microsoft's actions github toolkit
//
const semverClean = require('semver/functions/clean');  // Node's semver package
// ------------------------------------
//
// ------------------------------------
module.exports = async function getVersion(apiToken) {
  // ------------------------------------
  core.debug('Start getVersion');
  var versionTag = null
  // doc: https://github.com/actions/toolkit/blob/main/packages/github/README.md
  //      https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#event-object-common-properties
  //
  // https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts
  // https://docs.github.com/en/actions/learn-github-actions/variables
  // env.GITHUB_EVENT_NAME
  core.info('contextType[' + github.context.eventName + ']');
  //
  // need to remove the secrets from the context
  //
  core.debug('context[' + JSON.stringify(github.context) + ']');
  // setup authenticated github client
  // doc: https://github.com/actions/toolkit/blob/main/packages/github/README.md
  //      https://octokit.github.io/rest.js/v18#authentication
  const octokit = github.getOctokit(apiToken);
  // ------------------------------------
  if ( github.context.eventName === 'release') {
    // doc: https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#releaseevent   
    let tagData = github.context.payload.release.tag_name
    core.info('Release event detected, with tag[' + tagData + ']');
    // ensure we have a valid semver tag
    let tagSemVer = semverClean(tagData);
    if ( tagSemVer === null ) {
      core.setFailed('Invalid semver tag[' + tagData + ']');
    }
  } else if ( github.context.eventName === 'push') {
    // doc: https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#pushevent
    let gitRef = github.context.ref;
    let gitSha = github.context.sha;
    let gitBeforeCommitSha = github.context.payload.before; // sha of the commit before the push
    core.info('Push event detected, with ref[' + gitRef + '] commitsha[' + gitSha + ']');
    core.info('beforeCommitsha[' + gitBeforeCommitSha + ']');
    // get the commit data before the push
    let gitOwner = github.context.payload.repository.owner.name;
    let gitRepo = github.context.payload.repository.name;
    core.debug('gitOwner[' + gitOwner + '] gitRepo[' + gitRepo + ']');
    // https://docs.github.com/en/rest/git/commits?apiVersion=2022-11-28#get-a-commit
    let gitBeforeCommitShaData = await octokit.rest.git.getCommit({
      owner: gitOwner,
      repo: gitRepo,
      commit_sha: gitBeforeCommitSha, // sha of the commit before the push
    });
    core.debug('gitBeforeCommitShaData[' + JSON.stringify(gitBeforeCommitShaData) + ']');
    // get all branches where the given commit SHA latest commit
    let getBeforeCommitBranches = await octokit.request('GET /repos/' + gitOwner + '/' + gitRepo + '/commits/' + gitBeforeCommitSha + '/branches-where-head', {
      owner: gitOwner,
      repo: gitRepo,
      commit_sha: gitBeforeCommitSha
    })
    core.info('getBeforeCommitBranches[' + JSON.stringify(getBeforeCommitBranches) + ']');
    //let tagData = github.context.payload.ref;
    // https://docs.github.com/en/rest/repos/repos?apiVersion=2022-11-28#list-repository-tags
    //let gitTagData = await octokit.rest.repos.listTags({
    //  owner: gitOwner,
    //  repo: gitRepo,
    //});
    //core.info('gitTagData[' + JSON.stringify(gitTagData) + ']');
   
    // lets all matching refs (tags)
    // https://docs.github.com/en/rest/reference/git#list-matching-references
    let matchingTags = await octokit.rest.git.listMatchingRefs({
      owner: gitOwner,
      repo: gitRepo,
      ref: 'tags/v'
    });
    core.info('matchingTags[' + JSON.stringify(matchingTags) + ']');
    if ( matchingTags.data.length === 0 ) {
      core.warning('No current version found');
      versionTag = '0.0.0'
    } else {
      // get the latest tag
      let latestTag = matchingTags.data[0].name;
      core.info('latestTag[' + latestTag + ']');
      // ensure we have a valid semver tag
      let tagSemVer = semverClean(latestTag);
      if ( tagSemVer === null ) {
        core.setFailed('Invalid semver tag[' + latestTag + ']');
      } else {
        versionTag = tagSemVer;
      }
    }
 
  } else if ( github.context.eventName === 'pull_request') {
    // doc: https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#pullrequestevent
    let gitRef = github.context.ref;
    let gitSha = github.context.sha; 
    core.info('Pull Request event detected, with ref[' + gitRef + '] commitsha[' + gitSha + ']');
    core.info(`context[${JSON.stringify(github.context)}}]`)
    
  } else {
    //
    core.info('Unknown event type[' + github.context.eventName + ']');
    core.info(`context[${JSON.stringify(github.context)}}]`)

  }
  
  // ------------------------------------
  core.debug('End getVersion');
  return versionTag;

} // getVersion
// EOF