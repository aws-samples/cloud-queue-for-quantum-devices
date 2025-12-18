// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0



const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
const { DynamoDB } = require('@aws-sdk/client-dynamodb');

const dynamo = DynamoDBDocument.from(new DynamoDB(), {
    marshallOptions: {
        removeUndefinedValues: true
    }
});

const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

function updateDevice(DeviceId, DeviceBucket, DeviceKey) {
    const params = {
      TableName: DYNAMODB_TABLE_NAME,
      Key: { DeviceId },
      UpdateExpression: 'SET ConfigurationLastRefreshed = :ConfigurationLastRefreshed',
      ExpressionAttributeValues: {
        ':ConfigurationLastRefreshed': new Date().toISOString(),
      }
    };
    
    return dynamo.update(params);
}

exports.handler = async (event) => {
    try {
        console.debug(`EVENT: ${JSON.stringify(event)}`);
        
        const record = event.Records[0];
        
        const DeviceKey = record.s3.object.key;
        const [ DeviceId, _ ] = DeviceKey.split('/');
        
        const DeviceBucket = record.s3.bucket.name;
        
        await updateDevice(DeviceId, DeviceBucket, DeviceKey);
            
        return {
            statusCode: 200,
            body: JSON.stringify({}),
        };
    }
    catch (e) {
        console.error(e);
        
         return {
            statusCode: 500,
            body: JSON.stringify({ ErrorMessage: e.message }),
        };
    }
};
