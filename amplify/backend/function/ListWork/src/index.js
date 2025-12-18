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

async function listWork(DeviceId, AccountId, ExclusiveStartKey) {
    let params;

    if (AccountId) {
        params = {
            KeyConditionExpression: 'DeviceId = :DeviceId AND begins_with(AccountIdCreatedAt, :AccountIdCreatedAt)',
            ExpressionAttributeValues: {
                ':DeviceId': DeviceId,
                ':AccountIdCreatedAt': `${AccountId}#`
            },
            ProjectionExpression: "WorkId, UserGivenName, Priority, DeviceId, ReadyAt, WorkStatus, CreatedAt",
            TableName: DYNAMODB_TABLE_NAME,
            IndexName: 'UserWorkGSI',
            ExclusiveStartKey,
            ScanIndexForward: false,
            Limit: 5
        };
    }
    else {
        params = {
            KeyConditionExpression: 'DeviceId = :DeviceId',
            ExpressionAttributeValues: {
                ':DeviceId': DeviceId
            },
            ProjectionExpression: "WorkId, UserGivenName, Priority, DeviceId, ReadyAt, WorkStatus, CreatedAt",
            TableName: DYNAMODB_TABLE_NAME,
            IndexName: 'AllUserWorkGSI',
            ExclusiveStartKey,
            ScanIndexForward: false,
            Limit: 5
        };
    }

    const response = await dynamo.query(params);

    return { Items: response.Items, LastEvaluatedKey: response.LastEvaluatedKey };
}

exports.handler = async (event) => {
    try {
        console.debug(`EVENT: ${JSON.stringify(event)}`);

        const { DeviceId, AccountId, ExclusiveStartKeyJson } = event.queryStringParameters;

        const ExclusiveStartKey = ExclusiveStartKeyJson ? JSON.parse(ExclusiveStartKeyJson) : undefined;

        const Work = await listWork(DeviceId, AccountId, ExclusiveStartKey);

        return {
            statusCode: 200,
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
            body: JSON.stringify({ ErrorMessage: e.message, e }),
        };
    }
};
