// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import '@aws-amplify/ui-react/styles.css';
import App from './App';
import Devices from './Devices';
import Workloads from './Workloads';
import reportWebVitals from './reportWebVitals';
import { Amplify, Auth } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import awsExports from './aws-exports';
import customResourceExports from './custom-resource-exports.json';

Amplify.configure(awsExports);

Amplify.configure({
    API: {
        endpoints: [
            {
                name: "API",
                endpoint: customResourceExports.RootUrl,
                custom_header: async () => { 
                  return { Authorization: `Bearer ${(await Auth.currentSession()).getAccessToken().getJwtToken()}` }
                }
            }
        ]
    }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Authenticator hideSignUp={true} variation="modal">
      {({ user, signOut }) => (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App signOut={signOut}/>}>
              <Route index element={<Devices />} />
              <Route path="devices/:DeviceId/workloads" element={<Workloads user={user} />}>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      )}
  </Authenticator>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
