// BOF
const path = require("node:path");
// project directories
const dirRoot = path.normalize(path.resolve(__dirname, "..", ".."));
const dirNode = path.resolve(dirRoot, "node");
const dirNodeModules = path.resolve(dirNode, "node_modules");
// test required modules
const { describe } = require("node:test")
// doc: https://www.chaijs.com/guide/styles/  ( BDD 'expect' assertion is being used vs the 'should' assertion style )
//      https://www.chaijs.com/api/bdd/
const expect = require(dirNodeModules + path.sep + "chai").expect
// ---------------------------------------------------
// ---------------------------------------------------
describe("semver functionality tests", function () {
  // ---------------------------------------------------
  const semver = require(dirNodeModules + path.sep + "semver")
  // ---------------------------------------------------
  // ---------------------------------------------------
  it("Should increment minor version correctly", function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies the semver module can increment the minor version
    // ---------------------------------------------------
    // fixture inputs
    const currentVersion = "1.2.3"
    const nextVersion = semver.inc(currentVersion, 'minor')
    // execute the test

    // Validate the test result
    expect(nextVersion).to.equal("1.3.0")
  })

  it("Should increment from inception version", function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies the semver module can increment from the inception version
    // ---------------------------------------------------
    // fixture inputs
    const inceptionVersion = "0.0.0"
    const nextVersion = semver.inc(inceptionVersion, 'minor')
    // execute the test

    // Validate the test result
    expect(nextVersion).to.equal("0.1.0")
  })

  it("Should clean valid semver versions", function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies the semver module can clean valid semver versions
    // ---------------------------------------------------
    // fixture inputs
    const validVersions = ["1.2.3", "v1.2.3", "1.0.0-alpha.1", "2.0.0-beta"]
    // execute the test

    // Validate the test result 
    validVersions.forEach(version => {
      const cleaned = semver.clean(version)
      expect(cleaned).to.not.be.null
      expect(semver.valid(cleaned)).to.not.be.null
    })
  })

  it("Should reject invalid semver versions", function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies the semver module can reject invalid semver versions
    // ---------------------------------------------------
    // fixture inputs
    const invalidVersions = ["invalid", "1.2", "a.b.c", "1.2.3.4.5"]
    // execute the test

    // Validate the test result
    invalidVersions.forEach(version => {
      const cleaned = semver.clean(version)
      expect(cleaned).to.be.null
    })
  })

  it("Should handle various increment types", function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies the semver module can handle various increment types
    // ---------------------------------------------------
    // fixture inputs
    const baseVersion = "1.2.3"
    // execute the test

    // Validate the test result
    expect(semver.inc(baseVersion, 'patch')).to.equal("1.2.4")
    expect(semver.inc(baseVersion, 'minor')).to.equal("1.3.0")
    expect(semver.inc(baseVersion, 'major')).to.equal("2.0.0")
  })
})
// EOF
