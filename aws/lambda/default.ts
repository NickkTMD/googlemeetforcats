import { APIGatewayProxyWebsocketEventV2, Context } from "aws-lambda";
import { getManagementApi, sendMessage } from "./helpers";

export const handler = async (event: APIGatewayProxyWebsocketEventV2, context: Context) => {
  const apiGatewayManagementApi = getManagementApi(event);
  const connectionId = event.requestContext.connectionId;
  await sendMessage(apiGatewayManagementApi, connectionId, "Hi there!");

  return { statusCode: 200 }
};