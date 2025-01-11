// BOF
const { randomUUID } = require("node:crypto")
const fs = require("node:fs")
const path = require("node:path")
const crypto = require('crypto') 
// project directories
const dirRoot = path.normalize(__dirname + path.sep + "..")
const dirNode = path.resolve(dirRoot, "node")
const dirNodeModules = path.resolve(dirNode, "node_modules")
// project files
const actionYamlFile = path.resolve(dirRoot, "action.yml")
const packageJsonFile = path.resolve(dirNode, "package.json")
// modules
const jsYaml = require(dirNodeModules + path.sep + "js-yaml")
/**
 * create a random GitHub token
 */
function createFakeGitHubToken() {
  let tokenPrefix = "ghp_"
  // create a randomly generated, 36 character long v4 UUID
  let randomString = crypto.randomUUID().replace(/-/g, '') // remove the dashes
  for ( i = 0; i < 4; i++ ) {
    // add some random characters to the end
    randomString += crypto.randomBytes(4).toString('hex')
  }
  let randomStringLength = randomString.length
  let randomStringRandomIndex = crypto.getRandomValues(new Uint32Array(randomStringLength))
  let tokenData = ''
  for ( i = 0; i < randomStringLength; i++ ) {
    // add some upper and lower case mix
    if ( randomStringRandomIndex[i] % 2 == 0 ) {
      tokenData += randomString.charAt(i).toUpperCase() 
    } else {
      tokenData += randomString.charAt(i)
    }
  }
  //
  return tokenPrefix + tokenData
}
/**
 * Read the `action.yml` and include the default values for each input
 * as an environment variable, just like the Actions runtime does
 */
function getDefaultEnvironmentValues() {
  const actionYamlData = fs.readFileSync(actionYamlFile, "utf8")
  const { inputs } = jsYaml.load(actionYamlData)
  return Object.keys(inputs).reduce(
    (data, key) => ({
      ...data,
      // replace spaces with underscores and make upper case
      ["INPUT_" + key.replace(/ /g, "_").toUpperCase()]: (inputs[key].default || ""),
    }),
    {}
  )
}
/**
 *
 */
function setLocalTestEnvironmentValues(packageJsonData) {
  const env = process.env
  if (env.CI !== "true") {
    console.log("Running locally")
    // set local values
    // doc: https://docs.github.com/en/actions/learn-github-actions/variables#default-environment-variables
    return {
      GITHUB_API_URL: "https://api.github.com",
      GITHUB_ACTION: "run",
      GITHUB_RUN_ID: "5247257767",
      GITHUB_RUN_NUMBER: "28",
      GITHUB_ACTOR: packageJsonData.author,
      // The webhook event that triggered the workflow
      GITHUB_EVENT_NAME: "release",
      // The path to a temporary file that contains the JSON payload of the event
      GITHUB_EVENT_PATH: path.join(__dirname, "fixtures", "release.json"),
      GITHUB_REF: "refs/heads/main",
      GITHUB_REPOSITORY: packageJsonData.name.replace(/^@/, ""),
      GITHUB_REPOSITORY_OWNER: packageJsonData.author,
      // The commit SHA that triggered the workflow
      GITHUB_SHA: "ffac537e6cbbf934b08745a378932722df287a53",
      // doc: https://docs.github.com/en/actions/security-guides/automatic-token-authentication
      //      https://docs.github.com/en/actions/learn-github-actions/contexts#github-context
     GITHUB_TOKEN: createFakeGitHubToken(),
      // The name of the workflow currently being run
      GITHUB_WORKFLOW: "default",
      // The default working directory on the runner for steps in a job
      // doc: https://docs.github.com/en/actions/learn-github-actions/variables#default-environment-variables
      GITHUB_WORKSPACE: path.join(__dirname, "fixtures", "workspace"),
      HOME: "?",
      ACTIONS_STEP_DEBUG: "true",
    }
  } else {
    console.log("Running in CI")
    return {}
  }
}
/**
 *
 */
before(async () => {
  let packageJsonData = require(packageJsonFile);

  // set the environment variables
  Object.assign(
    process.env,
    setLocalTestEnvironmentValues(packageJsonData),
    getDefaultEnvironmentValues(),
  );
  // set the working directory
  //process.chdir(GITHUB_WORKSPACE);
});
