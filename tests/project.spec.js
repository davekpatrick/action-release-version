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
// ---------------------------------------------------
// ---------------------------------------------------
describe("action.yml", function () {
  // ---------------------------------------------------
  const fs = require("node:fs")
  const jsYaml = require(path.resolve(dirNodeModules, "js-yaml"))
  let core = null
  let yamlFile = fs.readFileSync(path.join(__dirname, "../action.yml"), "utf8")
  let yamlData = jsYaml.load(yamlFile)
  // ---------------------------------------------------
  beforeEach("some description", function () {
    // Load the action core module
    core = require(dirNodeModules + path.sep + "@actions/core")
  });
  // ---------------------------------------------------
  afterEach("some description", function () {
    // clear the action core module from cache
    delete require.cache[require.resolve(dirNodeModules + path.sep + "@actions/core")]
  });
  // ---------------------------------------------------
  // ---------------------------------------------------

  it("Should be valid YAML", function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies the action.yml file is valid YAML
    // - It checks that the YAML data is an object
    // ---------------------------------------------------
    // fixture inputs

    // execute the test
    const result = jsYaml.load(yamlFile)
    console.log("result:[" + typeof result + "]")
    // Validate the test result
    expect(() => jsYaml.load(yamlFile)).to.not.throw()
    expect(result).to.be.an("object")
  });
  
  it("Name should start with GitHub Action", function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - 
    // ---------------------------------------------------
    // fixture inputs
    let name = yamlData.name;
    // execute the test

    // Validate the test result
    expect(name).to.be.a("string").and.match(new RegExp("^GitHub Action"), "i")
  });
  
  it("Author should be repository owner", function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - 
    // ---------------------------------------------------
    // fixture inputs
    let author = yamlData.author;
    // execute the test

    // Validate the test result
    expect(author).to.equal(process.env["GITHUB_REPOSITORY_OWNER"])
  });
});
// ---------------------------------------------------
// ---------------------------------------------------
describe("package.json", function () {
  let pkg = null
  const fs = require("node:fs")
  // ---------------------------------------------------
  beforeEach(() => {
    // Load the package.json file
    pkg = require(path.resolve(dirNode, "package.json"))
  });
  // ---------------------------------------------------
  afterEach(() => {
    // clear the package.json file from cache
    delete require.cache[require.resolve(path.resolve(dirNode, "package.json"))]
  });
  // ---------------------------------------------------
  // ---------------------------------------------------

  it("Should be valid JSON", function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies the package.json file is valid JSON
    // ---------------------------------------------------
    // fixture inputs
    let pkgFile = fs.readFileSync(path.resolve(dirNode, "package.json"), "utf8")
    //
    expect(() => JSON.parse(pkgFile)).to.not.throw()
    pkg = JSON.parse(pkgFile)
    // execute the test

    // Validate the test result
    expect(pkg).to.be.an("object")
  });

  it("Name should start with an asperand (@) character", function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - Validate the package name aligns with standards
    // ---------------------------------------------------
    // fixture inputs

    // execute the test

    // Validate the test result
    expect(pkg.name).to.be.a("string")
    expect(pkg.name).to.match(new RegExp('^@'))
  });

  it("Name should be equal to the gitHub owner and repository names", function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies the package name aligns with GitHub's naming conventions
    // ---------------------------------------------------
    // fixture inputs

    // execute the test

    // Validate the test result
    expect(pkg.name).to.be.a("string")
    expect(pkg.name).to.equal( "@" + process.env["GITHUB_REPOSITORY_OWNER"] + "/" + process.env["GITHUB_REPOSITORY"])
  });
  
  it("Description should start with GitHub Action", function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies the package description aligns with GitHub's naming conventions
    // - 
    // ---------------------------------------------------
    // fixture inputs

    // execute the test

    // Validate the test result
    expect(pkg.description).to.be.a("string")
    expect(pkg.description).to.match(new RegExp("^GitHub Action "), "i")
  });
  
  it("Author should be repository owner", function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies the package author aligns with GitHub's naming conventions
    // ---------------------------------------------------
    // fixture inputs

    // execute the test

    // Validate the test result
    expect(pkg.author).to.be.a("string")
    expect(pkg.author).to.equal(process.env["GITHUB_REPOSITORY_OWNER"])
  });
});
// ---------------------------------------------------
// ---------------------------------------------------
describe("github @action modules", function(){
  // ---------------------------------------------------
  let core
  let github
  //let originalContext
  // ---------------------------------------------------
  beforeEach(() => {
    //
    //originalContext = Object.assign({}, github.context)

    core = require(dirNodeModules + path.sep + "@actions/core")
    github = require(dirNodeModules + path.sep + "@actions/github")
  });
  // ---------------------------------------------------
  afterEach(() => {
    //Object.assign(github.context, originalContext)
    // clear the package.json file from cache
    delete require.cache[require.resolve(dirNodeModules + path.sep + "@actions/core")]
    delete require.cache[require.resolve(dirNodeModules + path.sep + "@actions/github")]
  });
  // ---------------------------------------------------
  // ---------------------------------------------------

  it("Core module should be available", function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - validate the github action core module is available
    // ---------------------------------------------------
    // fixture inputs

    // execute the test

    // Validate the test result
    expect(core).to.be.an("object")
    expect(core.getInput).to.be.a("function")
    expect(core.setOutput).to.be.a("function")
  });
  
  it("GitHub module should be available", function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - validate the github action core module is available
    // ---------------------------------------------------
    // fixture inputs

    // execute the test

    // Validate the test result
    expect(github).to.be.an("object")
    expect(github.context).to.be.an("object")
    expect(github.getOctokit).to.be.a("function")
  });
  
  it("GitHub module should have context.payload", function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - this test verifies the github action github module context.payload is available
    // ---------------------------------------------------
    // fixture inputs

    // execute the test

    // Validate the test result
    expect(github.context).to.have.property("payload")
    expect(github.context.payload).to.be.an("object")
  });

  it("GitHub module should have context.eventName", function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - validate the github action github module context.eventName is available
    // ---------------------------------------------------
    // fixture inputs

    // execute the test
    
    // Validate the test result
    expect(github.context).to.have.property("eventName")
  });
});
// EOF
