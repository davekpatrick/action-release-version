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

  it("Action core setOutput", function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies the action core module is able to set outputs 
    // ---------------------------------------------------
    // fixture inputs
    let time = new Date().toTimeString()
    // execute the test
    let result = core.setOutput("time", time)

    // Validate the test result
    //expect(core.setOutput("time")).to.be.a("string")
  });
  
  it("Action core exportVariable", function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - This test verifies the action core module is able to set environment variables
    // ---------------------------------------------------
    // fixture inputs
    let time = new Date().toTimeString()
    // execute the test
    core.exportVariable("time", time)

    // Validate the test result
  });
  
  it("Input tagPrefix", function () {
    // ---------------------------------------------------
    // Details
    // ------------
    // - 
    // ---------------------------------------------------
    // fixture inputs
    let inputData = core.getInput("tagPrefix")
    // execute the test
    
    // Validate the test result
    expect(inputData).to.be.a("string")
    expect(inputData).to.equal("v")
  });

  it("@actions/core module should be available", function () {
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

  it("@actions/github module should be available", function () {
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
