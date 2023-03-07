// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const fs = require('fs');
const path = require('path');
const { v4 } = require('uuid');

const parameters = JSON.parse(fs.readFileSync(0, { encoding: 'utf8' }));

const cliInputsFile = path.join(
    parameters.data.amplify.environment.projectPath,
    "amplify",
    "backend",
    "auth",
    "qickworkloadmgmtf902b9a7",
    "cli-inputs.json"
);

const cliInputsObject = JSON.parse(fs.readFileSync(cliInputsFile, { encoding: 'utf8' }));

if (!cliInputsObject.cognitoConfig.hostedUIDomainName) {
    const [uniqueId] = v4().split('-');

    cliInputsObject.cognitoConfig.hostedUI = true;
    cliInputsObject.cognitoConfig.hostedUIDomainName = `cqfqd-${uniqueId}`;

    fs.writeFileSync(cliInputsFile, JSON.stringify(cliInputsObject, null, "\t"), { encoding: 'utf8' });
}