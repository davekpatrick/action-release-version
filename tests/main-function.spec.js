// BOF
const fs = require("node:fs")
const path = require("node:path")
const { describe } = require("node:test")
const nodeDir = path.resolve(__dirname, "../node")
const nodeModulesDir = path.resolve(nodeDir, "node_modules")

const expect = require(nodeModulesDir + path.sep + "chai").expect
const proxyquire = require(nodeModulesDir + path.sep + "proxyquire")

describe("index.js unit tests", function () {
  
  it("Should return a function", function () {
    const releaseVersion = require(nodeDir + path.sep + "lib/index")
    expect(releaseVersion).to.be.a("function")
  })

  it("Should increment minor version when no current version exists", async function () {
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
    
    const releaseVersion = proxyquire(nodeDir + path.sep + "lib/index", {
      './get-version': getVersionStub,
      '@actions/core': coreStub
    })
    
    const result = await releaseVersion()
    
    expect(result).to.equal('0.1.0') // inception version incremented
  })

  it("Should increment minor version of current version", async function () {
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
    
    const releaseVersion = proxyquire(nodeDir + path.sep + "lib/index", {
      './get-version': getVersionStub,
      '@actions/core': coreStub
    })
    
    const result = await releaseVersion()
    
    expect(result).to.equal('1.3.0') // current version incremented
  })

  it("Should use provided version input directly", async function () {
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
    
    const releaseVersion = proxyquire(nodeDir + path.sep + "lib/index", {
      '@actions/core': coreStub
    })
    
    const result = await releaseVersion()
    
    expect(result).to.equal('2.4.0') // incremented version
  })

  it("Should use environment GITHUB_TOKEN when no API token provided", async function () {
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
    
    const releaseVersion = proxyquire(nodeDir + path.sep + "lib/index", {
      './get-version': getVersionStub,
      '@actions/core': coreStub
    })
    
    const result = await releaseVersion()
    
    expect(result).to.equal('1.1.0') // incremented version
    
    delete process.env.GITHUB_TOKEN
  })
})
// EOF