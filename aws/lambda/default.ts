import { APIGatewayProxyWebsocketEventV2, Context } from "aws-lambda";
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

export const handler = async (event: APIGatewayProxyWebsocketEventV2, context: Context) => {
  const apiGatewayManagementApi = new ApiGatewayManagementApiClient({
    endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`
  });
  
  const command = new PostToConnectionCommand({
      ConnectionId: event.requestContext.connectionId,
      Data: "Hi!"
  });

  await apiGatewayManagementApi.send(command);

  return { statusCode: 200 }
};