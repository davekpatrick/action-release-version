// BOF
// ------------------------------------
const packageName = '@@NPM_PACKAGE_NAME@@'
const packageVersion = '@@NPM_PACKAGE_VERSION@@'
// ------------------------------------
const process = require('node:process')
const path = require('node:path')
const fs = require('node:fs')
// ------------------------------------
// External modules
// ------------------------------------
const core = require('@actions/core') // Microsoft's actions toolkit
const github = require('@actions/github') // Microsoft's actions github toolkit
const semver = require('semver') // Node's semver package
// ------------------------------------
// Internal modules
// ------------------------------------
const getVersion = require('./get-version')
const getReleaseType = require('./get-release-type')
const incrementVersion = require('./increment-version')
//
module.exports = async function main() {
  try {
    core.startGroup('Initialization')
    // ------------------------------------
    // ------------------------------------
    // Node.js Native Environment Variables
    const nodeEnvironmentVariables = {
      env: {
        key: 'NODE_ENV',
        val: 'production',
      },
    }
    // NODE_ENV
    // - always use 'production'
    // DOC: https://nodejs.org/learn/getting-started/nodejs-the-difference-between-development-and-production#why-is-node_env-considered-an-antipattern
    process.env[nodeEnvironmentVariables['env']['key']] ??=
      nodeEnvironmentVariables['env']['val']
    if (
      process.env[nodeEnvironmentVariables['env']['key']] !==
      nodeEnvironmentVariables['env']['val']
    ) {
      core.info(
        'Node.js variable[nodeEnvironmentVariables["env"]["key"]]' +
          ' value[' +
          process.env[nodeEnvironmentVariables['env']['key']] +
          ']'
      )
    }
    // variables
    const dirRoot = path.normalize(__dirname + path.sep + '..')
    const dirGithub = path.resolve(dirRoot, '.github')
    const dirGithubActions = path.resolve(dirGithub, 'actions')
    var currentVersion = null
    var outVersionTag = null
    // ------------------------------------
    core.info(
      'package[' + packageName + ']' + ' version[' + packageVersion + ']'
    )
    // Remember that inputs are defined in action metadata file
    const argTagPrefix = core.getInput('tagPrefix')
    const argInceptionVersionTag = core.getInput('inceptionVersionTag')
    const argVersion = core.getInput('version')
    const argVersionInputAsReleaseVersion = core.getInput(
      'versionInputAsReleaseVersion'
    )
    const argConfigFile = core.getInput('configFile')
    //
    // API token can be provided as an action input or via the GITHUB_TOKEN environment variable
    // input takes precedence over environment variable
    // see https://docs.github.com/en/actions/security-guides/automatic-token-authentication
    // for more information on the GITHUB_TOKEN variable
    //
    const argApiToken = core.getInput('apiToken')
    const envApiToken = process.env.GITHUB_TOKEN // doc: https://nodejs.org/dist/latest-v8.x/docs/api/process.html
    //
    core.debug('tagPrefix[' + argTagPrefix + ']')
    // Ensure we have a usable API token
    var apiToken = null
    if (
      argApiToken !== null &&
      argApiToken !== '' &&
      argApiToken !== undefined
    ) {
      core.debug('API token input provided')
      apiToken = argApiToken
    } else if (
      envApiToken !== null &&
      envApiToken !== '' &&
      envApiToken !== undefined
    ) {
      core.debug('API token Environment variable found')
      apiToken = envApiToken
    } else {
      throw new Error('No API token found')
    }
    // ensure we mask the token in logs
    core.debug('API token length[' + apiToken.length + ']')
    core.setSecret(apiToken)
    // doc: https://github.com/actions/toolkit/blob/main/packages/github/README.md
    //      https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types#event-object-common-properties
    //
    // https://github.com/actions/toolkit/blob/main/packages/github/src/context.ts
    // https://docs.github.com/en/actions/learn-github-actions/variables
    // env.GITHUB_EVENT_NAME
    const githubContext = github.context
    core.debug('context[' + JSON.stringify(githubContext) + ']')
    // determine what event triggered this action
    // e.g. push, pull_request, release, workflow_dispatch
    // DOC: https://docs.github.com/en/developers/webhooks-and-events/events/github-event-types
    // ------------------------------------
    const githubEventType = githubContext.eventName
    core.info('githubEventType[' + githubEventType + ']')
    // get the repo owner and name
    // TODO:
    // investigate github.context.payload.repository.owner.name
    //  - this used to exist but no longer appears in the payload for some reason
    // github.context.payload.repository.owner.login
    //  - is the login name
    //  - can this be different from the actual name e.g. for an organization
    // github.context.payload.repository.owner.name
    //  - is the actual name
    const gitHubRepoOwnerLogin = githubContext.payload.repository.owner.login
    const gitHubRepoOwnerName = githubContext.payload.repository.owner.name
    var gitHubRepoOwner = null
    var gitHubRepoName = githubContext.payload.repository.name
    core.debug(
      'gitHubRepoOwnerLogin[' +
        gitHubRepoOwnerLogin +
        '] gitHubRepoOwnerName[' +
        gitHubRepoOwnerName +
        '] gitHubRepo[' +
        gitHubRepoName +
        ']'
    )
    // prefer the actual name, but fall back to the login if name is not available
    if (gitHubRepoOwnerName === undefined) {
      core.debug('Undefined GitHub repository.owner.name')
      gitHubRepoOwner = gitHubRepoOwnerLogin
    } else {
      gitHubRepoOwner = gitHubRepoOwnerName
    }
    // ensure we have valid repository information
    if (
      gitHubRepoOwner === null ||
      gitHubRepoOwner === '' ||
      gitHubRepoOwner === undefined
    ) {
      throw new Error('Unable to locate the repository owner')
    }
    if (
      gitHubRepoName === null ||
      gitHubRepoName === '' ||
      gitHubRepoName === undefined
    ) {
      throw new Error('Unable to locate the repository name')
    }
    core.info(
      'gitHubRepoitory owner[' +
        gitHubRepoOwner +
        '] name[' +
        gitHubRepoName +
        ']'
    )
    // additional configuration file
    //
    //
    // internal default changeType
    // internal other changeTypes
    // .github default location check
    // action input location check
    //
    // - how and/or should internal defaults be overwritten
    // - if specifing a configFile , should it supersied any internals
    // - if we deep merge defaults, how do do users remove any undesireable defaults
    //
    var configFile = null
    if (
      argConfigFile === null ||
      argConfigFile === '' ||
      argConfigFile === undefined
    ) {
      // no configuration file input specifed, check if a file exists at the
      // default github action location
      configFile = path.resolve(dirGithubActions, packageName, 'config.yml')
      if (!fs.existsSync(configFile)) {
        // just use the internal default configuration file included
        // with the action version
        core.debug( 'Configuration file not found at location[' + configFile + ']')
        configFile = undefined
        const configFilePaths = [
          path.resolve(__dirname, 'etc', 'config.yml'),
          path.resolve(dirRoot, 'etc', 'config.yml'),
        ];
        for (const filePath of configFilePaths) {
          core.debug( 'Checking for configuration file at default location[' + filePath + ']' )
          if (fs.existsSync(filePath)) {
            core.debug( 'Located configuration file at location[' + filePath + ']' )
            configFile = filePath;
            break;
          }
        }
        if (configFile === undefined) {
          throw new Error(
            'Unable to locate default configuration file[' + configFile + ']'
          )
        }
      }
    } else {
      configFile = argConfigFile
      if (!fs.existsSync(configFile)) {
        throw new Error('Configuration file[' + configFile + '] does not exist')
      }
    }
    core.debug('Configuration file[' + configFile + ']')
    // additional configuration file schema
    var schemaFile = null
    schemaFile = dirRoot + '/etc/config.schema.json'
    // NOTE: with this approach the folder struction becomes flat in ./dist
    //       when ncc transpiles the action code. e.g we loose the ./etc directory
    schemaFile = path.resolve(require.resolve(schemaFile))
    if (!fs.existsSync(schemaFile)) {
      throw new Error(
        'Unable to locate configuration schema[' + schemaFile + ']'
      )
    }
    core.debug('Configuration schema[' + schemaFile + ']')
    // configuration schema read
    var schemaReadFile = null
    try {
      schemaReadFile = fs.readFileSync(schemaFile, 'utf8')
    } catch (error) {
      throw new Error('Failed to read file[' + error.message + ']')
    }
    const schemaData = schemaReadFile
    core.debug('schemaData[' + schemaData + ']')
    // configuration file data
    var configReadFile = null
    try {
      configReadFile = fs.readFileSync(schemaFile, 'utf8')
    } catch (error) {
      throw new Error('Failed to read file[' + error.message + ']')
    }
    const configData = configReadFile
    core.debug('configData[' + configData + ']')
    core.endGroup()
    core.startGroup('Preparation')
    // ------------------------------------
    // ------------------------------------
    // check if we have a version input, and are just going to use that as the release version
    // if so, validate it and return it
    if (argVersionInputAsReleaseVersion === 'true') {
      if (argVersion !== null && argVersion !== '') {
        core.debug('argVersion[' + argVersion + ']')
        let semVer = semver.clean(argVersion)
        if (semVer === null || semVer === '' || semVer === undefined) {
          // strange, the input provided is invalid
          throw new Error('Invalid semver version[' + argVersion + ']')
        }
        if (argVersionInputAsReleaseVersion === 'true') {
          currentVersion = semVer
          core.info(
            'Using the current version[' +
              currentVersion +
              '] as the release version'
          )
          // ------------------------------------
          outVersionTag = currentVersion
          return outVersionTag // early exit
        }
      } else {
        throw new Error(
          'Action input[versionInputAsReleaseVersion] is true, but no version input has been provided'
        )
      }
    }
    // ------------------------------------
    // ------------------------------------
    // validate configuration file

    // ------------------------------------
    // ------------------------------------
    // get the "current" version
    // methods in order of precedence (arg -> env -> cfg -> def)
    // arg:
    //   - via argVersion action input
    //   - on release event, use the tag that triggered the workflow
    //   - on workflow_dispatch event, use the input version
    // env:
    //   - repository action variable, RELEASE_VERSION
    // cfg:
    //   - action configuration file
    //   - get the latest version from the git repository tags
    // def:
    //   - if no version found, use argInceptionVersionTag default
    // ------------------------------------
    var getVersionData = {}
    getVersionData = await getVersion(
      apiToken, // GitHub API token
      {
        // Action inputs
        tagPrefix: argTagPrefix,
        inceptionVersionTag: argInceptionVersionTag,
        versionTag: argVersion,
      }
    )
    core.debug('getVersionData[' + JSON.stringify(getVersionData) + ']')
    currentVersion = getVersionData.version
    core.info('currentVersion[' + currentVersion + ']')
    // ------------------------------------
    // determine the increment type ..initial thoughts
    // methods
    // - if no current version, start at argInceptionVersionTag and increment minor
    //  types:
    //   - major
    //     methods
    //      - pull request with "BREAKING CHANGE" in the body
    //      - pull request title contains "[major]"
    //      - pull request label "major"
    //      - branch prefix "major/"
    //   - minor
    //     methods
    //      - default if no other type matched
    //      - pull request title contains "[minor]"
    //      - pull request title contains "[feature]"
    //      - pull request label "minor"
    //      - pull request label "feature"
    //      - branch prefix "feature/"
    //   - patch
    //     methods
    //      - pull request title contains "[patch]"
    //      - pull request label "patch"
    //      - pull request label "fix"
    //      - branch prefix "fix/"
    //      - branch prefix "bug/"
    //   - premajor
    //     methods
    //      - pull request title contains "[major][pre|prerequisite]"
    //      - pull request label "major" & "pre|prerequisite"
    //      - branch prefix "premajor/"
    //   - preminor
    //     methods
    //      - pull request title contains "[preminor]"
    //      - pull request label "preminor"
    //      - branch prefix "preminor/"
    //   - prepatch
    //     methods
    //      - pull request title contains "[prepatch]"
    //      - pull request label "prepatch"
    //      - branch prefix "prepatch/"
    //   - prerelease
    //     methods
    //      - pull request title contains "[prerelease]"
    //      - pull request label "prerelease"
    //      - branch prefix "prerelease/"
    // ------------------------------------
    // increment the current version
    // methods
    // - if no current version, start at argInceptionVersionTag and increment minor
    // - if current version is from a release, do not increment
    // - if current version is from a workflow_dispatch, do not increment
    // - otherwise increment based on the type determined above
    // ------------------------------------
    const getReleaseTypeData = await getReleaseType(
      apiToken, // GitHub API token
      {
        // other optional inputs
        versionTagCurrent: currentVersion, // the identified current version
        versionTagHistory: getVersionData.history, // full version history, TODO: this be an issue with larger projects and version history
      }
    )
    core.info('getReleaseTypeData[' + JSON.stringify(getReleaseTypeData) + ']')
    core.endGroup()
    core.startGroup('Execution')
    // ------------------------------------
    const incrementedVersionData = await incrementVersion(currentVersion, {
      // other optional inputs
      releaseType: getReleaseTypeData.type,
      releaseChange: getReleaseTypeData.change,
    })
    core.debug(
      'incrementedVersionData[' + JSON.stringify(incrementedVersionData) + ']'
    )
    if (incrementedVersionData === null) {
      throw new Error('incrementVersion returned null data')
    }
    outVersionTag = incrementedVersionData.version.new
    // ------------------------------------
    core.endGroup()

    core.info(`version[${outVersionTag}]`)
    // remember output is defined in action metadata file
    core.setOutput('versionTag', `${outVersionTag}`)
    return outVersionTag
  } catch (error) {
    // Should any error occur, the action will fail and the workflow will stop
    // Using the actions toolkit (core) package to log a message and set exit code
    core.setFailed(error.message)
    process.exit(core.ExitCode.Failure)
  }
} // main
// EOF
