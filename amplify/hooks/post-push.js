// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const fs = require('fs');
const { writeCustomResourceExports } = require('./write-custom-resource-exports.js');

const parameters = JSON.parse(fs.readFileSync(0, { encoding: 'utf8' }));

writeCustomResourceExports(parameters.data.amplify.environment.projectPath);
