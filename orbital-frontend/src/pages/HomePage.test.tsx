import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock Firebase module
jest.mock('../firebase');

// Import the auth object directly
import { auth, signInWithPopup, signOut } from '../firebase';

// Cast the mocked functions to get access to Jest mock methods
const mockAuth = auth as any;
const mockSignInWithPopup = signInWithPopup as jest.MockedFunction<typeof signInWithPopup>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

// Mock ModuleList component
jest.mock('../components/ModuleList', () => {
  return function MockModuleList() {
    return <div data-testid="module-list">Module List Component</div>;
  };
});

// Mock window.alert
global.alert = jest.fn();

// Import the component after mocks are set up
import HomePage from './HomePage';

describe('HomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.onAuthStateChanged.mockImplementation((callback: any) => {
      callback(null); // Start with no user
      return jest.fn(); // Return unsubscribe function
    });
  });

  test('renders main heading and tagline', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /soc gradwise/i })).toBeInTheDocument();
    expect(screen.getByText(/plan smart\. graduate smoothly\./i)).toBeInTheDocument();
  });

  test('shows login button when user is not authenticated', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
  });

  test('hides ModuleList component when user is not authenticated', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.queryByTestId('module-list')).not.toBeInTheDocument();
  });

  test('handles login button click', async () => {
    mockSignInWithPopup.mockResolvedValueOnce({
      user: { displayName: 'Test User' },
      providerId: 'google.com',
      operationType: 'signIn',
    });

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const loginButton = screen.getByRole('button', { name: /sign in with google/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockSignInWithPopup).toHaveBeenCalled();
    });
  });

  test('renders feature card', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/graduation progress/i)).toBeInTheDocument();
    expect(screen.getByText(/track your progress towards graduation requirements/i)).toBeInTheDocument();
  });

  test('renders Start Planning link', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /start planning/i })).toBeInTheDocument();
  });

  test('renders footer', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/powered by react, firebase, flask/i)).toBeInTheDocument();
  });

  // Test for authenticated state - simplified approach
  test('shows user controls when user is authenticated', async () => {
    const mockUser = {
      displayName: 'John Doe',
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
      uid: 'mock-uid',
      email: 'test@example.com',
    };
    
    mockAuth.onAuthStateChanged.mockImplementation((callback: any) => {
      setTimeout(() => callback(mockUser), 0);
      return jest.fn();
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/welcome, john doe!/i)).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  test('shows ModuleList component when user is authenticated', async () => {
    const mockUser = {
      displayName: 'John Doe',
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
      uid: 'mock-uid',
      email: 'test@example.com',
    };
    
    mockAuth.onAuthStateChanged.mockImplementation((callback: any) => {
      setTimeout(() => callback(mockUser), 0);
      return jest.fn();
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('module-list')).toBeInTheDocument();
    });
    
    expect(screen.getByRole('button', { name: /save my study plan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load my study plans/i })).toBeInTheDocument();
  });

  test('handles logout button click', async () => {
    const mockUser = {
      displayName: 'John Doe',
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
      uid: 'mock-uid',
      email: 'test@example.com',
    };
    
    mockAuth.onAuthStateChanged.mockImplementation((callback: any) => {
      setTimeout(() => callback(mockUser), 0);
      return jest.fn();
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });

  test('handles save study plan', async () => {
    const mockUser = {
      displayName: 'John Doe',
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
      uid: 'mock-uid',
      email: 'test@example.com',
    };
    
    mockAuth.onAuthStateChanged.mockImplementation((callback: any) => {
      // Set currentUser so it's available when the component checks auth.currentUser
      mockAuth.currentUser = mockUser;
      setTimeout(() => callback(mockUser), 0);
      return jest.fn();
    });

    mockedAxios.post.mockResolvedValueOnce({ 
      data: { success: true, message: 'Plan saved successfully' } 
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save my study plan/i })).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /save my study plan/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUser.getIdToken).toHaveBeenCalled();
    });
  });

  test('handles load study plans', async () => {
    const mockUser = {
      displayName: 'John Doe',
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
      uid: 'mock-uid',
      email: 'test@example.com',
    };
    
    mockAuth.onAuthStateChanged.mockImplementation((callback: any) => {
      // Set currentUser so it's available when the component checks auth.currentUser
      mockAuth.currentUser = mockUser;
      setTimeout(() => callback(mockUser), 0);
      return jest.fn();
    });

    mockedAxios.get.mockResolvedValueOnce({
      data: { 
        success: true, 
        data: { "Year 1 Sem 1": [] }
      }
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /load my study plans/i })).toBeInTheDocument();
    });

    const loadButton = screen.getByRole('button', { name: /load my study plans/i });
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(mockUser.getIdToken).toHaveBeenCalled();
    });
  });
});
