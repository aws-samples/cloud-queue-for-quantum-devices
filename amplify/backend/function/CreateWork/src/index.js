// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0



const { CognitoIdentityProvider } = require("@aws-sdk/client-cognito-identity-provider");
const { DynamoDBDocument } = require("@aws-sdk/lib-dynamodb");
const { DynamoDB } = require("@aws-sdk/client-dynamodb");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { PutObjectCommand, S3 } = require("@aws-sdk/client-s3");

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
const s3 = new S3();

const DYNAMODB_TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
const WORKLOAD_BUCKET_NAME = process.env.WORKLOAD_BUCKET_NAME;
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

async function getUserAttributes(AccountId) {
    const user = await cognito.adminGetUser({
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: AccountId,
    });
    
    return user.UserAttributes.reduce((acc, userAttribute) => {
        return { ...acc, [userAttribute.Name]: userAttribute.Value };
    }, {});
}

async function createWork(DeviceId, Priority, AccountId) {
    const WorkId = crypto.randomUUID();
    const WorkPath = `${AccountId}/${WorkId}`;
    const CreatedAt = new Date().toISOString();
    const UserAttributes = await getUserAttributes(AccountId);
    
    await dynamo
      .put({
        TableName: DYNAMODB_TABLE_NAME,
        Item: {
          WorkId,
          WorkStatus: 'CREATED',
          WorkPath,
          WorkBucket: WORKLOAD_BUCKET_NAME,
          Priority,
          AccountIdCreatedAt: `${AccountId}#${CreatedAt}`,
          CreatedAt,
          DeviceId,
          UserGivenName: UserAttributes.given_name
        }
      });
      
    
    const params = {
        'Bucket': WORKLOAD_BUCKET_NAME,
        'Key': `${WorkPath}/work`,
        'ContentType': 'application/octet-stream',
        'Metadata': {
            WorkId
        }
     };

    const UploadUrl = await getSignedUrl(s3, new PutObjectCommand(params));
    
    return { WorkId, UploadUrl };
}

exports.handler = async (event, context) => {
    try {
        console.debug(`EVENT: ${JSON.stringify(event)}`);
    
        const { DeviceId, Priority } = JSON.parse(event.body);
        const AccountId = event.requestContext.authorizer.principalId;
        
        const Work = await createWork(DeviceId, Priority, AccountId);
            
        return {
            statusCode: 201,
             headers: {
                 "Access-Control-Allow-Origin": "*",
                 "Access-Control-Allow-Headers": "*"
             }, 
            body: JSON.stringify(Work),
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
