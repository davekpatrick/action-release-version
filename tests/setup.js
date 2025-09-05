// BOF
const path = require("node:path");
// project directories
const dirRoot = path.normalize(__dirname + path.sep + "..")
const dirNode = path.resolve(dirRoot, "node")
const dirNodeModules = path.resolve(dirNode, "node_modules")
// project files
const actionYamlFile = path.resolve(dirRoot, "action.yml");
const packageJsonFile = path.resolve(dirNode, "package.json");
// utility modules
const fs = require("node:fs");
const jsYaml = require(dirNodeModules + path.sep + "js-yaml");
/**
 * create a random GitHub token
 */
function createFakeGitHubToken() {
  let tokenPrefix = "ghp_"
  const crypto = require('node:crypto');
  // create a randomly generated, 36 character long v4 UUID
  let randomString = crypto.randomUUID().replace(/-/g, '') // remove the dashes
  for ( i = 0; i < 4; i++ ) {
    // add some random characters to the end
    randomString += crypto.randomBytes(4).toString('hex')
  }
  let randomStringLength = randomString.length
  console.log("randomStringLength:[" + randomStringLength + "]")
  let randomStringRandomIndex = crypto.webcrypto.getRandomValues(new Uint32Array(randomStringLength))
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
function setLocalTestEnvironmentValues(
  data
) {
  const env = process.env;
  if (env.CI !== "true") {
    console.log("runningIn:[localEnvironment]");
    // set local values
    // doc: https://docs.github.com/en/actions/learn-github-actions/variables#default-environment-variables
    return {
      GITHUB_API_URL: "https://api.github.com",
      GITHUB_ACTION: "run",
      GITHUB_RUN_ID: "5247257767",
      GITHUB_RUN_NUMBER: "28",
      GITHUB_ACTOR: data.author,
      // The webhook event that triggered the workflow
      GITHUB_EVENT_NAME: "release",
      // The path to a temporary file that contains the JSON payload of the event
      GITHUB_EVENT_PATH: path.join(__dirname, "fixtures", "release.json"),
      GITHUB_REF: "refs/heads/main",
      // davekpatrick/action-release-version
      //GITHUB_REPOSITORY: data.name.replace(/@.*\//, ""),
      GITHUB_REPOSITORY: data.name.replace(/^@/, ""),
      GITHUB_REPOSITORY_OWNER: data.author,
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
    console.log("runningIn:[continuousIntegration]");
    return {};
  }
}
/**
 * Setup the test environment
 */

// ---------------------------------------------------
before(async () => {
  // runs once before the first test
  console.log("dirRoot:[" + dirRoot + "]")
  this.packageJsonData = require(packageJsonFile);
  // set the environment variables
  Object.assign(
    process.env,
    setLocalTestEnvironmentValues(this.packageJsonData),
    getDefaultEnvironmentValues()
  );
  console.log("Unit Tests Starting" )
  console.log("---------------------------------------------------")
});
// ---------------------------------------------------
beforeEach(function() {
  // runs before each test in every describe block
  
});
// ---------------------------------------------------
afterEach(function() {
  // runs after each test in every describe block
  
});
// ---------------------------------------------------
after(async () => {
  // runs once after the last test
  console.log("---------------------------------------------------")
  console.log("Unit Tests Finished")
} );
// EOF
