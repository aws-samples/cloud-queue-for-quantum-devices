// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const AWS = require("aws-sdk");

const dynamo = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

function createPresignedUrl(Bucket, Key, DeviceConfigurationFileExtension) {
    const params = {
        'Bucket': Bucket,
        'Key': Key + "/configuration",
        ResponseContentDisposition: 'attachment; filename ="' + Key + "-configuration." + DeviceConfigurationFileExtension + '"'
     };

    return s3.getSignedUrlPromise('getObject', params);
}

async function getDevice(DeviceId) {
    const params = {
        Key: { DeviceId },
        TableName: DYNAMODB_TABLE_NAME
    };
    
    const { Item: Device } = await dynamo.get(params).promise();
    const { 
        DeviceName, 
        DeviceBucket, 
        DeviceKey, 
        DeviceConfigurationFileExtension, 
        DeviceStatus, 
        RefreshTimeout, 
        LastRefreshed, 
        ConfigurationLastRefreshed 
    } = Device;
    
    const DeviceConfigurationUrl = ConfigurationLastRefreshed && await createPresignedUrl(DeviceBucket, DeviceKey, DeviceConfigurationFileExtension);
    
    return { 
        DeviceId,
        DeviceName,
        DeviceStatus: (new Date() > new Date(new Date(LastRefreshed).getTime() + (parseInt(RefreshTimeout) * 1000))) ? 'OFFLINE' : DeviceStatus,
        ConfigurationLastRefreshed,
        LastRefreshed,
        RefreshTimeout,
        DeviceConfigurationUrl 
    };
}

exports.handler = async (event) => {
    try {
        console.debug(`EVENT: ${JSON.stringify(event)}`);
        
        const { DeviceId } = event.pathParameters;
        
        const Device = await getDevice(DeviceId);
        
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
