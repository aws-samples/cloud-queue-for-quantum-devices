// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0



const { DynamoDBDocument } = require("@aws-sdk/lib-dynamodb");
const { DynamoDB } = require("@aws-sdk/client-dynamodb");

const dynamo = DynamoDBDocument.from(new DynamoDB(), {
    marshallOptions: {
        removeUndefinedValues: true
    }
});

const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

async function getDevices() {
    const params = {
        TableName: DYNAMODB_TABLE_NAME,
        ProjectionExpression: 'DeviceId, DeviceName, DeviceStatus, LastRefreshed, RefreshTimeout'
    }
    const response = await dynamo.scan(params);
    
    return response.Items.map(item => ({
        ...item,
        DeviceStatus: (new Date() > new Date(new Date(item.LastRefreshed).getTime() + (parseInt(item.RefreshTimeout) * 1000))) ? 'OFFLINE' : item.DeviceStatus
    }));
}

exports.handler = async (event) => {
    try {
        console.debug(`EVENT: ${JSON.stringify(event)}`);
        
        const Devices = await getDevices();
        
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            }, 
            body: JSON.stringify(Devices),
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
