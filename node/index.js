// BOF
// ------------------------------------
// External modules
// ------------------------------------
const core   = require('@actions/core');   // Microsoft's actions toolkit
const github = require('@actions/github'); // Microsoft's actions github toolkit
const semver = require('semver');          // Node's semver package
// ------------------------------------
// Internal modules
// ------------------------------------
const getVersion = require('./lib/get-version');
//
try {
  // Remember that inputs are defined in action metadata file
  const argTagPrefix = core.getInput('tagPrefix');
  const argApiToken  = core.getInput('apiToken');
  const envApiToken  = process.env.GITHUB_TOKEN;  // doc: https://nodejs.org/dist/latest-v8.x/docs/api/process.html
  // 
  core.debug(`tagPrefix[${argTagPrefix}]`);
  // Ensure we have a usable API token
  var apiToken = null;
  if ( argApiToken !== null && argApiToken !== '' ) {
    core.debug('API token input provided');
    apiToken = argApiToken;
  } else if ( envApiToken !== null && envApiToken !== '' ) {
    core.debug('Environment API token found');
    apiToken = envApiToken;
  } else {
    core.setFailed('No API token found');
  }
  core.setSecret(apiToken); // ensure we don't log the token
  // 
  const currentVersion = getVersion(apiToken);
  core.debug(`currentVersion[${currentVersion}]`);
  // increment the version
  var versionTag = null;
  if ( currentVersion === null ) {
    // no current version, so start at 0.0.0
    versionTag = semver.inc('0.0.0', 'minor');
  } else {
    // increment the current version
    versionTag = semver.inc(currentVersion, 'minor'); 
  }


  // remember output is defined in action metadata file
  core.setOutput("versionTag", `${versionTag}`);
} catch (error) {
  // Should any error occur, the action will fail and the workflow will stop
  // Using the actions toolkit (core) package to log a message and set exit code
  core.setFailed(error.message);
}
// EOF