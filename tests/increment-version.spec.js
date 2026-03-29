// BOF
const path = require("node:path")
// project directories
const dirRoot = path.normalize(__dirname + path.sep + "..")
const dirNode = path.resolve(dirRoot, "node")
const dirNodeModules = path.resolve(dirNode, "node_modules")
// test required modules
const { describe } = require("node:test")
// doc: https://www.chaijs.com/guide/styles/  ( BDD 'expect' assertion is being used vs the 'should' assertion style )
//      https://www.chaijs.com/api/bdd/
const expect = require(dirNodeModules + path.sep + "chai").expect
const proxyquire = require(dirNodeModules + path.sep + "proxyquire")
// ---------------------------------------------------
// ---------------------------------------------------
describe("function: increment-version.js", async function () {
  // ---------------------------------------------------
  let moduleName = "increment-version"
  let modulePath = path.resolve(dirNode, "lib", moduleName)
  // ---------------------------------------------------
  // Modules under test
  const github = require(dirNodeModules + path.sep + "@actions/github")
  // ---------------------------------------------------
  // utility modules
  const semverValid = require(
    dirNodeModules + path.sep + "semver/functions/valid",
  )
  const semverParse = require(
      dirNodeModules + path.sep + "semver/functions/parse",
    )
  // ---------------------------------------------------
  // Mocks
  const exitStub = (code) => {
    // Mock process.exit to prevent actual exit during tests
    throw new Error("Exiting with code[" + code + "]")
  }
  const processMock = {
    //
    exit: exitStub,
  }
  // ---------------------------------------------------
  beforeEach(() => {
    //
  })
  // ---------------------------------------------------
  afterEach(() => {
    //
    proxyquire.preserveCache()
  })
  // ---------------------------------------------------
  // ---------------------------------------------------
  context(moduleName + " functionality tests", function () {
    const cfgTrace = false

    it("Should be a function", async function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // -
      // ---------------------------------------------------
      let requiredFile = modulePath
      // execute the test
      const result = require(requiredFile)
      if (argTrace) {
        console.log("result:[" + typeof result + "]")
      }
      // Validate the test result
      expect(result).to.be.a("function")
    })

    it("Should accept default parameters", async function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // -
      // ---------------------------------------------------
      // fixture inputs
      const apiToken = process.env["GITHUB_TOKEN"]
      //
      const githubRepository = process.env["GITHUB_REPOSITORY"]
      const githubRepositoryOwner = process.env["GITHUB_REPOSITORY_OWNER"]
      const githubEventName = process.env["GITHUB_EVENT_NAME"]
      const githubDefaultBranchName =
        process.env["GITHUB_REF"].match(/[^/]+$/g)[0] // get last part of ref only aka branch name
      const currentVersion = "0.0.0"
      const expectedVersion = "0.1.0"
      // Mock core module to avoid actual core.info/debug calls
      const coreMock = {
        startGroup: () => {},
        endGroup: () => {},
        debug: () => {},
        info: () => {},
        warning: () => {},
      }
      // Use proxyquire to inject mocks
      const main = proxyquire(modulePath, {
        "@actions/core": coreMock,
        "node:process": processMock,
      })
      // execute the test
      const result = await main(currentVersion)
      if (argTrace) {
        console.log("result:[" + JSON.stringify(result) + "]")
      }
      // Validate the test result
      expect(result.version.old).to.be.string
      expect(result.version.old).to.equal(currentVersion)
      //
      expect(result.version.new).to.be.string
      expect(result.version.new).to.equal(expectedVersion)
      expect(semverValid(result.version.new)).to.not.be.null
    })

    it("Should handle pull_request event on initial build version default", async function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // -
      // ---------------------------------------------------
      // fixture inputs
      const apiToken = process.env["GITHUB_TOKEN"]
      //
      const githubRepository = process.env["GITHUB_REPOSITORY"]
      const githubRepositoryOwner = process.env["GITHUB_REPOSITORY_OWNER"]
      const githubEventName = process.env["GITHUB_EVENT_NAME"]
      const githubDefaultBranchName =
        process.env["GITHUB_REF"].match(/[^/]+$/g)[0] // get last part of ref only aka branch name
      const currentVersion = "0.0.0"
      const expectedVersion = "0.1.0"
      // Mock core module to avoid actual core.info/debug calls
      const coreMock = {
        startGroup: () => {},
        endGroup: () => {},
        debug: () => {},
        info: () => {},
        warning: () => {},
      }
      // Use proxyquire to inject mocks
      const main = proxyquire(modulePath, {
        "@actions/core": coreMock,
        "node:process": processMock,
      })
      // execute the test
      const result = await main(
        currentVersion,
        {
          releaseType: "build",
          change: "minor"
        }
      )
      if (argTrace) {
        console.log("result:[" + JSON.stringify(result) + "]")
        console.log(semverParse(result.version.new))
      }
      // Validate the test result
      expect(result.version.old).to.be.string
      expect(result.version.old).to.equal(currentVersion)
      //
      expect(result.version.new).to.be.string
      expect(semverValid(result.version.new)).to.not.be.null
      expect(semverParse(result.version.new).version).to.equal(expectedVersion)
      expect(semverParse(result.version.new).build).to.be.an('array')
      expect(semverParse(result.version.new).build.length).to.equal(3) // e.g. build: [ 'build', '20260328T204112', '1' ]
      expect(semverParse(result.version.new).build[0]).to.equal('build')
    })
  })
})
// EOF
