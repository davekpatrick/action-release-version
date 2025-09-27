// BOF
const path = require("node:path");
// project directories
const dirRoot = path.normalize(__dirname + path.sep + "..");
const dirNode = path.resolve(dirRoot, "node");
const dirNodeModules = path.resolve(dirNode, "node_modules");
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
  // ---------------------------------------------------
  // Mock process.exit to prevent actual exit during tests
  const exitStub = (code) => {
    throw new Error("Exiting with code[" + code + "]")
  }
  const processMock = {
    exit: exitStub
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
  
  it("Should be a function", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - 
    // ---------------------------------------------------
    // fixture inputs
    let requiredFile = modulePath
    // execute the test
    const result = require(requiredFile)
    console.log("result:[" + typeof result + "]")
    // Validate the test result
    expect(result).to.be.a("function")
  })

  it("Run with release default inputs (simplified)", async function () {
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
    const getVersionStub = () => Promise.resolve(
      {
        version: inceptionVersion,
        history: [
          inceptionVersion,
        ]
      }
    )
    // Mock getReleaseType to always return 'minor' type
    const getReleaseTypeStub = () => Promise.resolve(
      {
        event: 'pull_request',
        type: 'build',
        change: 'minor'
      }
    )
    // Mock core module to avoid actual core.info/debug calls
    const coreMock = {
      getInput: (input) => {
        switch(input) {
          case 'apiToken': return undefined
          default: return ''
        }
      },
      startGroup: () => {},
      endGroup: () => {},
      setOutput: () => {},
      setSecret: () => {},
      debug: () => {},
      info: () => {},
      warning: () => {},
      //setFailed: () => {}
    }
    // Use proxyquire to inject mocks
    const main = proxyquire(modulePath, {
      './get-version': getVersionStub,
      './get-release-type': getReleaseTypeStub,
      '@actions/core': coreMock,
      'node:process': processMock
    })
    // execute the test
    const result = await main()
    console.log("result:[" + result + "]")
    expect(result)
      .to.be.a("string")
      .and.to.equal(expectedVersion)
      //.to.not.throw()

    //const result = await main();
    //console.log("result:[" + result + "]")
    // Validate the test result
    //expect( result ).to.be.a("string");
    //expect( result ).to.equal(expectedVersion);  // Should be inception version + 1
  });

  it("Should increment minor version when no current version exists", async function () {
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
    const expectedVersion = "0.1.0"
    // Mock getVersion to return null (no current version)
    const getVersionStub = () => Promise.resolve(
      
      {
        version: null,
        history: []
      }
    )
    // Mock getReleaseType to always return 'minor' type
    const getReleaseTypeStub = () => Promise.resolve(
      {
        event: 'pull_request',
        type: 'build',
        change: 'minor'
      }
    )
    // Mock core to avoid actual outputs
    const coreStub = {
      getInput: (input) => {
        switch(input) {
          case 'tagPrefix': return tagPrefix
          case 'inceptionVersionTag': return inceptionVersion
          case 'argVersion': return ''
          case 'apiToken': return apiToken
          default: return ''
        }
      },
      startGroup: () => {},
      endGroup: () => {},
      debug: () => {},
      info: () => {},
      warning: () => {},
      setSecret: () => {},
      setOutput: () => {},
      setFailed: () => {}
    }
    // Use proxyquire to inject mocks
    const main = proxyquire(modulePath, {
      './get-version': getVersionStub,
      './get-release-type': getReleaseTypeStub,
      '@actions/core': coreStub,
      'node:process': processMock
    })
    // execute the test
    const result = await main()
    console.log("result:[" + result + "]")
    // Validate the test result
    expect(result).to.equal(expectedVersion) // inception version incremented
  })

  it("Should increment minor version of current version", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - 
    // ---------------------------------------------------
    // fixture inputs
    const apiToken = process.env["GITHUB_TOKEN"]
    //
    const currentVersion = "1.2.3"
    const expectedVersion = "1.3.0"
    // Mock getVersion to return a current version
    const getVersionStub = () => Promise.resolve(
      {
        version: currentVersion,
        history: [
          '0.1.0',
          '0.2.0',
          '1.0.0',
          '1.1.0',
          '1.2.0',
          '1.2.1',
          '1.2.2',
          currentVersion
        ]
      }
    )
    // Mock getReleaseType to return 'minor' type
    const getReleaseTypeStub = () => Promise.resolve(
      {
        event: 'push'
      }
    )
    // Mock core to avoid actual outputs
    const coreStub = {
      getInput: (input) => {
        switch(input) {
          case 'tagPrefix': return 'v'
          case 'inceptionVersionTag': return '0.0.0'
          case 'argVersion': return ''
          case 'apiToken': return apiToken
          default: return ''
        }
      },
      startGroup: () => {},
      endGroup: () => {},
      debug: () => {},
      info: () => {},
      warning: () => {},
      setSecret: () => {},
      setOutput: () => {},
      //setFailed: () => {}
    }
    // Use proxyquire to inject mocks
    const main = proxyquire(modulePath, {
      './get-version': getVersionStub,
      './get-release-type': getReleaseTypeStub,
      '@actions/core': coreStub,
      'node:process': processMock
    })
    // execute the test
    const result = await main()
    console.log("result:[" + result + "]")
    // Validate the test result
    expect(result).to.equal(expectedVersion) // current version incremented
  })

  it("Should use provided version input directly", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - 
    // ---------------------------------------------------
    // fixture inputs
    const apiToken = process.env["GITHUB_TOKEN"]
    //
    const currentVersion = '2.3.4'
    const expectedVersion = currentVersion
    // Mock core to return a specific version input
    const coreStub = {
      getInput: (input) => {
        switch(input) {
          case 'tagPrefix': return 'v'
          case 'inceptionVersionTag': return '0.0.0'
          case 'argVersion': return currentVersion
          case 'apiToken': return apiToken
          default: return ''
        }
      },
      startGroup: () => {},
      endGroup: () => {},
      debug: () => {},
      info: () => {},
      warning: () => {},
      setSecret: () => {},
      setOutput: () => {},
      //setFailed: () => {}
    }
    // Use proxyquire to inject mocks
    const main = proxyquire(modulePath, {
      '@actions/core': coreStub,
      'node:process': processMock
    })
    // execute the test
    const result = await main()
    console.log("result:[" + result + "]")
    // Validate the test result
    expect(result).to.equal(expectedVersion) // incremented version
  })

  it("Should use environment GITHUB_TOKEN when no API token provided", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - 
    // ---------------------------------------------------
    // fixture inputs
    const currentVersion = "1.0.0"
    const expectedVersion = "1.1.0"
    // Mock getVersion to return a version
    const getVersionStub = () => Promise.resolve(
      {
        version: currentVersion,
        history: [
          currentVersion
        ]
      }
    )
    // Mock getReleaseType to return 'minor' type
    const getReleaseTypeStub = () => Promise.resolve(
      {
        event: 'push'
      }
    )
    // Mock core to return empty API token
    const coreStub = {
      getInput: (input) => {
        switch(input) {
          case 'tagPrefix': return 'v'
          case 'inceptionVersionTag': return '0.0.0'
          case 'argVersion': return ''
          case 'apiToken': return ''
          default: return ''
        }
      },
      startGroup: () => {},
      endGroup: () => {},
      debug: () => {},
      info: () => {},
      warning: () => {},
      setSecret: () => {},
      setOutput: () => {},
      setFailed: () => {}
    }
    // Use proxyquire to inject mocks
    const main = proxyquire(modulePath, {
      './get-version': getVersionStub,
      './get-release-type': getReleaseTypeStub,
      '@actions/core': coreStub,
      'node:process': processMock
    })
    // execute the test
    const result = await main()
    console.log("result:[" + result + "]")
    // Validate the test result
    expect(result).to.equal(expectedVersion) // incremented version
  })
})
// EOF
