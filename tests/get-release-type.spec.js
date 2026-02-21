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
describe("function: get-release-type.js", async function () {
  // ---------------------------------------------------
  let moduleName = "get-release-type"
  let modulePath = path.resolve(dirNode, "lib", moduleName)
  // ---------------------------------------------------
  // Modules under test
  const github = require(dirNodeModules + path.sep + "@actions/github")
  // ---------------------------------------------------
  // utility modules
  const semverValid = require(
    dirNodeModules + path.sep + "semver/functions/valid",
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
      const githubEventName = "release"
      const githubDefaultBranchName =
        process.env["GITHUB_REF"].match(/[^/]+$/g)[0] // get last part of ref only aka branch name
      // Mock the octokit client with all required API calls
      const mockOctokit = {
        rest: {
          repos: {
            get: async () => ({
              status: 200,
              data: {
                name: githubRepository,
                owner: {
                  login: githubRepositoryOwner,
                },
                default_branch: githubDefaultBranchName,
              },
            }),
          },
        },
      }
      // Mock GitHub module
      const githubMock = {
        context: {
          eventName: githubEventName,
          payload: {
            repository: {
              name: githubRepository,
              owner: {
                login: githubRepositoryOwner,
                name: githubRepositoryOwner,
              },
            },
          },
        },
        getOctokit: () => mockOctokit,
      }
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
        "@actions/github": githubMock,
        "@actions/core": coreMock,
        "node:process": processMock,
      })
      // execute the test
      const result = await main(apiToken)
      if (argTrace) {
        console.log("result:[" + JSON.stringify(result) + "]")
      }
      // Validate the test result
      expect(result.event).to.be.string
      expect(result.event).to.equal(githubEventName)
      expect(result.type).to.be.string
      expect(result.type).to.equal("initial")
      expect(result.change).to.be.string
      expect(result.change).to.equal("none")
    })
  })
})
// EOF
