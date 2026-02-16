// BOF
const os  = require ("node:os")
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
  const crypto = require("node:crypto")
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
    const cfgTrace = true
    let moduleName = "@actions/core"
    let modulePath = dirNodeModules + path.sep + moduleName
    it("Action core setOutput", async function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // - This test verifies the action core module is able to set outputs
      // ---------------------------------------------------
      // fixture inputs
      var regex = new RegExp(/^(?<key>.*)<<(?:ghadelimiter_.*)[\n\r]+(?<value>[\S\s]*)(?:ghadelimiter_.*)$/)
      let UUID = crypto.randomUUID()  // create a randomly generated, 36 character long v4 UUID
      //
      let key = "time"
      let value = new Date().toTimeString()
      let expectedOutputType = process.env.GITHUB_ENV !== undefined ? true : false
      let expected = {
        /*
        "\n::set-output name=time::21:51:19 GMT+0000 (Coordinated Universal Time)\n"
        */
        false: "::set-output name=" + key + "::" + value + os.EOL,
        /*
        time<<ghadelimiter_ed3c902b-5871-464f-81a5-eb6de62ff66c
        01:35:24 GMT+0000 (Coordinated Universal Time)
        ghadelimiter_ed3c902b-5871-464f-81a5-eb6de62ff66c
        */
        true: `${key}<<ghadelimiter_${UUID}
               ${value}
               ghadelimiter_${UUID}
               `.split("\n")
               .map(s => s.trim())
               .join("\n")
      }
      let processStdOut = '' // used to capture stdout 
      // Mock 
      const fileCommandMock = {
        issueFileCommand: (command, message) =>  {
          // DOC: https://github.com/actions/toolkit/blob/8351a5d84d862813d1bb8bdeef87b215f8a946f9/packages/core/src/file-command.ts#L11
          let tmp = message.match(regex)
          // prepareKeyValueMessage mock
          // DOC: https://github.com/actions/toolkit/blob/8351a5d84d862813d1bb8bdeef87b215f8a946f9/packages/core/src/file-command.ts#L27
          let tmpl = `${tmp.groups.key}<<ghadelimiter_${UUID}
                      ${tmp.groups.value.trimEnd()}
                      ghadelimiter_${UUID}
                     `.split("\n")
                      .map(s => s.trim())
                      .join("\n")
          process.stdout.write(tmpl)
        },
      }
      // Use proxyquire to inject mocks
      const main = proxyquire(modulePath, {
        "./file-command": fileCommandMock,
        "node:process": processMock,     
      })
      // execute the test
      const originalStdoutWrite = process.stdout.write.bind(process.stdout)
      process.stdout.write = (chunk, encoding, callback) => {
        // 
        processStdOut += chunk;
        // Call the original write method to ensure normal console output still works if desired
        // or simply return the chunk if you want to suppress console output during capture
        //return originalStdoutWrite(chunk, encoding, callback);
        return true
      }
      await main.setOutput(key, value)
      const result = processStdOut
      process.stdout.write = originalStdoutWrite;
      // 
      if (argTrace) {
        console.log("result:[" + JSON.stringify(result) + "]")
      }
      // Validate the test result
      expect(result).to.be.a("string")
      expect(result).to.equal(expected[expectedOutputType])
    })

    it("Action core exportVariable", async function (argTrace = cfgTrace) {
      // ---------------------------------------------------
      // Details
      // ------------
      // - This test verifies the action core module is able to set environment variables
      // ---------------------------------------------------
      // fixture inputs
      var regex = new RegExp(/^(?<key>.*)<<(?:ghadelimiter_.*)[\n\r]+(?<value>[\S\s]*)(?:ghadelimiter_.*)$/)
      let UUID = crypto.randomUUID()  // create a randomly generated, 36 character long v4 UUID
      //
      let key = "TEST"
      let value = new Date().toTimeString()
      let expectedOutputType = process.env.GITHUB_ENV !== undefined ? true : false
      let expected = {
        /*
        "\n::set-env name=time::21:51:19 GMT+0000 (Coordinated Universal Time)\n"
        */
        false: "::set-env name=" + key + "::" + value + os.EOL,
        /*
        time<<ghadelimiter_ed3c902b-5871-464f-81a5-eb6de62ff66c
        01:35:24 GMT+0000 (Coordinated Universal Time)
        ghadelimiter_ed3c902b-5871-464f-81a5-eb6de62ff66c
        */
        true: `${key}<<ghadelimiter_${UUID}
               ${value}
               ghadelimiter_${UUID}
               `.split("\n")
               .map(s => s.trim())
               .join("\n")
      }
      let processStdOut = '' // used to capture stdout
      // Mock 
      const fileCommandMock = {
        issueFileCommand: (command, message) =>  {
          // DOC: https://github.com/actions/toolkit/blob/8351a5d84d862813d1bb8bdeef87b215f8a946f9/packages/core/src/file-command.ts#L11
          let tmp = message.match(regex)
          // prepareKeyValueMessage mock
          // DOC: https://github.com/actions/toolkit/blob/8351a5d84d862813d1bb8bdeef87b215f8a946f9/packages/core/src/file-command.ts#L27
          let tmpl = `${tmp.groups.key}<<ghadelimiter_${UUID}
                      ${tmp.groups.value.trimEnd()}
                      ghadelimiter_${UUID}
                     `.split("\n")
                      .map(s => s.trim())
                      .join("\n")
          process.stdout.write(tmpl)
        },
      }
      // Use proxyquire to inject mocks
      const main = proxyquire(modulePath, {
        "./file-command": fileCommandMock,
        "node:process": processMock,     
      })
      // execute the test
      const originalStdoutWrite = process.stdout.write.bind(process.stdout)
      process.stdout.write = (chunk, encoding, callback) => {
        // 
        processStdOut += chunk;
        // Call the original write method to ensure normal console output still works if desired
        // or simply return the chunk if you want to suppress console output during capture
        //return originalStdoutWrite(chunk, encoding, callback);
        return true
      } 
      // execute the test
      await main.exportVariable(key, value)
      const result = processStdOut
      process.stdout.write = originalStdoutWrite
      //
      if (argTrace) {
        console.log("result:[" + JSON.stringify(result) + "]")
      }
      // Validate the test result
      expect(result).to.be.a("string")
      expect(result).to.equal(expected[expectedOutputType])
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
