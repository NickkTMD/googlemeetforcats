import { Stack, StackProps, aws_lambda, aws_apigatewayv2, CfnOutput, aws_lambda_nodejs } from "aws-cdk-lib";
import { WebSocketLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Construct } from "constructs";

export class WSBackendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // WebSocket Lambdas
    const defaultRouteLambda = new aws_lambda_nodejs.NodejsFunction(this, "DefaultRouteLambda", {
      entry: "lambda/default.ts",
      handler: "handler",
      runtime: aws_lambda.Runtime.NODEJS_20_X,
      bundling: {
        nodeModules: ["playwright"],
        minify: true,
      }
    });

    // Create WebSocket API
    const webSocketApi = new aws_apigatewayv2.WebSocketApi(this, "WebSocketApi", {
      defaultRouteOptions: {
        integration: new WebSocketLambdaIntegration("DefaultRouteLambda", defaultRouteLambda)
      }
    });

    new aws_apigatewayv2.WebSocketStage(this, "ProdStage", {
      webSocketApi,
      stageName: "prod",
      autoDeploy: true
    });

    webSocketApi.grantManageConnections(defaultRouteLambda);

    new CfnOutput(this, "WebSocketApiUrl", {
      value: webSocketApi.apiEndpoint,
    });
  }
}
