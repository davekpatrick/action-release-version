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
  let moduleName = "get-version"
  let modulePath = path.resolve(dirNode, "lib", moduleName)
  let originalContext
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
    let requiredFile = modulePath
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
    const beforeCommitSha = process.env["GITHUB_SHA"]
    const githubEventName = 'thisWillNotBeHandled'
    const latestTagName = "1.2.3"
    // Mock the octokit client with all required API calls
    const mockOctokit = {
      rest: {
        git: {
          listMatchingRefs: async () => ({
            status: 200,
            data: [
              {
                ref: "refs/tags/" + latestTagName,
                object: {
                  sha: beforeCommitSha
                }
              }
            ]
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
              login: githubRepositoryOwner,
              name: githubRepositoryOwner
            }
          }
        }
      },
      getOctokit: () => mockOctokit
    }
    // Mock core module to avoid actual core.info/debug calls
    const coreMock = {
      startGroup: () => {},
      endGroup: () => {},
      debug: () => {},
      info: () => {},
      warning: () => {},
      setFailed: () => {}
    }
    // Use proxyquire to inject mocks
    const getVersionWithMocks = proxyquire(modulePath, {
      '@actions/github': githubMock,
      '@actions/core': coreMock
    })
    // execute the test
    const result = await getVersionWithMocks(apiToken)
    console.log("result:[" + result + "]")
    // Validate the test result
    expect(result.version).to.be.null
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
    const tagPrefix = process.env["INPUT_TAGPREFIX"]
    const inceptionVersion = process.env["INPUT_INCEPTIONVERSIONTAG"]
    // 
    const githubRepository = process.env["GITHUB_REPOSITORY"]
    const githubRepositoryOwner = process.env["GITHUB_REPOSITORY_OWNER"]
    const beforeCommitSha = process.env["GITHUB_SHA"]
    const githubEventName = 'somethingStrange'
    const latestTagName = "1.2.3"
    // Mock GitHub module
    const mockOctokit = {
      rest: {
        git: {
          listMatchingRefs: async () => ({
            status: 200,
            data: [
              {
                ref: "refs/tags/" + latestTagName,
                object: {
                  sha: beforeCommitSha
                }
              }
            ]
          })
        }
      }
    }
    const githubMock = {
      context: {
        eventName: githubEventName,
        payload: {
          repository: {
            name: githubRepository,
            owner: {
              login: githubRepositoryOwner,
              name: githubRepositoryOwner
            }
          }
        }
      },
      getOctokit: () => mockOctokit
    }
    // Mock core module to avoid actual core.info/debug calls
    const coreMock = {
      startGroup: () => {},
      endGroup: () => {},
      debug: () => {},
      info: () => {},
      warning: () => {},
      setFailed: () => {}
    }
    // Use proxyquire to inject mocks
    const getVersionWithMocks = proxyquire(modulePath, {
      '@actions/github': githubMock,
      '@actions/core': coreMock
    })
    // execute the test
    const result = await getVersionWithMocks(apiToken, tagPrefix, inceptionVersion)
    console.log("result:[" + result + "]")
    // Validate the test result
    expect(result.version).to.be.null
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
    const tagPrefix = process.env["INPUT_TAGPREFIX"]
    const inceptionVersion = process.env["INPUT_INCEPTIONVERSIONTAG"]
    //
    const githubRepository = process.env["GITHUB_REPOSITORY"]
    const githubRepositoryOwner = process.env["GITHUB_REPOSITORY_OWNER"]
    const githubCommitSha = process.env["GITHUB_SHA"]
    const githubPullRequestNumber = 314
    const githubRef = 'refs/pull/' + githubPullRequestNumber + '/head'
    const beforeCommitSha = "abc123def456"
    const githubEventName = 'pull_request'
    const latestTagName = "v1.2.3"
    const expectedVersion = "1.2.3"
    // Mock the octokit client with all required API calls
    const mockOctokit = {
      rest: {
        git: {
          listMatchingRefs: async () => ({
            status: 200,
            data: [
              {
                ref: "refs/tags/" + latestTagName,
                object: {
                  sha: beforeCommitSha
                }
              }
            ]
          })
        }
      }
    }
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
              login: githubRepositoryOwner,
              name: githubRepositoryOwner
            }
          }
        }
      },
      getOctokit: () => mockOctokit
    }
    // Mock core module to avoid actual core.info/debug calls
    const coreMock = {
      startGroup: () => {},
      endGroup: () => {},
      debug: () => {},
      info: () => {},
      warning: () => {},
      setFailed: () => {}
    }
    // Use proxyquire to inject mocks
    const getVersionWithMocks = proxyquire(modulePath, {
      '@actions/github': githubMock,
      '@actions/core': coreMock
    })
    // execute the test
    const result = await getVersionWithMocks(apiToken, tagPrefix, inceptionVersion)
    console.log("result:[" + result + "]")
    // Validate the test result
    expect(result.version).to.equal(expectedVersion)
    expect(semverValid(result.version)).to.not.be.null
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
    const tagPrefix = process.env["INPUT_TAGPREFIX"]
    const inceptionVersion = process.env["INPUT_INCEPTIONVERSIONTAG"]
    //
    const githubRepository = process.env["GITHUB_REPOSITORY"]
    const githubRepositoryOwner = process.env["GITHUB_REPOSITORY_OWNER"]
    const beforeCommitSha = process.env["GITHUB_SHA"]
    const githubEventName = 'workflow_dispatch'
    const latestTagName = "1.2.3"
    const expectedVersion = "1.2.3"
    // Mock the octokit client and responses
    const mockOctokit = {
      rest: {
        git: {
          listMatchingRefs: async () => ({
            status: 200,
            data: [
              {
                ref: "refs/tags/" + latestTagName,
                object: {
                  sha: beforeCommitSha
                }
              }
            ]
          })
        }
      }
    }
    // Mock GitHub module
    const githubMock = {
      context: {
        eventName: githubEventName,
        payload: {
          inputs: {
            version: expectedVersion
          },
          repository: {
            name: githubRepository,
            owner: {
              login: githubRepositoryOwner,
              name: githubRepositoryOwner
            }
          }
        }
      },
      getOctokit: () => mockOctokit
    }
    // Mock core module to avoid actual core.info/debug calls
    const coreMock = {
      startGroup: () => {},
      endGroup: () => {},
      debug: () => {},
      info: () => {},
      warning: () => {},
      setFailed: () => {}
    }
    // Use proxyquire to inject mocks
    const main = proxyquire(modulePath, {
      '@actions/github': githubMock,
      '@actions/core': coreMock
    })
    // execute the test
    const result = await main(apiToken, tagPrefix, inceptionVersion)
    console.log("result:[" + result + "]")
    // Validate the test result
    expect(result.version).to.equal(expectedVersion)
    expect(semverValid(result.version)).to.not.be.null
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
    const inceptionVersion = process.env["INPUT_INCEPTIONVERSIONTAG"]
    //
    const githubRepository = process.env["GITHUB_REPOSITORY"]
    const githubRepositoryOwner = process.env["GITHUB_REPOSITORY_OWNER"]
    const githubCommitSha = process.env["GITHUB_SHA"]
    const githubEventName = 'release'
    const releaseVersion = "1.2.3"
    // Mock the octokit client and responses
    const mockOctokit = {
      rest: {
        git: {
          listMatchingRefs: async () => ({
            status: 200,
            data: [
              {
                ref: "refs/tags/" + releaseVersion,
                object: {
                  sha: githubCommitSha
                }
              }
            ]
          }),
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
              login: githubRepositoryOwner,
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
      startGroup: () => {},
      endGroup: () => {},
      debug: () => {},
      info: () => {},
      warning: () => {},
      setFailed: () => {}
    }
    // Use proxyquire to inject mocks
    const getVersionWithMocks = proxyquire(modulePath, {
      '@actions/github': githubMock,
      '@actions/core': coreMock
    })
    // execute the test
    const result = await getVersionWithMocks(apiToken, tagPrefix, inceptionVersion)
    console.log("result:[" + result + "]")
    // Validate the test result
    expect(result.version).to.equal(releaseVersion)
    expect(semverValid(result.version)).to.not.be.null
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
              login: githubRepositoryOwner,
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
      startGroup: () => {},
      endGroup: () => {},
      debug: () => {},
      info: () => {},
      warning: () => {},
      setFailed: () => {}
    }
    
    // Use proxyquire to inject mocks
    const getVersionWithMocks = proxyquire(modulePath, {
      '@actions/github': githubMock,
      '@actions/core': coreMock
    })
    
    // execute the test
    const result = await getVersionWithMocks(apiToken, tagPrefix, inceptionVersion)
    console.log("result:[" + result + "]")
    
    // Validate the test result
    expect(result.version).to.equal(expectedVersion)
    expect(semverValid(result.version)).to.not.be.null
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
              login: githubRepositoryOwner,
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
      startGroup: () => {},
      endGroup: () => {},
      debug: () => {},
      info: () => {},
      warning: () => {},
      setFailed: () => {}
    }
    
    // Use proxyquire to inject mocks
    const getVersionWithMocks = proxyquire(modulePath, {
      '@actions/github': githubMock,
      '@actions/core': coreMock
    })
    
    // execute the test
    const result = await getVersionWithMocks(apiToken, tagPrefix, inceptionVersion)
    console.log("result:[" + result + "]")
    
    // Validate the test result
    expect(result.version).to.equal(inceptionVersion)
    expect(semverValid(result.version)).to.not.be.null
  })
})
// EOF
