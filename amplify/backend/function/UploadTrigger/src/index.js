// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const dynamo = new AWS.DynamoDB.DocumentClient();

const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

async function getWork(WorkId) {
    const params = {
        Key: { WorkId },
        TableName: DYNAMODB_TABLE_NAME,
        ConsistentRead: true
    };
    
    const { Item }  = await dynamo.get(params).promise();
    
    return Item;
}

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

async function finishWork(WorkId) {
    const params = {
      TableName: DYNAMODB_TABLE_NAME,
      Key: { WorkId },
      UpdateExpression: 'SET WorkStatus = :WorkStatus REMOVE StatusPriorityReadyAt',
      ExpressionAttributeValues: {
        ':WorkStatus': 'DONE'
      }
    };
    
    return dynamo.update(params).promise();
}

async function updateWork(WorkId, EventTime, Priority) {
    const params = {
      TableName: DYNAMODB_TABLE_NAME,
      Key: { WorkId },
      UpdateExpression: 'SET WorkStatus = :WorkStatus, ReadyAt = :ReadyAt, StatusPriorityReadyAt = :StatusPriorityReadyAt',
      ExpressionAttributeValues: {
        ':WorkStatus': 'READY',
        ':ReadyAt': EventTime,
        ':StatusPriorityReadyAt': `3#${priorityToInt(Priority)}#${EventTime}`
      }
    };
    
    return dynamo.update(params).promise();
}

exports.handler = async (event) => {
    try {
        console.debug(`EVENT: ${JSON.stringify(event)}`);
        
        const record = event.Records[0];
        
        const EventTime = new Date(record.eventTime).toISOString();
        const Path = record.s3.object.key;
        
        const [ _, WorkId, File ] = Path.split('/');
        
        const Workload = await getWork(WorkId);
        
        if (Workload) {
            if (File === "output") {
                await finishWork(WorkId);
            }
            else if (File === "work")  {
                await updateWork(WorkId, EventTime, Workload.Priority);
            }
            
            return {
                statusCode: 200,
                body: JSON.stringify({}),
            };
        }
          
        return {
            statusCode: 500,
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
