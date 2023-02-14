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
  if ( argApiToken !== null && argApiToken !== '' ) {
    core.debug('API token input provided');
    var apiToken = argApiToken;
  } else if ( envApiToken !== null && envApiToken !== '' ) {
    core.debug('Environment API token found');
    var apiToken = envApiToken;
  } else {
    core.setFailed('No API token found');
    var apiToken = null;
  }
  core.setSecret(apiToken); // ensure we don't log the token
  // 
  const versionTag = getVersion(apiToken);




  // Rember the output is defined in action metadata file
  core.setOutput("versionTag", `${versionTag}`);
} catch (error) {
  // Should any error occur, the action will fail and the workflow will stop
  // Using the actions toolkit (core) pacakge to log a message and set exit code
  core.setFailed(error.message);
}
// EOF