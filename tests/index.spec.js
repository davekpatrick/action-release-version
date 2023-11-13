// BOF
const fs = require("node:fs")
const path = require("node:path")
const { describe } = require("node:test")
//const nodeDir = path.parse(process.env.npm_package_json).dir
const nodeDir = path.resolve(__dirname, "../node")
const nodeModulesDir = path.resolve(nodeDir, "node_modules")
//process.env["PATH"] = nodeModulesDir + path.delimiter + process.env.PATH
//console.log(process.env.PATH)
// doc: https://www.chaijs.com/guide/styles/  ( BDD 'expect' assertion is being used vs the 'should' assertion style )
//      https://www.chaijs.com/api/bdd/
const expect = require(nodeModulesDir + path.sep + "chai").expect
const sinon = require(nodeModulesDir + path.sep + "sinon")
const jsYaml = require(nodeModulesDir + path.sep + "js-yaml")
const nock = require(nodeModulesDir + path.sep + "nock")
//
describe("package.json", function () {
  let pkg = require(nodeDir + path.sep + "package.json")
  console.log(pkg.name)
  //
  it("Name should start with an asperand (@) character", function () {
    expect(pkg.name).to.be.a("string")
    //expect(pkg.name).to.match(new RegExp('^@'))
  });
  it("Name should be equal to the gitHub owner and repository names", function () {
    expect(pkg.name).to.be.a("string")
    expect(pkg.name).to.equal("@" + process.env["GITHUB_REPOSITORY"])
  });
  //
  it("Description should start with GitHub Action", function () {
    expect(pkg.description).to.be.a("string")
    expect(pkg.description).to.match(new RegExp("^GitHub Action"), "i")
  });
  //
  it("Author should be repository owner", function () {
    expect(pkg.author).to.equal(process.env["GITHUB_REPOSITORY_OWNER"])
  });
});
//
describe("action.yml", function () {
  let core = require(nodeModulesDir + path.sep + "@actions/core")

  let yamlFile = fs.readFileSync(path.join(__dirname, "../action.yml"), "utf8")
  let yamlData = jsYaml.load(yamlFile)
  it("Action core setOutput", function () {
    core.setOutput("time", new Date().toTimeString())
  });
  it("Action core setOutput", function () {
    core.exportVariable("time", new Date().toTimeString())
  });
  //
  it("Input tagPrefix", function () {
    let inputData = core.getInput("tagPrefix")
    expect(inputData).to.be.a("string")
    expect(inputData).to.equal("v")
  });
  //
  it("Name should start with GitHub Action", function () {
    let name = yamlData.name;
    //
    expect(name).to.be.a("string").and.match(new RegExp("^GitHub Action"), "i")
  });
  //
  it("Author should be repository owner", function () {
    let author = yamlData.author;
    //
    expect(author).to.equal(process.env["GITHUB_REPOSITORY_OWNER"])
  });
});
//
describe("index.js", function () {
  //const sinon = require(nodeModulesDir + path.sep + "sinon")

  beforeEach(() => {
    nock.cleanAll()
    //
    requiredFile = path.resolve(nodeDir, "lib/index")
    githubApiUrl = process.env["GITHUB_API_URL"];
    githubRepository = process.env["GITHUB_REPOSITORY"];
    //
    //sinon.spy(console, 'log');
  });

  afterEach(() => {
    //sinon.restore();
  });

  it("Should be a function", async function () {
    const main = require(requiredFile);
    expect(main).to.be.a("function")
  });

  it("Run with default inputs", async function () {
    const main = require(requiredFile)
    let githubSha = process.env["GITHUB_SHA"]
    let tagPrefix = process.env["INPUT_TAGPREFIX"]
    let version = "0.1.0"
    let tag = tagPrefix + version
    //
    nock(new URL(githubApiUrl))
      .get("/repos/" + githubRepository + "/git/ref/tags%2F" + tag)
      .reply(200, {
        ref: "refs/tags/" + tag,
        object: { sha: githubSha },
      });
    //
    let returnData = await main();
    expect( nock.isDone() ).to.be.true;
    expect( returnData ).to.be.a("string");
    expect( returnData ).to.equal(version);
  });

  /*
  .patch('/repos/' + githubRepository + '/git/refs/tags%2Fv1')
  .reply(200)
  .patch('/repos/' + githubRepository + '/git/refs/tags%2Fv1.0')
  .reply(200)
  .get('/repos/' + githubRepository + '/git/matching-refs/tags%2Fv1')
  .reply(200, [{ ref: 'tags/v1' }])
  .get('/repos/' + githubRepository + '/git/matching-refs/tags%2Fv1.0')
  .reply(200, [{ ref: 'tags/v1.0' }])
  .post('/repos/' + githubRepository + '/git/commits')
  .reply(200, { commit: { sha: githubSha } })
  .post('/repos/' + githubRepository + '/git/trees')
  .reply(200)
  */

});
// EOF
