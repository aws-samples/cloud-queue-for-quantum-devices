// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0



const { CognitoIdentityProvider } = require("@aws-sdk/client-cognito-identity-provider");
const { DynamoDBDocument } = require("@aws-sdk/lib-dynamodb");
const { DynamoDB } = require("@aws-sdk/client-dynamodb");

const crypto = require("crypto");
const cognito = new CognitoIdentityProvider({
    // The key apiVersion is no longer supported in v3, and can be removed.
    // @deprecated The client uses the "latest" apiVersion.
    apiVersion: '2016-04-18',
})
const dynamo = DynamoDBDocument.from(new DynamoDB(), {
    marshallOptions: {
        removeUndefinedValues: true
    }
});

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const DEVICE_BUCKET_NAME = process.env.DEVICE_BUCKET_NAME;

async function createDevice(DeviceName, RefreshTimeout) {
    const params = {
        UserPoolId: COGNITO_USER_POOL_ID,
        ClientName: DeviceName,
        AllowedOAuthFlows: ["client_credentials"],
        GenerateSecret: true,
        AllowedOAuthFlowsUserPoolClient: true,
        AllowedOAuthScopes: [
            "workloadapi/getdevice",
            "workloadapi/getdevicework",
            "workloadapi/putdevicework",
            "workloadapi/updatedevice"
        ]
    };
    
    const { UserPoolClient } = await cognito.createUserPoolClient(params);
    
    const DeviceId = crypto.randomUUID();
    const CreatedAt = new Date().toISOString();
    
    await dynamo
      .put({
        TableName: DYNAMODB_TABLE_NAME,
        Item: {
          DeviceId,
          DeviceName,
          DeviceStatus: 'OFFLINE',
          AppClientId: UserPoolClient.ClientId,
          RefreshTimeout: RefreshTimeout ? parseInt(RefreshTimeout) : 60,
          LastRefreshed: 0,
          CreatedAt
        }
      });
      
    return {
        DeviceId,
        DeviceName,
        ClientId: UserPoolClient.ClientId,
        ClientSecret: UserPoolClient.ClientSecret
    }
}

exports.handler = async (event, context) => {
    try {
        console.debug(`EVENT: ${JSON.stringify(event)}`);
    
        const { DeviceName, RefreshTimeout } = JSON.parse(event.body);
        
        const Device = await createDevice(DeviceName, RefreshTimeout);
        
        return {
            statusCode: 201,
             headers: {
                 "Access-Control-Allow-Origin": "*",
                 "Access-Control-Allow-Headers": "*"
             }, 
            body: JSON.stringify(Device),
        };
    }
    catch (e) {
        console.error(e);
        
         return {
            statusCode: 500,
             headers: {
                 "Access-Control-Allow-Origin": "*",
                 "Access-Control-Allow-Headers": "*"
             }, 
            body: JSON.stringify({ ErrorMessage: e.message }),
        };
    }
    
};
