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
  
  
  
  //let core
  //let github = require(dirNodeModules + path.sep + "@actions/github")
  //let githubApiUrl = process.env["GITHUB_API_URL"];
  
  beforeEach(() => {
    //core = require(dirNodeModules + path.sep + "@actions/core")
    //github = require(dirNodeModules + path.sep + "@actions/github")
          ///console.log("process.env:[" + JSON.stringify(process.env, null, 2) + "]")

    //
  });

  afterEach(() => {
    //
    //delete require.cache[require.resolve(dirNodeModules + path.sep + "@actions/core")]
    //delete require.cache[require.resolve(dirNodeModules + path.sep + "@actions/github")]

    proxyquire.preserveCache()
  });
  // ---------------------------------------------------
  // ---------------------------------------------------
  
  it("Should be a function", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - 
    // ---------------------------------------------------
    // fixture inputs
    let requiredFile = path.resolve(dirNode, "lib/index")
    // execute the test
    const result = require(requiredFile)
    // Validate the test result
    expect(result).to.be.a("function")
  });

  it("Run with default inputs (simplified)", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - 
    // ---------------------------------------------------
    // fixture inputs
    

    // Mock the octokit client and getRef response
    const mockOctokit = {
      rest: {
        git: {
          getRef: async () => ({
            status: 200,
            data: {
              object: {
                sha: "fake-commit-sha-for-tag"
              }
            }
          })
        }
      }
    }
    
    // Mock GitHub module
    const githubMock = {
      context: {
        eventName: "release",
        payload: {
          repository: {
            name: "action-release-version",
            owner: {
              name: "davekpatrick"
            }
          },
          release: {
            tag_name: "0.1.0"
          }
        }
      },
      getOctokit: () => mockOctokit
    }
    
    // Mock core module to avoid actual core.info/debug calls
    const coreMock = {
      debug: () => {},
      info: () => {},
      setFailed: () => {}
    }
    
    // Use proxyquire to inject mocks
    const main = proxyquire(dirNode + path.sep + "lib/get-version", {
      '@actions/github': githubMock,
      '@actions/core': coreMock
    })
    // execute the test
    const returnData = await main();
    // Validate the test result
    expect( returnData ).to.be.a("string");
    expect( returnData ).to.equal("0.1.0");  // Should be inception version + 1
  });

  it("Should increment minor version when no current version exists", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - 
    // ---------------------------------------------------
    // fixture inputs

    // Mock getVersion to return null (no current version)
    const getVersionStub = () => Promise.resolve(null)
    
    // Mock core to avoid actual outputs
    const coreStub = {
      getInput: (input) => {
        switch(input) {
          case 'tagPrefix': return 'v'
          case 'inceptionVersionTag': return '0.0.0'
          case 'argVersion': return ''
          case 'apiToken': return 'fake-token'
          default: return ''
        }
      },
      debug: () => {},
      info: () => {},
      setSecret: () => {},
      setOutput: () => {},
      setFailed: () => {}
    }
    
    const releaseVersion = proxyquire(dirNode + path.sep + "lib/index", {
      './get-version': getVersionStub,
      '@actions/core': coreStub
    })
    // execute the test
    const result = await releaseVersion()
    // Validate the test result
    expect(result).to.equal('0.1.0') // inception version incremented
  })

  it("Should increment minor version of current version", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - 
    // ---------------------------------------------------
    // fixture inputs

    // Mock getVersion to return a current version
    const getVersionStub = () => Promise.resolve('1.2.3')
    
    // Mock core to avoid actual outputs
    const coreStub = {
      getInput: (input) => {
        switch(input) {
          case 'tagPrefix': return 'v'
          case 'inceptionVersionTag': return '0.0.0'
          case 'argVersion': return ''
          case 'apiToken': return 'fake-token'
          default: return ''
        }
      },
      debug: () => {},
      info: () => {},
      setSecret: () => {},
      setOutput: () => {},
      setFailed: () => {}
    }
    
    const releaseVersion = proxyquire(dirNode + path.sep + "lib/index", {
      './get-version': getVersionStub,
      '@actions/core': coreStub
    })
    // execute the test
    const result = await releaseVersion()
    // Validate the test result
    expect(result).to.equal('1.3.0') // current version incremented
  })

  it("Should use provided version input directly", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - 
    // ---------------------------------------------------
    // fixture inputs

    // Mock core to return a specific version input
    const coreStub = {
      getInput: (input) => {
        switch(input) {
          case 'tagPrefix': return 'v'
          case 'inceptionVersionTag': return '0.0.0'
          case 'argVersion': return '2.3.4'
          case 'apiToken': return 'fake-token'
          default: return ''
        }
      },
      debug: () => {},
      info: () => {},
      setSecret: () => {},
      setOutput: () => {},
      setFailed: () => {}
    }
    
    const releaseVersion = proxyquire(dirNode + path.sep + "lib/index", {
      '@actions/core': coreStub
    })
    // execute the test
    const result = await releaseVersion()
    // Validate the test result
    expect(result).to.equal('2.4.0') // incremented version
  })

  it("Should use environment GITHUB_TOKEN when no API token provided", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - 
    // ---------------------------------------------------
    // fixture inputs

    process.env.GITHUB_TOKEN = 'env-token'
    
    // Mock getVersion to return a version
    const getVersionStub = () => Promise.resolve('1.0.0')
    
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
      debug: () => {},
      info: () => {},
      setSecret: () => {},
      setOutput: () => {},
      setFailed: () => {}
    }
    
    const releaseVersion = proxyquire(dirNode + path.sep + "lib/index", {
      './get-version': getVersionStub,
      '@actions/core': coreStub
    })
    // execute the test
    const result = await releaseVersion()
    // Validate the test result
    expect(result).to.equal('1.1.0') // incremented version
  })
});
// EOF
