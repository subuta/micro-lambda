# play-with-lambda-micro
Run [zeit/micro](https://github.com/zeit/micro) based app on top of AWS Lambda and Amazon API Gateway using [aws-serverless-express](https://github.com/awslabs/aws-serverless-express) 

## Getting started

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

## How to run

### Local run lambda (by docker-lambda)

```bash
# Simulate GET request
$ cat ./example/__tests__/events/api-gw.json | docker run --rm -v "$PWD":/var/task -i -e DOCKER_LAMBDA_USE_STDIN=1 lambci/lambda:nodejs8.10 example/index.handler

# Simulate POST request
$ cat ./example/__tests__/events/api-gw-post.json | docker run --rm -v "$PWD":/var/task -i -e DOCKER_LAMBDA_USE_STDIN=1 lambci/lambda:nodejs8.10 example/index.handler
```

## How to deploy

### Prerequisites

- [apex](https://github.com/apex/apex)

### Steps

You must setup `example` as your AWS Profile(at ~/.aws/credentials && ~/.aws/config).

```
# Init project.json
apex --profile example init 

# Initialize infra(API Gateway)
apex --profile example infra init

# Dry run for see changes.
cp -r ./node_modules ./functions/example
apex --profile example deploy -D

# Do deploy lambda.
apex --profile example deploy

# Dry run for see changes.
apex --profile example infra plan
apex --profile example infra apply
```

### Steps to destroy

```
# Destroy infrastructure.
apex --profile example infra destroy

# Delete lambda
apex --profile example delete
```

## Credits

Thanks to original authors of [aws-serverless-express](https://github.com/awslabs/aws-serverless-express) package. 

## LICENSE

MIT License 

SEE: [LICENSE](LICENSE)
