import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModuleList from './ModuleList';

const mockModules = [
  { moduleCode: 'CS1010', title: 'Programming Methodology' },
  { moduleCode: 'CS2030', title: 'Programming Methodology II' },
  { moduleCode: 'MA1521', title: 'Calculus for Computing' }
];

describe('ModuleList', () => {
  beforeAll(() => {
    global.fetch = jest.fn();
  });

  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<ModuleList />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders module dropdown after successful data fetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockModules)
    });

    render(<ModuleList />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByLabelText('Select a module:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('-- Choose a module --')).toBeInTheDocument();
    
    // Check if modules are in the dropdown
    expect(screen.getByText('CS1010 - Programming Methodology')).toBeInTheDocument();
    expect(screen.getByText('CS2030 - Programming Methodology II')).toBeInTheDocument();
    expect(screen.getByText('MA1521 - Calculus for Computing')).toBeInTheDocument();
  });

  test('handles fetch error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(<ModuleList />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Should render the dropdown even with empty data
    expect(screen.getByLabelText('Select a module:')).toBeInTheDocument();
    expect(screen.getByDisplayValue('-- Choose a module --')).toBeInTheDocument();
  });

  test('allows user to select a module', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve(mockModules)
    });

    render(<ModuleList />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const dropdown = screen.getByLabelText('Select a module:');
    
    // Select a module
    fireEvent.change(dropdown, { target: { value: 'CS1010' } });
    
    expect(dropdown).toHaveValue('CS1010');
  });

  test('calls correct API endpoint', () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve([])
    });

    render(<ModuleList />);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://orbital-production-efe9.up.railway.app/nusmods/modules/2024-2025'
    );
  });

  test('renders empty dropdown when no modules are returned', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: () => Promise.resolve([])
    });

    render(<ModuleList />);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    const dropdown = screen.getByLabelText('Select a module:');
    expect(dropdown).toBeInTheDocument();
    
    // Should only have the default option
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('-- Choose a module --');
  });
});
