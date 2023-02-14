// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { AmplifyAuthCognitoStackTemplate } from '@aws-amplify/cli-extensibility-helper';

export function override(resources: AmplifyAuthCognitoStackTemplate) {
    resources.addCfnResource(
        {
          type: "AWS::Cognito::UserPoolResourceServer",
          properties: {
            Identifier: "workloadapi",
            Name: "workloadapi",
            Scopes: [
                {
                    ScopeName: "putdevicework",
                    ScopeDescription: "Put device work"
                },
                {
                    ScopeName: "getdevicework",
                    ScopeDescription: "Get device work"
                },
                {
                    ScopeName: "updatedevice",
                    ScopeDescription: "Update device info"
                },
                {
                    ScopeName: "getdevice",
                    ScopeDescription: "Get device info"
                },
                {
                    ScopeName: "listdevices",
                    ScopeDescription: "List devices"
                },
                {
                    ScopeName: "listwork",
                    ScopeDescription: "List work"
                },
                {
                    ScopeName: "creatework",
                    ScopeDescription: "Create work "
                }
            ],
            UserPoolId: {
              Ref: "UserPool",
            },
          },
        },
        "workloadapi-resourceserver"
  );
  
  resources.userPool.userAttributeUpdateSettings = { attributesRequireVerificationBeforeUpdate: [ ] };
  resources.userPool.autoVerifiedAttributes = [ ];
  
  resources.userPool.adminCreateUserConfig = { allowAdminCreateUserOnly: true };
  
  resources.userPoolClientWeb.explicitAuthFlows = [ "ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_SRP_AUTH", "ALLOW_CUSTOM_AUTH", "ALLOW_USER_PASSWORD_AUTH"];
}
