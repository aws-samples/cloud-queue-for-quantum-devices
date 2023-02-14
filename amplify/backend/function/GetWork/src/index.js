const AWS = require("aws-sdk");

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const dynamo = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

function createPresignedUrl(Bucket, Key, Filename) {
    const params = {
        'Bucket': Bucket,
        'Key': Key,
        ResponseContentDisposition: 'attachment; filename ="' + Filename + '"'
     };

    return s3.getSignedUrlPromise('getObject', params);
}

async function getWork(WorkId) {
    const params = {
        Key: { WorkId },
        TableName: DYNAMODB_TABLE_NAME
    };
    
    const { Item: Work } = await dynamo.get(params).promise();
    const { WorkBucket, WorkPath, WorkStatus, CreatedAt, ReadyAt } = Work;
    
    const [ WorkloadUrl, WorkloadResultUrl ] = await Promise.all([
        createPresignedUrl(WorkBucket, WorkPath + '/work', WorkId + "-work"),
        createPresignedUrl(WorkBucket, WorkPath + '/output', WorkId + "-output")
    ]);
    
    return { 
        WorkId,
        CreatedAt,
        ReadyAt,
        WorkStatus,
        WorkloadUrl,
        WorkloadResultUrl
    };
}

exports.handler = async (event) => {
    try {
        console.debug(`EVENT: ${JSON.stringify(event)}`);
        
        const { WorkId } = event.pathParameters;
        
        const Device = await getWork(WorkId);
        
        return {
            statusCode: 200,
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
