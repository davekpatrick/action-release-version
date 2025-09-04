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
    let requiredFile = modulePath
    // execute the test
    const result = require(requiredFile)
    console.log("result:[" + typeof result + "]")
    // Validate the test result
    expect(result).to.be.a("function")
  });

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
    const githubCommitSha = process.env["GITHUB_SHA"]
    const githubEventName = process.env["GITHUB_EVENT_NAME"]
    const githubRepository = process.env["GITHUB_REPOSITORY"]
    const githubRepositoryOwner = process.env["GITHUB_REPOSITORY_OWNER"]
    const expectedVersion = "0.1.0"
    // Mock getVersion to return inception version
    const getVersionStub = () => Promise.resolve(inceptionVersion)
    // Mock the octokit client and responses
    const mockOctokit = {
      rest: {
        git: {
          getRef: async () => ({
            status: 200,
            data: {
              object: {
                sha: githubCommitSha
              }
            }
          })
        }
      }
    }
    // Mock GitHub module
    const githubMock = {
      context: {
        eventName: githubEventName,
        payload: {
          repository: {
            name: githubRepository,
            owner: {
              name: githubRepositoryOwner
            }
          },
          release: {
            tag_name: expectedVersion
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
    const main = proxyquire(modulePath, {
      './get-version': getVersionStub,
      '@actions/github': githubMock,
      '@actions/core': coreMock
    })
    // execute the test
    const result = await main();
    console.log("result:[" + result + "]")
    // Validate the test result
    expect( result ).to.be.a("string");
    expect( result ).to.equal(expectedVersion);  // Should be inception version + 1
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
    const getVersionStub = () => Promise.resolve(null)
    
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
      debug: () => {},
      info: () => {},
      setSecret: () => {},
      setOutput: () => {},
      setFailed: () => {}
    }
    // Use proxyquire to inject mocks
    const main = proxyquire(modulePath, {
      './get-version': getVersionStub,
      '@actions/core': coreStub
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
    
    const releaseVersion = proxyquire(modulePath, {
      './get-version': getVersionStub,
      '@actions/core': coreStub
    })
    // execute the test
    const result = await releaseVersion()
    console.log("result:[" + result + "]")
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
    
    const releaseVersion = proxyquire(modulePath, {
      '@actions/core': coreStub
    })
    // execute the test
    const result = await releaseVersion()
    console.log("result:[" + result + "]")
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
    
    const releaseVersion = proxyquire(modulePath, {
      './get-version': getVersionStub,
      '@actions/core': coreStub
    })
    // execute the test
    const result = await releaseVersion()
    console.log("result:[" + result + "]")
    // Validate the test result
    expect(result).to.equal('1.1.0') // incremented version
  })

  it("Should call core.setOutput with correct versionTag", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies that core.setOutput is called with the correct parameters
    // - It ensures that the 'versionTag' output is set with the expected version value
    // ---------------------------------------------------
    // fixture inputs
    const expectedVersion = '2.3.0'
    let setOutputCalled = false
    let setOutputKey = null
    let setOutputValue = null
    
    // Mock getVersion to return a specific version
    const getVersionStub = () => Promise.resolve('2.2.0')
    
    // Mock core with tracked setOutput calls
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
      setOutput: (key, value) => {
        setOutputCalled = true
        setOutputKey = key
        setOutputValue = value
      },
      setFailed: () => {}
    }
    
    const releaseVersion = proxyquire(modulePath, {
      './get-version': getVersionStub,
      '@actions/core': coreStub
    })
    
    // execute the test
    const result = await releaseVersion()
    console.log("result:[" + result + "]")
    
    // Validate the test result
    expect(result).to.equal(expectedVersion)
    expect(setOutputCalled).to.be.true
    expect(setOutputKey).to.equal('versionTag')
    expect(setOutputValue).to.equal(expectedVersion)
  })
});
// EOF
