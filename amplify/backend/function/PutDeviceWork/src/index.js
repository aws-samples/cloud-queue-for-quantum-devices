// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const dynamo = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

function priorityToInt(Priority) {
    switch (Priority) {
        case "HIGH":
            return 1;
        case "MEDIUM":
            return 2;
        case "LOW":
            return 3;
        default:
            return 0;
    }
}

async function getWork(WorkId, DeviceId) {
    const params = {
        KeyConditionExpression: 'WorkId = :WorkId',
        FilterExpression: 'DeviceId = :DeviceId',
        ExpressionAttributeValues: {
            ':WorkId': WorkId,
            ':DeviceId': DeviceId
        },
        TableName: DYNAMODB_TABLE_NAME,
        Limit: 1
    };
    
    const { Items }  = await dynamo.query(params).promise();
    
    return Items[0];
}

function uploadDeviceWork(Workload) {
    const { Priority, ReadyAt, StatusPriorityReadyAt } = Workload;
    
    const params = {
      TableName: DYNAMODB_TABLE_NAME,
      Key: { WorkId: Workload.WorkId },
      UpdateExpression: 'SET WorkStatus = :WorkStatus, StatusPriorityReadyAt = :StatusPriorityReadyAt',
      ConditionExpression: `StatusPriorityReadyAt = :CurrentStatusPriorityReadyAt`,
      ExpressionAttributeValues: {
        ':WorkStatus': 'UPLOADING',
        ':StatusPriorityReadyAt': `1#${priorityToInt(Priority)}#${ReadyAt}`,
        ':CurrentStatusPriorityReadyAt': StatusPriorityReadyAt
      }
    };
    
    return dynamo.update(params).promise();
}

function createPresignedUrl(Bucket, Key) {
    const params = {
        'Bucket': Bucket,
        'Key': Key,
        'ContentType': 'application/octet-stream'
     };

    return s3.getSignedUrlPromise('putObject', params);
}

exports.handler = async (event) => {
    try {
        console.debug(`EVENT: ${JSON.stringify(event)}`);
        
        const { DeviceId, WorkId } = event.pathParameters;
        
        const Workload = await getWork(WorkId, DeviceId);
        
        if (Workload) {
            
            if (Workload.WorkStatus == "EXECUTING") {
                await uploadDeviceWork(Workload);
            }
            
            const UploadUrl = await createPresignedUrl(Workload.WorkBucket, Workload.WorkPath + "/output");
        
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*"
                }, 
                body: JSON.stringify({ WorkId, UploadUrl }),
            };
        }
        
        return {
            statusCode: 404,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            }
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
