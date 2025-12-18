// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0



const { CognitoIdentityProvider } = require("@aws-sdk/client-cognito-identity-provider");

const cognito = new CognitoIdentityProvider({
    // The key apiVersion is no longer supported in v3, and can be removed.
    // @deprecated The client uses the "latest" apiVersion.
    apiVersion: '2016-04-18',
})

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

async function addUserToGroup(Username, GroupName) {
    const params = {
        UserPoolId: COGNITO_USER_POOL_ID,
        Username,
        GroupName
    };
    
    return cognito.adminAddUserToGroup(params);
}
async function createUser(Email, FullName) {
    const params = {
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: Email,
        DesiredDeliveryMediums: ["EMAIL"],
        UserAttributes: [
            {
              Name: 'email',
              Value: Email
            },
            {
              Name: 'given_name',
              Value: FullName
            }
        ]
    };
    
    const user = await cognito.adminCreateUser(params);
    
    await addUserToGroup(Email, "AllDevices");
    
    return user;
}

exports.handler = async (event, context) => {
    try {
        console.debug(`EVENT: ${JSON.stringify(event)}`);
    
        const { Email, FullName } = JSON.parse(event.body);
        
        await createUser(Email, FullName);
        
        return {
            statusCode: 200,
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
