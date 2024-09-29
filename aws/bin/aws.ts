import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { WSBackendStack } from "../lib/aws-stack";

const app = new cdk.App();
new WSBackendStack(app, "WSBackendStack", {
  env: { region: "us-west-2" },
});