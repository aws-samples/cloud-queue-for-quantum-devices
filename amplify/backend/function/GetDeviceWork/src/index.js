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

async function getWork(WorkId) {
    const params = {
        Key: { WorkId },
        TableName: DYNAMODB_TABLE_NAME,
        ConsistentRead: true
    };
    
    const { Item }  = await dynamo.get(params).promise();
    
    return Item;
}

async function getDeviceWork(DeviceId) {
    const params = {
        KeyConditionExpression: 'DeviceId = :DeviceId',
        ExpressionAttributeValues: {
            ':DeviceId': DeviceId
        },
        TableName: DYNAMODB_TABLE_NAME,
        IndexName: 'GetDeviceWorkGSI',
        Limit: 5
    };
    
    const { Items }  = await dynamo.query(params).promise();
    
    for(const Item of Items) {
        const Work = await getWork(Item.WorkId)
        if (Work.WorkStatus != "DONE") {
            return Work;
        }
    }
    
    return null;
}

function executeDeviceWork(Workload) {
    const { WorkId, Priority, ReadyAt, StatusPriorityReadyAt } = Workload;
    
    const params = {
      TableName: DYNAMODB_TABLE_NAME,
      Key: { WorkId },
      UpdateExpression: 'SET WorkStatus = :WorkStatus, StatusPriorityReadyAt = :StatusPriorityReadyAt',
      ConditionExpression: `StatusPriorityReadyAt = :CurrentStatusPriorityReadyAt`,
      ExpressionAttributeValues: {
        ':WorkStatus': 'EXECUTING',
        ':StatusPriorityReadyAt': `2#${priorityToInt(Priority)}#${ReadyAt}`,
        ':CurrentStatusPriorityReadyAt': StatusPriorityReadyAt
      }
    };
    
    return dynamo.update(params).promise();
}

function createPresignedUrl(Bucket, Key) {
    const params = {
        'Bucket': Bucket,
        'Key': Key
     };

    return s3.getSignedUrlPromise('getObject', params);
}

exports.handler = async (event) => {
    try {
        console.debug(`EVENT: ${JSON.stringify(event)}`);
        
        const { DeviceId } = event.pathParameters;
        
        const Workload = await getDeviceWork(DeviceId);
        
        if (Workload) {
            // Update work status if execution hasn't started yet
            const { WorkId, WorkStatus, WorkBucket, WorkPath } = Workload;
            if (WorkStatus == "READY") {
                await executeDeviceWork(Workload);
            }
            
            const WorkloadUrl = await createPresignedUrl(WorkBucket, WorkPath + "/work");
            
            const response = {
                WorkId,
                WorkloadUrl
            };
            
            return {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "*"
                }, 
                body: JSON.stringify(response),
            };
        }
        
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            }, 
            body: JSON.stringify([]),
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
