// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0



const { DynamoDBDocument } = require('@aws-sdk/lib-dynamodb');
const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { PutObjectCommand, S3 } = require('@aws-sdk/client-s3');

const dynamo = DynamoDBDocument.from(new DynamoDB(), {
    marshallOptions: {
        removeUndefinedValues: true
    }
});
const s3 = new S3();

const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const DEVICE_BUCKET_NAME = process.env.DEVICE_BUCKET_NAME;

function updateDevice(DeviceId, DeviceStatus, DeviceConfigurationFileExtension) {
    
    const params = {
      TableName: DYNAMODB_TABLE_NAME,
      Key: { DeviceId },
      UpdateExpression: 'SET LastRefreshed = :LastRefreshed, DeviceBucket = :DeviceBucket, DeviceKey = :DeviceKey, DeviceStatus = :DeviceStatus, DeviceConfigurationFileExtension = :DeviceConfigurationFileExtension',
      ExpressionAttributeValues: {
        ':LastRefreshed': new Date().toISOString(),
        ':DeviceBucket': DEVICE_BUCKET_NAME,
        ':DeviceKey': DeviceId,
        ':DeviceStatus': DeviceStatus,
        ':DeviceConfigurationFileExtension': DeviceConfigurationFileExtension
      }
    };
    
    return dynamo.update(params);
}

function createPresignedUrl(DeviceId, Filename) {
    const params = {
        'Bucket': DEVICE_BUCKET_NAME,
        'Key': `${DeviceId}/${Filename}`,
        'ContentType': 'application/octet-stream'
     };

    return getSignedUrl(s3, new PutObjectCommand(params));
}

exports.handler = async (event) => {
    try {
        console.debug(`EVENT: ${JSON.stringify(event)}`);
        
        const { DeviceId } = event.pathParameters;
        const { DeviceStatus, DeviceConfigurationFileExtension } = JSON.parse(event.body);
        
        await updateDevice(DeviceId, DeviceStatus, DeviceConfigurationFileExtension);
        
        const UploadUrl = await createPresignedUrl(DeviceId, "configuration");
        
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "*"
            }, 
            body: JSON.stringify({ DeviceId, UploadUrl }),
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
