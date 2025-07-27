import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock Firebase module
jest.mock('../firebase');

// Import the auth object directly
import { auth } from '../firebase';

// Cast to mocked object
const mockAuth = auth as any;

// Mock window.alert
global.alert = jest.fn();

// Now import the component AFTER all mocks are set up
import PlannerPage from './PlannerPage';

describe('PlannerPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.currentUser = null;
    mockedAxios.get.mockResolvedValue({ data: { modules: [] } });
  });

  test('renders main heading and components', () => {
    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /module planner/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /graduation progress/i })).toBeInTheDocument();
  });

  test('renders semester selector with all semesters', () => {
    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    const semesterSelect = screen.getByLabelText(/select a semester/i);
    expect(semesterSelect).toBeInTheDocument();
    
    expect(screen.getByRole('option', { name: /year 1 sem 1/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /year 4 sem 2/i })).toBeInTheDocument();
  });

  test('renders module input and add button', () => {
    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/enter module code/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add module/i })).toBeInTheDocument();
  });

  test('renders save and load plan buttons', () => {
    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /save plan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /load plan/i })).toBeInTheDocument();
  });

  test('renders all semester cards', () => {
    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    expect(screen.getAllByText('Year 1 Sem 1')).toHaveLength(2); // option and heading
    expect(screen.getAllByText('Year 1 Sem 2')).toHaveLength(2);
    expect(screen.getAllByText('Year 2 Sem 1')).toHaveLength(2);
    expect(screen.getAllByText('Year 2 Sem 2')).toHaveLength(2);
    expect(screen.getAllByText('Year 3 Sem 1')).toHaveLength(2);
    expect(screen.getAllByText('Year 3 Sem 2')).toHaveLength(2);
    expect(screen.getAllByText('Year 4 Sem 1')).toHaveLength(2);
    expect(screen.getAllByText('Year 4 Sem 2')).toHaveLength(2);
  });

  test('displays initial progress as 0%', () => {
    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    expect(screen.getByText('0 / 40 modules completed (0%)')).toBeInTheDocument();
  });

  test('changes selected semester', () => {
    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    const semesterSelect = screen.getByLabelText(/select a semester/i) as HTMLSelectElement;
    fireEvent.change(semesterSelect, { target: { value: 'Year 2 Sem 1' } });

    expect(semesterSelect.value).toBe('Year 2 Sem 1');
  });

  test('updates module input field', () => {
    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    const moduleInput = screen.getByLabelText(/enter module code/i) as HTMLInputElement;
    fireEvent.change(moduleInput, { target: { value: 'CS1010' } });

    expect(moduleInput.value).toBe('CS1010');
  });

  test('adds module successfully', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        moduleCode: 'CS1010',
        title: 'Programming Methodology',
        moduleCredit: '4',
        description: 'This module introduces...'
      }
    });

    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    const moduleInput = screen.getByLabelText(/enter module code/i);
    const addButton = screen.getByRole('button', { name: /add module/i });

    fireEvent.change(moduleInput, { target: { value: 'CS1010' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/cs1010/i)).toBeInTheDocument();
    });
  });

  test('handles module not found error', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Module not found'));

    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    const moduleInput = screen.getByLabelText(/enter module code/i);
    const addButton = screen.getByRole('button', { name: /add module/i });

    fireEvent.change(moduleInput, { target: { value: 'INVALID' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('INVALID: Module not found or error fetching info');
    });
  });

  test('save plan requires authentication', async () => {
    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    const saveButton = screen.getByRole('button', { name: /save plan/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('You must be logged in to save your plan.');
    });
  });

  test('load plan requires authentication', async () => {
    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    const loadButton = screen.getByRole('button', { name: /load plan/i });
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('You must be logged in to load your plan.');
    });
  });

  test('save plan works when authenticated', async () => {
    const mockUser = {
      displayName: 'John Doe',
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
      uid: 'mock-uid',
      email: 'test@example.com',
    };
    mockAuth.currentUser = mockUser;

    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    const saveButton = screen.getByRole('button', { name: /save plan/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUser.getIdToken).toHaveBeenCalled();
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://orbital-production-efe9.up.railway.app/plans/save',
        { json_data: JSON.stringify({}) },
        {
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        }
      );
    });
  });

  test('load plan works when authenticated', async () => {
    const mockUser = {
      displayName: 'John Doe',
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
      uid: 'mock-uid',
      email: 'test@example.com',
    };
    mockAuth.currentUser = mockUser;

    mockedAxios.get.mockResolvedValueOnce({
      data: { plans: ['{"Year 1 Sem 1": []}'] }
    });

    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    const loadButton = screen.getByRole('button', { name: /load plan/i });
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(mockUser.getIdToken).toHaveBeenCalled();
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://orbital-production-efe9.up.railway.app/plans/load',
        {
          headers: {
            Authorization: 'Bearer mock-token',
            'Content-Type': 'application/json',
          },
        }
      );
    });
  });

  test('handles load plan with no saved plans', async () => {
    const mockUser = {
      displayName: 'John Doe',
      getIdToken: jest.fn().mockResolvedValue('mock-token'),
      uid: 'mock-uid',
      email: 'test@example.com',
    };
    mockAuth.currentUser = mockUser;

    mockedAxios.get.mockResolvedValueOnce({ data: { plans: [] } });

    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    const loadButton = screen.getByRole('button', { name: /load plan/i });
    fireEvent.click(loadButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('No saved plans found.');
    });
  });

  test('renders Back to Home link', () => {
    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    const backButton = screen.getByRole('button', { name: /back to home/i });
    expect(backButton).toBeInTheDocument();
    
    const link = backButton.closest('a');
    expect(link).toHaveAttribute('href', '/');
  });

  test('updates progress when modules are added', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        moduleCode: 'CS1010',
        title: 'Programming Methodology',
        moduleCredit: '4',
        description: 'This module introduces...'
      }
    });

    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    const moduleInput = screen.getByLabelText(/enter module code/i);
    const addButton = screen.getByRole('button', { name: /add module/i });

    fireEvent.change(moduleInput, { target: { value: 'CS1010' } });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('1 / 40 modules completed (3%)')).toBeInTheDocument();
    });
  });
});
