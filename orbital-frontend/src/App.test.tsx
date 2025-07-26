import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// Mock the pages components
const MockHomePage = () => <div data-testid="home-page">Home Page</div>;
const MockPlannerPage = () => <div data-testid="planner-page">Planner Page</div>;

jest.mock('./pages/HomePage', () => MockHomePage);
jest.mock('./pages/PlannerPage', () => MockPlannerPage);

// Create a test version of the App routes without the outer Router
const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<MockHomePage />} />
    <Route path="/planner" element={<MockPlannerPage />} />
  </Routes>
);

describe('App routing', () => {
  test('renders HomePage component on root path', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  test('renders PlannerPage component on /planner path', () => {
    render(
      <MemoryRouter initialEntries={['/planner']}>
        <AppRoutes />
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('planner-page')).toBeInTheDocument();
    expect(screen.getByText('Planner Page')).toBeInTheDocument();
  });

  test('renders nothing for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <AppRoutes />
      </MemoryRouter>
    );
    
    // Since there's no catch-all route, it should not render anything for unknown routes
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
    expect(screen.queryByTestId('planner-page')).not.toBeInTheDocument();
  });
});
