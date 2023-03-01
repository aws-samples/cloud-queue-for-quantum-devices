// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { render, screen } from '@testing-library/react';
import App from './App';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';

test('renders header', () => {
  
  const router = createMemoryRouter([
    {
      path: "/",
      element: <App />
    }
  ]);

  render(
    <RouterProvider router={router} />
  );

  const headerElement = screen.getByText(/Cloud Queue for Quantum Devices/i);
  expect(headerElement).toBeInTheDocument();
});
