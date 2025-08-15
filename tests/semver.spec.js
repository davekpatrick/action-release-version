// BOF
const fs = require("node:fs")
const path = require("node:path")
const { describe } = require("node:test")
const nodeDir = path.resolve(__dirname, "../node")
const nodeModulesDir = path.resolve(nodeDir, "node_modules")

const expect = require(nodeModulesDir + path.sep + "chai").expect
const semver = require(nodeModulesDir + path.sep + "semver")

describe("semver functionality tests", function () {
  
  it("Should increment minor version correctly", function () {
    const currentVersion = "1.2.3"
    const nextVersion = semver.inc(currentVersion, 'minor')
    
    expect(nextVersion).to.equal("1.3.0")
  })

  it("Should increment from inception version", function () {
    const inceptionVersion = "0.0.0"
    const nextVersion = semver.inc(inceptionVersion, 'minor')
    
    expect(nextVersion).to.equal("0.1.0")
  })

  it("Should clean valid semver versions", function () {
    const validVersions = ["1.2.3", "v1.2.3", "1.0.0-alpha.1", "2.0.0-beta"]
    
    validVersions.forEach(version => {
      const cleaned = semver.clean(version)
      expect(cleaned).to.not.be.null
      expect(semver.valid(cleaned)).to.not.be.null
    })
  })

  it("Should reject invalid semver versions", function () {
    const invalidVersions = ["invalid", "1.2", "a.b.c", "1.2.3.4.5"]
    
    invalidVersions.forEach(version => {
      const cleaned = semver.clean(version)
      expect(cleaned).to.be.null
    })
  })

  it("Should handle various increment types", function () {
    const baseVersion = "1.2.3"
    
    expect(semver.inc(baseVersion, 'patch')).to.equal("1.2.4")
    expect(semver.inc(baseVersion, 'minor')).to.equal("1.3.0")
    expect(semver.inc(baseVersion, 'major')).to.equal("2.0.0")
  })
})
// EOF