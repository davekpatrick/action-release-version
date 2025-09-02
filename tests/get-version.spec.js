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

describe("get-version.js", async function () {
  // ---------------------------------------------------
  let originalContext
  let moduleName = "get-version"
  // ---------------------------------------------------
  // Modules under test
  const github = require(dirNodeModules + path.sep + "@actions/github")
  // ---------------------------------------------------
  // utility modules
  const semverValid = require(dirNodeModules + path.sep + 'semver/functions/valid')
  // ---------------------------------------------------
  beforeEach(() => {
    // Store original context
    originalContext = Object.assign({}, github.context)
  })
  // ---------------------------------------------------
  afterEach(() => {
    // Restore original context
    Object.assign(github.context, originalContext)
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
    let requiredFile = path.resolve(dirNode, "lib/" + moduleName)
    // execute the test
    const result = require(requiredFile)
    console.log("result:[" + typeof result + "]")
    // Validate the test result
    expect(result).to.be.a("function")
  });

  it("Should accept default parameters", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies the behavior of the getVersion function when called with default parameters
    // - It ensures that the function can handle the absence of optional parameters gracefully
    // ---------------------------------------------------
    // fixture inputs
    const apiToken = process.env["GITHUB_TOKEN"]
    //
    const githubRepository = process.env["GITHUB_REPOSITORY"]
    const githubRepositoryOwner = process.env["GITHUB_REPOSITORY_OWNER"]
    const githubEventName = 'somethingStrange'
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
          }
        }
      }
    }
    // Mock core module to avoid actual core.info/debug calls
    const coreMock = {
      debug: () => {},
      info: () => {},
      setFailed: () => {}
    }
    // Use proxyquire to inject mocks
    const getVersionWithMocks = proxyquire(dirNode + path.sep + "lib/" + moduleName, {
      '@actions/github': githubMock,
      '@actions/core': coreMock
    })
    // execute the test
    const result = await getVersionWithMocks(apiToken)
    console.log("result:[" + result + "]")
    // Validate the test result
    expect(result).to.be.null
  })

  it("Should handle unknown event types", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies the behavior of the getVersion function when an unknown event type is received
    // - It ensures that the function can handle unexpected event types gracefully
    // ---------------------------------------------------
    // fixture inputs
    const apiToken = process.env["GITHUB_TOKEN"]
    const tagPrefix = process.env["INPUT_TAG_PREFIX"]
    const inceptionVersion = process.env["INPUT_INCEPTION_VERSION"]
    // 
    const githubRepository = process.env["GITHUB_REPOSITORY"]
    const githubRepositoryOwner = process.env["GITHUB_REPOSITORY_OWNER"]
    const githubEventName = 'somethingStrange'
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
          }
        }
      }
    }
    // Mock core module to avoid actual core.info/debug calls
    const coreMock = {
      debug: () => {},
      info: () => {},
      setFailed: () => {}
    }
    // Use proxyquire to inject mocks
    const getVersionWithMocks = proxyquire(dirNode + path.sep + "lib/get-version", {
      '@actions/github': githubMock,
      '@actions/core': coreMock
    })
    // execute the test
    const result = await getVersionWithMocks(apiToken, tagPrefix, inceptionVersion)
    console.log("result:[" + result + "]")
    // Validate the test result
    expect(result).to.be.null
  })

  it("Should handle pull_request event", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies the behavior of the getVersion function when a pull_request event is received
    // - It ensures that the function can extract the correct version information from the event payload
    // ---------------------------------------------------
    // fixture inputs
    const apiToken = process.env["GITHUB_TOKEN"]
    const tagPrefix = process.env["INPUT_TAG_PREFIX"]
    const inceptionVersion = process.env["INPUT_INCEPTION_VERSION"]
    //
    const githubRepository = process.env["GITHUB_REPOSITORY"]
    const githubRepositoryOwner = process.env["GITHUB_REPOSITORY_OWNER"]
    const githubCommitSha = process.env["GITHUB_SHA"]
    const githubPullRequestNumber = 314
    const githubRef = 'refs/pull/' + githubPullRequestNumber + '/head'
    const githubEventName = 'pull_request'
    // Mock GitHub module
    const githubMock = {
      context: {
        eventName: githubEventName,
        ref: githubRef,
        sha: githubCommitSha,
        payload: {
          repository: {
            name: githubRepository,
            owner: {
              name: githubRepositoryOwner
            }
          }
        }
      }
    }
    // Mock core module to avoid actual core.info/debug calls
    const coreMock = {
      debug: () => {},
      info: () => {},
      setFailed: () => {}
    }
    // Use proxyquire to inject mocks
    const getVersionWithMocks = proxyquire(dirNode + path.sep + "lib/get-version", {
      '@actions/github': githubMock,
      '@actions/core': coreMock
    })
    // execute the test
    const result = await getVersionWithMocks(apiToken, tagPrefix, inceptionVersion)
    console.log("result:[" + result + "]")
    // Validate the test result
    expect(result).to.be.null
  })

  it("Should handle workflow_dispatch event", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies the behavior of the getVersion function when a workflow_dispatch event is received
    // - It ensures that the function can extract the correct version information from the event payload
    // ---------------------------------------------------
    // fixture inputs
    const apiToken = process.env["GITHUB_TOKEN"]
    const tagPrefix = process.env["INPUT_TAG_PREFIX"]
    const inceptionVersion = process.env["INPUT_INCEPTION_VERSION"]
    //
    const githubRepository = process.env["GITHUB_REPOSITORY"]
    const githubRepositoryOwner = process.env["GITHUB_REPOSITORY_OWNER"]
    const githubEventName = 'workflow_dispatch'
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
          }
        }
      }
    }
    // Mock core module to avoid actual core.info/debug calls
    const coreMock = {
      debug: () => {},
      info: () => {},
      setFailed: () => {}
    }
    // Use proxyquire to inject mocks
    const getVersionWithMocks = proxyquire(dirNode + path.sep + "lib/get-version", {
      '@actions/github': githubMock,
      '@actions/core': coreMock
    })
    // execute the test
    const result = await getVersionWithMocks(apiToken, tagPrefix, inceptionVersion)
    console.log("result:[" + result + "]")
    // Validate the test result
    expect(result).to.be.null
  })

  it("Should handle release event", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies the behavior of the getVersion function when a release event is received
    // - It ensures that the function can extract the correct version information from the event payload
    // ---------------------------------------------------
    // fixture inputs
    const apiToken = process.env["GITHUB_TOKEN"]
    const tagPrefix = process.env["INPUT_TAGPREFIX"]
    const inceptionVersion = process.env["INPUT_INCEPTION_VERSION"]
    //
    const githubRepository = process.env["GITHUB_REPOSITORY"]
    const githubRepositoryOwner = process.env["GITHUB_REPOSITORY_OWNER"]
    const githubCommitSha = process.env["GITHUB_SHA"]
    const githubEventName = process.env["GITHUB_EVENT_NAME"]
    const releaseVersion = "1.2.3"
    // Mock the octokit client and getRef response
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
            tag_name: tagPrefix + releaseVersion
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
    const getVersionWithMocks = proxyquire(dirNode + path.sep + "lib/get-version", {
      '@actions/github': githubMock,
      '@actions/core': coreMock
    })
    // execute the test
    const result = await getVersionWithMocks(apiToken, tagPrefix, inceptionVersion)
    console.log("result:[" + result + "]")
    // Validate the test result
    expect(result).to.equal(releaseVersion)
    expect(semverValid(result)).to.not.be.null
  })

  it("Should handle push event with existing tags", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies the behavior of the getVersion function when a push event is received
    // - It ensures that the function can extract the correct version information from existing tags
    // ---------------------------------------------------
    // fixture inputs
    const apiToken = process.env["GITHUB_TOKEN"]
    const tagPrefix = "v"
    const inceptionVersion = "0.0.0"
    //
    const githubRepository = process.env["GITHUB_REPOSITORY"]
    const githubRepositoryOwner = process.env["GITHUB_REPOSITORY_OWNER"]
    const githubCommitSha = process.env["GITHUB_SHA"]
    const beforeCommitSha = "abc123def456"
    const gitRef = "refs/heads/main"
    const githubEventName = 'push'
    const latestTagName = "v1.2.3"
    const expectedVersion = "1.2.3"
    
    // Mock the octokit client with all required API calls
    const mockOctokit = {
      rest: {
        git: {
          getCommit: async () => ({
            status: 200,
            data: {
              sha: beforeCommitSha,
              message: "Previous commit"
            }
          }),
          listMatchingRefs: async () => ({
            status: 200,
            data: [
              {
                ref: "refs/tags/" + latestTagName,
                name: latestTagName,
                object: {
                  sha: beforeCommitSha
                }
              }
            ]
          })
        }
      },
      request: async () => ({
        status: 200,
        data: [
          {
            name: "main",
            commit: {
              sha: beforeCommitSha
            }
          }
        ]
      })
    }
    
    // Mock GitHub module
    const githubMock = {
      context: {
        eventName: githubEventName,
        ref: gitRef,
        sha: githubCommitSha,
        payload: {
          repository: {
            name: githubRepository,
            owner: {
              name: githubRepositoryOwner
            }
          },
          before: beforeCommitSha
        }
      },
      getOctokit: () => mockOctokit
    }
    
    // Mock core module to avoid actual core.info/debug calls
    const coreMock = {
      debug: () => {},
      info: () => {},
      warning: () => {},
      setFailed: () => {}
    }
    
    // Use proxyquire to inject mocks
    const getVersionWithMocks = proxyquire(dirNode + path.sep + "lib/get-version", {
      '@actions/github': githubMock,
      '@actions/core': coreMock
    })
    
    // execute the test
    const result = await getVersionWithMocks(apiToken, tagPrefix, inceptionVersion)
    console.log("result:[" + result + "]")
    
    // Validate the test result
    expect(result).to.equal(expectedVersion)
    expect(semverValid(result)).to.not.be.null
  })

  it("Should handle push event with no existing tags", async function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies the behavior of the getVersion function when a push event is received
    // - but no existing tags are found, so it should return the inception version
    // ---------------------------------------------------
    // fixture inputs
    const apiToken = process.env["GITHUB_TOKEN"]
    const tagPrefix = "v"
    const inceptionVersion = "0.0.0"
    //
    const githubRepository = process.env["GITHUB_REPOSITORY"]
    const githubRepositoryOwner = process.env["GITHUB_REPOSITORY_OWNER"]
    const githubCommitSha = process.env["GITHUB_SHA"]
    const beforeCommitSha = "abc123def456"
    const gitRef = "refs/heads/main"
    const githubEventName = 'push'
    
    // Mock the octokit client with empty tags response
    const mockOctokit = {
      rest: {
        git: {
          getCommit: async () => ({
            status: 200,
            data: {
              sha: beforeCommitSha,
              message: "Previous commit"
            }
          }),
          listMatchingRefs: async () => ({
            status: 200,
            data: [] // No tags found
          })
        }
      },
      request: async () => ({
        status: 200,
        data: [
          {
            name: "main",
            commit: {
              sha: beforeCommitSha
            }
          }
        ]
      })
    }
    
    // Mock GitHub module
    const githubMock = {
      context: {
        eventName: githubEventName,
        ref: gitRef,
        sha: githubCommitSha,
        payload: {
          repository: {
            name: githubRepository,
            owner: {
              name: githubRepositoryOwner
            }
          },
          before: beforeCommitSha
        }
      },
      getOctokit: () => mockOctokit
    }
    
    // Mock core module to avoid actual core.info/debug calls
    const coreMock = {
      debug: () => {},
      info: () => {},
      warning: () => {},
      setFailed: () => {}
    }
    
    // Use proxyquire to inject mocks
    const getVersionWithMocks = proxyquire(dirNode + path.sep + "lib/get-version", {
      '@actions/github': githubMock,
      '@actions/core': coreMock
    })
    
    // execute the test
    const result = await getVersionWithMocks(apiToken, tagPrefix, inceptionVersion)
    console.log("result:[" + result + "]")
    
    // Validate the test result
    expect(result).to.equal(inceptionVersion)
    expect(semverValid(result)).to.not.be.null
  })
})
// EOF
