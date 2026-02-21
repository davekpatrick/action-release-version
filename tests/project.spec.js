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
// ---------------------------------------------------
// ---------------------------------------------------
describe("action.yml", function () {
  // ---------------------------------------------------
  const fs = require("node:fs")
  const jsYaml = require(path.resolve(dirNodeModules, "js-yaml"))
  let yamlFile = fs.readFileSync(path.join(__dirname, "../action.yml"), "utf8")
  let yamlData = jsYaml.load(yamlFile)
  // ---------------------------------------------------
  beforeEach("some description", function () {
    // Load the action core module
    core = require(dirNodeModules + path.sep + "@actions/core")
  })
  // ---------------------------------------------------
  afterEach("some description", function () {
    // clear the action core module from cache
    delete require.cache[
      require.resolve(dirNodeModules + path.sep + "@actions/core")
    ]
  })
  // ---------------------------------------------------
  // ---------------------------------------------------
  context("github: action configuration", function () {
    const cfgTrace = false
    it("Should be valid YAML", function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // - This test verifies the action.yml file is valid YAML
      // - It checks that the YAML data is an object
      // ---------------------------------------------------
      // fixture inputs
      //
      // execute the test
      const result = jsYaml.load(yamlFile)
      if (argTrace == true) {
        console.log("result:[" + typeof result + "]")
      }
      // Validate the test result
      expect(() => jsYaml.load(yamlFile)).to.not.throw()
      expect(result).to.be.an("object")
    })

    it("Name should start with GitHub Action", function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // -
      // ---------------------------------------------------
      // fixture inputs
      //
      // execute the test
      let result = yamlData.name
      if (argTrace == true) {
        console.log("result:[" + result + "]")
      }
      // Validate the test result
      expect(result)
        .to.be.a("string")
        .and.match(new RegExp("^GitHub Action"), "i")
    })

    it("Author should be repository owner", function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // -
      // ---------------------------------------------------
      // fixture inputs
      //
      // execute the test
      let result = yamlData.author
      if (argTrace == true) {
        console.log("result:[" + result + "]")
      }
      // Validate the test result
      expect(result).to.equal(process.env["GITHUB_REPOSITORY_OWNER"])
    })
  })
})
// ---------------------------------------------------
// ---------------------------------------------------
describe("package.json", function () {
  let pkg = null
  const fs = require("node:fs")
  // ---------------------------------------------------
  beforeEach(() => {
    // Load the package.json file
    pkg = require(path.resolve(dirNode, "package.json"))
  })
  // ---------------------------------------------------
  afterEach(() => {
    // clear the package.json file from cache
    delete require.cache[require.resolve(path.resolve(dirNode, "package.json"))]
  })
  // ---------------------------------------------------
  // ---------------------------------------------------
  context("nodejs: package.json configuration", function () {
    const cfgTrace = false
    it("Should be valid JSON", function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // - This test verifies the package.json file is valid JSON
      // ---------------------------------------------------
      // fixture inputs
      let pkgFile = fs.readFileSync(
        path.resolve(dirNode, "package.json"),
        "utf8",
      )
      // execute the test
      let result = JSON.parse(pkgFile)
      if (argTrace == true) {
        console.log("result:[" + typeof result + "]")
      }
      // Validate the test result
      expect(result).to.be.an("object")
      expect(() => JSON.parse(pkgFile)).to.not.throw()
    })

    it("Name should start with an asperand (@) character", function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // - Validate the package name aligns with standards
      // ---------------------------------------------------
      // fixture inputs
      //
      // execute the test
      let result = pkg.name
      if (argTrace == true) {
        console.log("result:[" + result + "]")
      }
      // Validate the test result
      expect(result).to.be.a("string")
      expect(result).to.match(new RegExp("^@"))
    })

    it("Name should be equal to the gitHub owner and repository names", function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // - This test verifies the package name aligns with GitHub's naming conventions
      // ---------------------------------------------------
      // fixture inputs
      let gitHubRepository = process.env["GITHUB_REPOSITORY"].replace(
        /.*\//,
        "",
      ) // remove the owner name and the slash
      let gitHubRepositoryOwner = process.env["GITHUB_REPOSITORY_OWNER"]
      let expectedName = "@" + gitHubRepositoryOwner + "/" + gitHubRepository
      // execute the test
      let result = pkg.name
      if (argTrace == true) {
        console.log("result:[" + result + "]")
      }
      // Validate the test result
      expect(result).to.be.a("string")
      expect(result).to.equal(expectedName)
    })

    it("Description should start with GitHub Action", function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // - This test verifies the package description aligns with GitHub's naming conventions
      // -
      // ---------------------------------------------------
      // fixture inputs
      //
      // execute the test
      let result = pkg.description
      if (argTrace == true) {
        console.log("result:[" + result + "]")
      }
      // Validate the test result
      expect(result).to.be.a("string")
      expect(result).to.match(new RegExp("^GitHub Action "), "i")
    })

    it("Author should be repository owner", function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // - This test verifies the package author aligns with GitHub's naming conventions
      // ---------------------------------------------------
      // fixture inputs
      let gitHubRepositoryOwner = process.env["GITHUB_REPOSITORY_OWNER"]
      // execute the test
      let result = pkg.author
      if (argTrace == true) {
        console.log("result:[" + result + "]")
      }
      // Validate the test result
      expect(result).to.be.a("string")
      expect(result).to.equal(gitHubRepositoryOwner)
    })
  })
})
// EOF
