// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const fs = require('fs');
const path = require('path');

function writeCustomResourceExports(projectPath) {
    const cfnOutputsFile = path.join(
        projectPath,
        "amplify",
        "#current-cloud-backend",
        "amplify-meta.json"
    );
    
    const amplifyMeta = JSON.parse(fs.readFileSync(cfnOutputsFile, { encoding: 'utf8' }));
    
    const customResourceExportsFile = path.join(
        projectPath,
        "src",
        "custom-resource-exports.json"
    );
    
    const customerResourceExports = {
        RootUrl: amplifyMeta.custom.qickworkloadapi.output.RootUrl
    };
    
    fs.writeFileSync(customResourceExportsFile, JSON.stringify(customerResourceExports), { encoding: 'utf8' });
}

module.exports = {
    writeCustomResourceExports
};