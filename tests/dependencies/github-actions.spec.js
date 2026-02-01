// BOF
const path = require("node:path")
// project directories
const dirRoot = path.normalize(path.resolve(__dirname, "..", ".."))
const dirNode = path.resolve(dirRoot, "node")
const dirNodeModules = path.resolve(dirNode, "node_modules")
// test required modules
const { describe } = require("node:test")
// doc: https://www.chaijs.com/guide/styles/  ( BDD 'expect' assertion is being used vs the 'should' assertion style )
//      https://www.chaijs.com/api/bdd/
const expect = require(dirNodeModules + path.sep + "chai").expect
const proxyquire = require(dirNodeModules + path.sep + "proxyquire")
// ---------------------------------------------------
// ---------------------------------------------------
describe("module: github @action", async function () {
  // ---------------------------------------------------
  let core
  let github
  // ---------------------------------------------------
  // Mocks
  const exitStub = (code) => {
    // Mock process.exit to prevent actual exit during tests
    throw new Error("Exiting with code[" + code + "]")
  }
  const processMock = {
    //
    exit: exitStub,
  }
  // ---------------------------------------------------
  beforeEach(() => {
    //
    core = require(dirNodeModules + path.sep + "@actions/core")
    github = require(dirNodeModules + path.sep + "@actions/github")
  })
  // ---------------------------------------------------
  afterEach(() => {
    // clear the package.json file from cache
    delete require.cache[
      require.resolve(dirNodeModules + path.sep + "@actions/core")
    ]
    delete require.cache[
      require.resolve(dirNodeModules + path.sep + "@actions/github")
    ]
  })
  // ---------------------------------------------------
  // ---------------------------------------------------
  context("Action core functionality tests", function () {
    const cfgTrace = false
    let moduleName = "@actions/core"
    let modulePath = dirNodeModules + path.sep + moduleName
    it("Action core setOutput", async function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // - This test verifies the action core module is able to set outputs
      // ---------------------------------------------------
      // fixture inputs
      var result = ''
      let time = new Date().toTimeString()
      // e.g. "\n::set-output name=time::21:51:19 GMT+0000 (Coordinated Universal Time)\n"
      let expected = "\n::set-output name=time::" + time + "\n"
      // execute the test
      ///core.setOutput("time", time)
      const originalStdoutWrite = process.stdout.write.bind(process.stdout);

      // Mock core module to avoid actual core.info/debug calls
 
      const coreMock = {
        startGroup: () => {},
        endGroup: () => {},
        debug: () => {},
        info: () => {},
        warning: () => {},
        setOutput: () => {},
      }
      
      // Use proxyquire to inject mocks
      const main = proxyquire(modulePath, {
        debug: () => {},
        info: () => {},
        warning: () => {},
      })
      // execute the test
/*
      await main({
        apiToken: apiToken
      })
        */
      process.stdout.write = (chunk, encoding, callback) => {
        // Only capture if it's a string (which console.log and most writes are)

        result += chunk;
        // Call the original write method to ensure normal console output still works if desired
        // or simply return the chunk if you want to suppress console output during capture
        return originalStdoutWrite(chunk, encoding, callback);
        //return true
        };
      //
      await main.setOutput("time", time)
      // 3. Restore the original method
      process.stdout.write = originalStdoutWrite;
      if (argTrace) {
        console.log("result:[" + JSON.stringify(result) + "]")
      }
      // Validate the test result
      expect(result).to.be.a("string")
      expect(result).to.equal(expected)
    })

    it("Action core exportVariable", function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // - This test verifies the action core module is able to set environment variables
      // ---------------------------------------------------
      // fixture inputs
      let time = new Date().toTimeString()
      var stdOut = ""
      let result
      let originalWrite = process.stdout.write
      let expected = "::set-env name=time::" + time + "\n"
      process.stdout.write = (data) => {
        stdOut += data
        return true // Writable stream write function must return a boolean
      }
      // execute the test
      core.exportVariable("time", time)
      result = stdOut
      process.stdout.write = originalWrite
      if (argTrace) {
        console.log("result:[" + JSON.stringify(result) + "]")
      }
      // Validate the test result
      expect(result).to.be.a("string")
      expect(result).to.equal(expected)
    })

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
    })
  })
  // ---------------------------------------------------
  // ---------------------------------------------------
  context("Action github functionality tests", function () {
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
    })

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
    })

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
    })
  })
})
// EOF
