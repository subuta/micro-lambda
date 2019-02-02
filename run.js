var dockerLambda = require('docker-lambda')

// Spawns synchronously, uses current dir – will throw if it fails
var lambdaCallbackResult = dockerLambda({
  dockerImage: 'lambci/lambda:nodejs8.10',
  handler: 'index.handler',
  event: { some: 'event' }
})

console.log('lambdaCallbackResult = ', lambdaCallbackResult)
