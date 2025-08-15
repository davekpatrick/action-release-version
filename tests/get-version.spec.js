// BOF
const fs = require("node:fs")
const path = require("node:path")
const { describe } = require("node:test")
const nodeDir = path.resolve(__dirname, "../node")
const nodeModulesDir = path.resolve(nodeDir, "node_modules")

const expect = require(nodeModulesDir + path.sep + "chai").expect

// Modules under test
const getVersion = require(nodeDir + path.sep + "lib/get-version")
const github = require(nodeModulesDir + path.sep + "@actions/github")

describe("get-version.js unit tests", function () {
  let originalContext
  
  beforeEach(() => {
    // Store original context
    originalContext = Object.assign({}, github.context)
  })

  afterEach(() => {
    // Restore context
    Object.assign(github.context, originalContext)
  })

  it("Should handle unknown event types", async function () {
    const apiToken = "fake-token"
    const tagPrefix = "v"
    const inceptionVersion = "0.0.0"
    
    // Mock GitHub context for unknown event
    github.context.eventName = "unknown"
    github.context.payload = {
      repository: {
        name: "action-release-version",
        owner: {
          name: "davekpatrick"
        }
      }
    }
    
    const result = await getVersion(apiToken, tagPrefix, inceptionVersion)
    
    expect(result).to.be.null
  })

  it("Should handle pull_request event", async function () {
    const apiToken = "fake-token"
    const tagPrefix = "v"
    const inceptionVersion = "0.0.0"
    
    // Mock GitHub context for pull_request event
    github.context.eventName = "pull_request"
    github.context.ref = "refs/pull/123/head"
    github.context.sha = "fake-commit-sha"
    github.context.payload = {
      repository: {
        name: "action-release-version",
        owner: {
          name: "davekpatrick"
        }
      }
    }
    
    const result = await getVersion(apiToken, tagPrefix, inceptionVersion)
    
    expect(result).to.be.null
  })

  it("Should handle workflow_dispatch event", async function () {
    const apiToken = "fake-token"
    const tagPrefix = "v"
    const inceptionVersion = "0.0.0"
    
    // Mock GitHub context for workflow_dispatch event
    github.context.eventName = "workflow_dispatch"
    github.context.payload = {
      repository: {
        name: "action-release-version",
        owner: {
          name: "davekpatrick"
        }
      }
    }
    
    const result = await getVersion(apiToken, tagPrefix, inceptionVersion)
    
    expect(result).to.be.null
  })

  it("Should accept default parameters", async function () {
    const apiToken = "fake-token"
    
    // Mock GitHub context for unknown event (simplest case)
    github.context.eventName = "unknown"
    github.context.payload = {
      repository: {
        name: "action-release-version",
        owner: {
          name: "davekpatrick"
        }
      }
    }
    
    // Call with only required parameter
    const result = await getVersion(apiToken)
    
    expect(result).to.be.null
  })
})
// EOF