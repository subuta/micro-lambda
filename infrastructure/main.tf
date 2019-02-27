terraform {
  required_version = ">= 0.11.0"
}

provider "aws" {
  region = "ap-northeast-1"
  profile = "example"
}

// Apex variables.
variable "aws_region" {}
variable "apex_environment" {}
variable "apex_function_role" {}
variable "apex_function_arns" {
  type = "map"
}
variable "apex_function_names" {
  type = "map"
}

locals {
  example_lambda_name = "${var.apex_function_names["example"]}"
  example_lambda_arn = "${var.apex_function_arns["example"]}"
  region = "${var.aws_region}"
  account_id = "${data.aws_caller_identity.self.account_id}"
}

data "aws_caller_identity" "self" {}

// Fetch as data for retrieve invoke_arn.
data "aws_lambda_function" "example" {
  function_name = "${local.example_lambda_name}"
}

// SEE: https://learn.hashicorp.com/terraform/aws/lambda-api-gateway
resource "aws_api_gateway_rest_api" "example" {
  name = "example"
  description = "Terraform Serverless Application Example"
}

resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = "${aws_api_gateway_rest_api.example.id}"
  parent_id = "${aws_api_gateway_rest_api.example.root_resource_id}"
  path_part = "{proxy+}"
}

resource "aws_api_gateway_method" "proxy" {
  rest_api_id = "${aws_api_gateway_rest_api.example.id}"
  resource_id = "${aws_api_gateway_resource.proxy.id}"
  http_method = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda" {
  rest_api_id = "${aws_api_gateway_rest_api.example.id}"
  resource_id = "${aws_api_gateway_method.proxy.resource_id}"
  http_method = "${aws_api_gateway_method.proxy.http_method}"

  credentials = "${aws_iam_role.apig_aws_proxy.arn}"

  integration_http_method = "POST"
  type = "AWS_PROXY"
  uri = "${data.aws_lambda_function.example.invoke_arn}"
}

resource "aws_api_gateway_deployment" "example" {
  depends_on = [
    "aws_api_gateway_integration.lambda"
  ]

  rest_api_id = "${aws_api_gateway_rest_api.example.id}"
  stage_name = "test"
}

output "example_url" {
  value = "${aws_api_gateway_deployment.example.invoke_url}/${local.example_lambda_name}"
}

// SEE: https://www.terraform.io/docs/providers/aws/r/api_gateway_account.html
// For enable cloud_watch logs of API Gateway.
resource "aws_api_gateway_account" "example" {
  cloudwatch_role_arn = "${aws_iam_role.cloudwatch.arn}"
}

resource "aws_iam_role" "cloudwatch" {
  name = "api_gateway_cloudwatch_global"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "apigateway.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "cloudwatch" {
  name = "default"
  role = "${aws_iam_role.cloudwatch.id}"

  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams",
                "logs:PutLogEvents",
                "logs:GetLogEvents",
                "logs:FilterLogEvents"
            ],
            "Resource": "*"
        }
    ]
}
EOF
}

resource "aws_iam_role" "apig_aws_proxy" {
  name = "apig_aws_proxy_role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "apigateway.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "apig_aws_proxy" {
  name = "default"
  role = "${aws_iam_role.apig_aws_proxy.id}"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
      {
          "Effect": "Allow",
          "Action": [
              "apigateway:*"
          ],
          "Resource": [
              "arn:aws:apigateway:*::/*"
          ]
      },

      {
          "Effect": "Allow",
          "Action": "lambda:InvokeFunction",
          "Resource": "*"
      }
  ]
}
EOF
}
