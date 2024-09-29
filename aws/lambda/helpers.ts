import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import { APIGatewayProxyWebsocketEventV2 } from "aws-lambda";

export const getManagementApi = (event: APIGatewayProxyWebsocketEventV2) => {
    return new ApiGatewayManagementApiClient({
        endpoint: `https://${event.requestContext.domainName}/${event.requestContext.stage}`
    });
};

export const sendMessage = async (managementApi: ApiGatewayManagementApiClient, connectionId: string, message: string) => {
    const command = new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: message
    });

    await managementApi.send(command);
}