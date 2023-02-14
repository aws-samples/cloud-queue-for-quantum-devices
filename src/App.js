// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Container, Navbar, Nav, Button, Stack } from 'react-bootstrap';
import { Link, Outlet } from "react-router-dom";

function App({ signOut }) {

  return (
    <Container>
      <Navbar bg="light" expand="lg">
        <Container>
          <Navbar.Brand href="#home">AWS Cloud Queue for Quantum Devices</Navbar.Brand>
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
