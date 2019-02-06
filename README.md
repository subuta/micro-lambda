# micro-lambda
Run [zeit/micro](https://github.com/zeit/micro) based app on top of AWS Lambda and Amazon API Gateway

Most of codes(and tests) are borrowed from [aws-serverless-express](https://github.com/awslabs/aws-serverless-express) for better compatibility with official package :) 

## Getting started

Save micro-lambda as a project dependency. 

```bash
$ npm i micro-lambda -S
```

Then you can create your lambda with micro!

SEE: [example](example/index.js)

```jsx harmony
const { serve, proxy, withEventContext } = require('micro-lambda')
const micro = require('micro')

// Handle HTTP Request with micro.
const server = serve(micro(withEventContext(async (req, res) => {
  if (req.method === 'POST') {
    return micro.json(req)
  }
  return { hoge: 'fuga' }
})))

exports.handler = (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false
  proxy(server, event, context, cb)
}
```

## How to develop

### Local run lambda (by docker-lambda)

```bash
# Simulate GET request
$ cat ./src/__tests__/events/api-gw.json | docker run --rm -v "$PWD":/var/task -i -e DOCKER_LAMBDA_USE_STDIN=1 lambci/lambda:nodejs8.10 example/index.handler

# Simulate POST request
$ cat ./src/__tests__/events/api-gw-post.json | docker run --rm -v "$PWD":/var/task -i -e DOCKER_LAMBDA_USE_STDIN=1 lambci/lambda:nodejs8.10 example/index.handler
```

## Credits

Thanks to original authors of [aws-serverless-express](https://github.com/awslabs/aws-serverless-express) package. 

## LICENSE

Apache License 2.0 (Following original package's license) 

SEE: [LICENSE](LICENSE)
