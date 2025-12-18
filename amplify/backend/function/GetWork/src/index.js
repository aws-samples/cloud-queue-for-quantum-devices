const { DynamoDBDocument } = require("@aws-sdk/lib-dynamodb");
const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { GetObjectCommand, S3 } = require("@aws-sdk/client-s3");

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const dynamo = DynamoDBDocument.from(new DynamoDB(), {
    marshallOptions: {
        removeUndefinedValues: true
    }
});
const s3 = new S3();

const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

function createPresignedUrl(Bucket, Key, Filename) {
    const params = {
        'Bucket': Bucket,
        'Key': Key,
        ResponseContentDisposition: 'attachment; filename ="' + Filename + '"'
     };

    return getSignedUrl(s3, new GetObjectCommand(params));
}

async function getWork(WorkId) {
    const params = {
        Key: { WorkId },
        TableName: DYNAMODB_TABLE_NAME
    };
    
    const { Item: Work } = await dynamo.get(params);
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
