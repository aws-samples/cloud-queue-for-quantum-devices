// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Container, Navbar, Nav, Button, Stack, Image } from 'react-bootstrap';
import { Link, Outlet } from "react-router-dom";
import anyonLogo from './assets/anyon_logo.png';

function App({ signOut }) {

  return (
    <Container style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px' }}>
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand href="#home">
            <Image 
              src={anyonLogo} 
              alt="Anyon Logo" 
              height="30" 
              className="d-inline-block align-top me-2"
              style={{ paddingRight: '15px' }}
            />
            Cloud Queue for Quantum Devices
          </Navbar.Brand>
          <Nav className="me-justify-content-end">
            <Stack direction="horizontal" gap={2}>
            <Nav.Item>
              <Link to="/"><Button>Home</Button></Link>
            </Nav.Item>
            <Nav.Item>
              <Button onClick={signOut}>Sign out</Button>
            </Nav.Item>
            </Stack>
          </Nav>
        </Container>
      </Navbar>
      <br/>
      <Container>
        <Outlet />
      </Container>
    </Container>
  );
}

export default App;
