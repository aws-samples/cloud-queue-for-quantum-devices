// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import { Container, Navbar, Image } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@aws-amplify/ui-react/styles.css';
import App from './App';
import Devices from './Devices';
import Workloads from './Workloads';
import reportWebVitals from './reportWebVitals';
import { Amplify, Auth } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import awsExports from './aws-exports';
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import anyonLogo from './assets/anyon_logo.png';
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

const ParticlesBackground = () => {
  const particlesInit = React.useCallback(async engine => {
    await loadSlim(engine);
  }, []);

  const particlesLoaded = React.useCallback(async container => {
    console.log("Particles container loaded", container);
  }, []);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: -1, backgroundColor: "#000000" }}>
      <Particles
        id="tsparticles"
        init={particlesInit}
        loaded={particlesLoaded}
        options={{
          fullScreen: false,
          fpsLimit: 60,
          interactivity: {
            events: {
              onClick: {
                enable: true,
                mode: "push",
              },
              onHover: {
                enable: true,
                mode: "repulse",
              },
              resize: true,
            },
            modes: {
              push: {
                quantity: 4,
              },
              repulse: {
                distance: 100,
                duration: 0.4,
              },
            },
          },
          particles: {
            color: {
              value: "#ffffff",
            },
            links: {
              color: "#ffffff",
              distance: 150,
              enable: true,
              opacity: 0.5,
              width: 1,
            },
            move: {
              direction: "none",
              enable: true,
              outModes: {
                default: "bounce",
              },
              random: false,
              speed: 1,
              straight: false,
            },
            number: {
              density: {
                enable: true,
                area: 800,
              },
              value: 80,
            },
            opacity: {
              value: 0.5,
            },
            shape: {
              type: "circle",
            },
            size: {
              value: { min: 1, max: 5 },
            },
          },
          detectRetina: true,
        }}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%"
        }}
      />
    </div>
  );
};

const NavigationBar = () => {
  return (
    <Navbar 
      variant="dark" 
      className="py-2 mb-4"
      style={{ 
        position: "relative", 
        zIndex: 10,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(5px)",
        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)"
      }}
    >
      <Container>
        <Navbar.Brand href="#home">
          <Image 
            src={anyonLogo} 
            alt="Anyon Logo" 
            height="40" 
            className="d-inline-block align-top me-2"
            style={{ paddingRight: '15px' }}
          />
          <span style={{ fontSize: "1.3rem", fontWeight: "500", color: "white" }}>
            Cloud Queue for Quantum Devices
          </span>
        </Navbar.Brand>
      </Container>
    </Navbar>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <>
    <ParticlesBackground />
    <NavigationBar />
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
  </>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
