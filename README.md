# play-with-lambda
docker-lambda testing

### Local run lambda (by docker-lambda)

```sh
cat ./src/__tests__/events/api-gw.json | docker run --rm -v "$PWD":/var/task -i -e DOCKER_LAMBDA_USE_STDIN=1 lambci/lambda:nodejs8.10 example/index.handler
```
