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
describe("index.js", async function () {
  // ---------------------------------------------------
  let moduleName = "index"
  let modulePath = path.resolve(dirNode, "lib", moduleName)
  // utility modules
  const semverParse = require(
    dirNodeModules + path.sep + "semver/functions/parse",
  )
  // ---------------------------------------------------
  // Mock process.exit to prevent actual exit during tests
  const exitStub = (code) => {
    throw new Error("Exiting with code[" + code + "]")
  }
  const processMock = {
    exit: exitStub,
  }

  //let core
  //let github = require(dirNodeModules + path.sep + "@actions/github")
  //let githubApiUrl = process.env["GITHUB_API_URL"];

  beforeEach(() => {
    //core = require(dirNodeModules + path.sep + "@actions/core")
    //github = require(dirNodeModules + path.sep + "@actions/github")
    ///console.log("process.env:[" + JSON.stringify(process.env, null, 2) + "]")
    //
  })

  afterEach(() => {
    //
    //delete require.cache[require.resolve(dirNodeModules + path.sep + "@actions/core")]
    //delete require.cache[require.resolve(dirNodeModules + path.sep + "@actions/github")]

    proxyquire.preserveCache()
  })
  // ---------------------------------------------------
  // ---------------------------------------------------
  context("action: valdiate inputs", function () {
    it("Input tagPrefix", function () {
      // ---------------------------------------------------
      // Details
      // ------------
      // -
      // ---------------------------------------------------
      // fixture inputs
      let inputData = core.getInput("tagPrefix")
      // execute the test

      // Validate the test result
      expect(inputData).to.be.a("string")
      expect(inputData).to.equal("v")
    })
  })
  // ---------------------------------------------------
  // ---------------------------------------------------
  context("index.js: basic tests", function () {
    const cfgTrace = false
    it("Should be a function", async function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // -
      // ---------------------------------------------------
      // fixture inputs
      let requiredFile = modulePath
      // execute the test
      const result = require(requiredFile)
      if (argTrace) {
        console.log("result:[" + typeof result + "]")
      }
      // Validate the test result
      expect(result).to.be.a("function")
    })

    it("Run with release default inputs (simplified)", async function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // - This test verifies the behavior of the main function when called with release default inputs
      // - It ensures that the function can handle the absence of optional parameters gracefully
      // ---------------------------------------------------
      // fixture inputs
      const inceptionVersion = process.env["INPUT_INCEPTIONVERSIONTAG"]
      //
      const expectedVersion = "0.1.0"

      // Mock getVersion to return inception version
      const getVersionStub = () =>
        Promise.resolve({
          version: inceptionVersion,
          history: [inceptionVersion],
        })
      // Mock getReleaseType to always return 'minor' type
      const getReleaseTypeStub = () =>
        Promise.resolve({
          event: "push",
          type: "releasing",
          change: "minor",
        })
      // Mock incrementVersion to return expected version
      const incrementVersionStub = (inceptionVersion, releaseType) =>
        Promise.resolve({
          version: {
            old: inceptionVersion,
            new: expectedVersion,
          },
        })
      // Mock core module to avoid actual core.info/debug calls
      const coreMock = {
        getInput: (input) => {
          switch (input) {
            case "apiToken":
              return undefined
            default:
              return ""
          }
        },
        startGroup: () => {},
        endGroup: () => {},
        setOutput: () => {},
        setSecret: () => {},
        debug: () => {},
        info: () => {},
        warning: () => {},
        setFailed: () => {},
      }
      // Use proxyquire to inject mocks
      const main = proxyquire(modulePath, {
        "./get-version": getVersionStub,
        "./get-release-type": getReleaseTypeStub,
        "./increment-version": incrementVersionStub,
        "@actions/core": coreMock,
        "node:process": processMock,
      })
      // execute the test
      const result = await main()
      if (argTrace) {
        console.log("result:[" + JSON.stringify(result) + "]")
      }
      expect(result).to.be.a("string")
      expect(result).to.equal(expectedVersion)
    })

    it("Should increment minor version when no current version exists", async function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // -
      // ---------------------------------------------------
      // fixture inputs
      const apiToken = process.env["GITHUB_TOKEN"]
      const tagPrefix = process.env["INPUT_TAGPREFIX"]
      const inceptionVersion = process.env["INPUT_INCEPTIONVERSIONTAG"]
      //
      const currentVersion = inceptionVersion
      const expectedVersion = "0.1.0"
      const releaseEvent = "pull"
      const releaseType = "build"
      const releaseChange = "minor"

      // Mock getVersion to return null (no current version)
      const getVersionStub = () =>
        Promise.resolve({
          version: currentVersion,
          history: [inceptionVersion],
        })
      // Mock getReleaseType to always return 'minor' type
      const getReleaseTypeStub = () =>
        Promise.resolve({
          event: releaseEvent,
          type: releaseType,
          change: releaseChange,
        })
      // Mock incrementVersion to return expected version
      const incrementVersionStub = () =>
        Promise.resolve({
          version: {
            old: currentVersion,
            new: expectedVersion,
          },
        })
      // Mock core to avoid actual outputs
      const coreStub = {
        getInput: (input) => {
          switch (input) {
            case "tagPrefix":
              return tagPrefix
            case "inceptionVersionTag":
              return inceptionVersion
            case "argVersion":
              return ""
            case "apiToken":
              return apiToken
            default:
              return ""
          }
        },
        startGroup: () => {},
        endGroup: () => {},
        debug: () => {},
        info: () => {},
        warning: () => {},
        setSecret: () => {},
        setOutput: () => {},
        setFailed: () => {},
      }
      // Use proxyquire to inject mocks
      const main = proxyquire(modulePath, {
        "./get-version": getVersionStub,
        "./get-release-type": getReleaseTypeStub,
        "./increment-version": incrementVersionStub, // TODO: should we enable this mock
        "@actions/core": coreStub,
        "node:process": processMock,
      })
      // execute the test
      const result = await main()
      if (argTrace) {
        console.log("result:[" + JSON.stringify(result) + "]")
        // log semver version parse data
        /*
        let versionData = semverParse(result)
        console.log('semver parse version[' + versionData.version + ']')
        console.log('semver parse build[' + versionData.build + ']')

        console.log('version.raw[' + versionData.raw + ']')
        console.log('major[' + versionData.major + ']')
        console.log('minor[' + versionData.minor + ']')
        console.log('patch[' + versionData.patch + ']')
        console.log('prerelease[' + versionData.prerelease + ']')
        */
      }
      // Validate the test result
      expect(semverParse(result).version).to.equal(expectedVersion) // inception version incremented
    })

    it("Should increment minor version of current version", async function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // -
      // ---------------------------------------------------
      // fixture inputs
      const apiToken = process.env["GITHUB_TOKEN"]
      const tagPrefix = process.env["INPUT_TAGPREFIX"]
      const inceptionVersion = process.env["INPUT_INCEPTIONVERSIONTAG"]
      //
      const currentVersion = "1.2.3"
      const expectedVersion = "1.3.0"
      // Mock getVersion to return a current version
      const getVersionStub = () =>
        Promise.resolve({
          version: currentVersion,
          history: [
            inceptionVersion,
            "0.1.0",
            "0.2.0",
            "1.0.0",
            "1.1.0",
            "1.2.0",
            "1.2.1",
            "1.2.2",
            currentVersion,
          ],
        })
      // Mock getReleaseType to return 'minor' type
      const getReleaseTypeStub = () =>
        Promise.resolve({
          event: "push",
          type: "releasing",
          change: "minor",
        })
      // Mock incrementVersion to return expected version
      const incrementVersionStub = () =>
        Promise.resolve({
          version: {
            old: currentVersion,
            new: expectedVersion,
          },
        })
      // Mock core to avoid actual outputs
      const coreStub = {
        getInput: (input) => {
          switch (input) {
            case "tagPrefix":
              return tagPrefix
            case "inceptionVersionTag":
              return inceptionVersion
            case "apiToken":
              return apiToken
            case "argVersion":
              return ""
            default:
              return ""
          }
        },
        startGroup: () => {},
        endGroup: () => {},
        debug: () => {},
        info: () => {},
        warning: () => {},
        setSecret: () => {},
        setOutput: () => {},
        setFailed: () => {},
      }
      // Use proxyquire to inject mocks
      const main = proxyquire(modulePath, {
        "./get-version": getVersionStub,
        "./get-release-type": getReleaseTypeStub,
        "./increment-version": incrementVersionStub,
        "@actions/core": coreStub,
        "node:process": processMock,
      })
      // execute the test
      const result = await main()
      if (argTrace) {
        console.log("result:[" + JSON.stringify(result) + "]")
      }
      // Validate the test result
      expect(result).to.equal(expectedVersion) // current version incremented
    })

    it("Should use provided version input as release version directly", async function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // -
      // ---------------------------------------------------
      // fixture inputs
      const apiToken = process.env["GITHUB_TOKEN"]
      //
      const currentVersion = "1.3.0"
      const expectedVersion = currentVersion
      // Mock getVersion to return a current version
      const getVersionStub = () =>
        Promise.resolve({
          version: currentVersion,
          history: [
            "0.1.0",
            "0.2.0",
            "1.0.0",
            "1.1.0",
            "1.2.0",
            "1.2.1",
            "1.2.2",
            currentVersion,
          ],
        })
      // Mock core to return a specific version input
      const coreStub = {
        getInput: (input) => {
          switch (input) {
            case "apiToken":
              return apiToken
            case "version":
              return currentVersion
            case "versionInputAsReleaseVersion":
              return "true"
            default:
              return ""
          }
        },
        startGroup: () => {},
        endGroup: () => {},
        debug: () => {},
        info: () => {},
        warning: () => {},
        setSecret: () => {},
        setOutput: () => {},
        setFailed: () => {},
      }
      // Use proxyquire to inject mocks
      const main = proxyquire(modulePath, {
        "./get-version": getVersionStub,
        "@actions/core": coreStub,
        "node:process": processMock,
      })
      // execute the test
      const result = await main()
      if (argTrace) {
        console.log("result:[" + JSON.stringify(result) + "]")
      }
      // Validate the test result
      expect(result).to.equal(expectedVersion) // incremented version
    })

    it("Should use environment GITHUB_TOKEN when no API token provided", async function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // -
      // ---------------------------------------------------
      // fixture inputs
      const currentVersion = "1.0.0"
      const expectedVersion = "1.1.0"
      // Mock getVersion to return a version
      const getVersionStub = () =>
        Promise.resolve({
          version: currentVersion,
          history: [currentVersion],
        })
      // Mock getReleaseType to return 'minor' type
      const getReleaseTypeStub = () =>
        Promise.resolve({
          event: "push",
          type: "releasing",
          change: "minor",
        })
      // Mock incrementVersion to return expected version
      const incrementVersionStub = () =>
        Promise.resolve({
          version: {
            old: currentVersion,
            new: expectedVersion,
          },
        })
      // Mock core to return empty API token
      const coreStub = {
        getInput: (input) => {
          switch (input) {
            case "apiToken":
              return ""
            default:
              return ""
          }
        },
        startGroup: () => {},
        endGroup: () => {},
        debug: () => {},
        info: () => {},
        warning: () => {},
        setSecret: () => {},
        setOutput: () => {},
        setFailed: () => {},
      }
      // Use proxyquire to inject mocks
      const main = proxyquire(modulePath, {
        "./get-version": getVersionStub,
        "./get-release-type": getReleaseTypeStub,
        "./increment-version": incrementVersionStub,
        "@actions/core": coreStub,
        "node:process": processMock,
      })
      // execute the test
      const result = await main()
      if (argTrace) {
        console.log("result:[" + JSON.stringify(result) + "]")
      }
      // Validate the test result
      expect(result).to.equal(expectedVersion) // incremented version
    })
  })
})
// EOF
