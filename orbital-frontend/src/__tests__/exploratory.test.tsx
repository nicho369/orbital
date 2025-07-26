import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import PlannerPage from '../pages/PlannerPage';
import HomePage from '../pages/HomePage';
import ModuleList from '../components/ModuleList';

// Mock Firebase to avoid authentication issues
jest.mock('../firebase', () => ({
  auth: {
    currentUser: { getIdToken: jest.fn().mockResolvedValue('test-token') },
    onAuthStateChanged: jest.fn(),
  },
  googleProvider: {},
}));

// EXPLORATORY TESTS
// These tests explore edge cases, unexpected behaviors, and boundary conditions
// They're designed to discover issues that weren't anticipated in requirements

describe('Exploratory Testing: Edge Cases and Boundary Conditions', () => {
  
  test('EXPLORATORY: What happens with extremely long module codes?', async () => {
    // Exploring: How does the system handle unexpected input lengths?
    
    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    const moduleInput = screen.getByPlaceholderText(/enter module code/i);
    
    // Test with absurdly long module code
    const veryLongModuleCode = 'A'.repeat(1000) + '123456789'.repeat(100);
    
    fireEvent.change(moduleInput, { target: { value: veryLongModuleCode } });
    
    // What happens to the UI? Does it break? Overflow?
    expect(moduleInput).toHaveValue(veryLongModuleCode);
    
    // Try to add it - what error handling occurs?
    const addButton = screen.getByRole('button', { name: /add module/i });
    fireEvent.click(addButton);
    
    // Exploring: Does the app crash or handle gracefully?
    await waitFor(() => {
      // We're exploring what actually happens - not asserting expected behavior
      const input = screen.getByPlaceholderText(/enter module code/i) as HTMLInputElement;
      console.log('Input value after long string:', input.value.length);
    });
  });

  test('EXPLORATORY: Special characters and injection attempts', () => {
    // Exploring: Security and input validation edge cases
    
    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    const moduleInput = screen.getByPlaceholderText(/enter module code/i);
    
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      '../../etc/passwd',
      'DROP TABLE modules;',
      '🎉🔥💯', // Unicode emojis
      'CS1010\nCS2030', // Newlines
      'CS1010\tCS2030', // Tabs
      '',  // Empty string
      '   ', // Just spaces
      'CS1010;rm -rf /', // Command injection attempt
    ];

    maliciousInputs.forEach((input, index) => {
      console.log(`Testing malicious input ${index + 1}: "${input}"`);
      
      fireEvent.change(moduleInput, { target: { value: input } });
      
      // Explore: How does the component handle these inputs?
      // Note: HTML text input elements strip newlines and normalize whitespace
      const expectedValue = input.replace(/[\n\r]/g, '').replace(/\s+/g, ' ').trim();
      if (expectedValue === '' && input.trim() === '') {
        // For empty/whitespace-only strings, expect exactly what was set
        expect(moduleInput).toHaveValue(input);
      } else if (input.includes('\n') || input.includes('\r')) {
        // For strings with newlines, they get stripped completely
        expect(moduleInput).toHaveValue(input.replace(/[\n\r]/g, ''));
      } else {
        expect(moduleInput).toHaveValue(input);
      }
      
      // Try clicking add button
      const addButton = screen.getByRole('button', { name: /add module/i });
      fireEvent.click(addButton);
      
      // What happens? Does it sanitize? Crash? Pass through?
    });
  });

  test('EXPLORATORY: Rapid clicking and race conditions', async () => {
    // Exploring: What happens with rapid user interactions?
    
    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );

    const addButton = screen.getByRole('button', { name: /add module/i });
    const saveButton = screen.getByRole('button', { name: /save plan/i });
    const loadButton = screen.getByRole('button', { name: /load plan/i });
    
    // Rapid fire clicking - can we break the state?
    for (let i = 0; i < 20; i++) {
      fireEvent.click(addButton);
      fireEvent.click(saveButton);
      fireEvent.click(loadButton);
    }
    
    // Exploring: Does the app maintain consistent state?
    // Are there race conditions in the async operations?
    await waitFor(() => {
      console.log('After rapid clicking - app still responsive?');
      expect(addButton).toBeInTheDocument();
    });
  });

  test('EXPLORATORY: Module list behavior with various network conditions', async () => {
    // Exploring: How does ModuleList behave under different scenarios?
    
    // First, test with completely failing fetch
    global.fetch = jest.fn().mockRejectedValue(new Error('Network failed'));
    
    render(<ModuleList />);
    
    await waitFor(() => {
      // Explore: What's the user experience when network fails?
      console.log('Network failure scenario completed');
    });
    
    // Test with slow response
    global.fetch = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        json: () => Promise.resolve([])
      }), 5000))
    );
    
    render(<ModuleList />);
    
    // Explore: How long does loading persist? Is there timeout handling?
    console.log('Testing slow network response...');
  });

  test('EXPLORATORY: Memory usage with large datasets', async () => {
    // Exploring: Performance with large amounts of data
    
    const largeModuleDataset = Array.from({ length: 10000 }, (_, i) => ({
      moduleCode: `CS${i.toString().padStart(4, '0')}`,
      title: `Generated Module ${i} with a very long title that might cause rendering issues`
    }));
    
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve(largeModuleDataset)
    });
    
    const startTime = performance.now();
    
    render(<ModuleList />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    const endTime = performance.now();
    console.log(`Large dataset rendering took: ${endTime - startTime}ms`);
    
    // Explore: How does the dropdown perform with 10k options?
    // Does it cause UI lag or memory issues?
  });

  test('EXPLORATORY: Browser back/forward button behavior', () => {
    // Exploring: Does the app handle browser navigation correctly?
    
    const historyMock = {
      back: jest.fn(),
      forward: jest.fn(),
      pushState: jest.fn(),
    };
    
    Object.defineProperty(window, 'history', {
      value: historyMock,
      writable: true,
    });
    
    render(
      <MemoryRouter initialEntries={['/', '/planner', '/']}>
        <HomePage />
      </MemoryRouter>
    );
    
    // Simulate browser back button
    fireEvent(window, new PopStateEvent('popstate'));
    
    // Explore: Does the app state remain consistent?
    // Are there any memory leaks or broken references?
    console.log('Browser navigation simulation completed');
  });

  test('EXPLORATORY: Simultaneous user sessions simulation', async () => {
    // Exploring: What if multiple instances of the app run simultaneously?
    
    const createUserSession = () => {
      return render(
        <MemoryRouter>
          <HomePage />
        </MemoryRouter>
      );
    };
    
    // Create multiple "user sessions"
    createUserSession();
    createUserSession();
    createUserSession();
    
    // Explore: Do they interfere with each other?
    // Are there any shared state issues?
    console.log('Multiple session simulation completed');
  });

  test('EXPLORATORY: Component lifecycle edge cases', () => {
    // Exploring: What happens during rapid mount/unmount cycles?
    
    // Instead of using unmount/rerender on the same instance, create new instances
    for (let i = 0; i < 10; i++) {
      const { unmount } = render(
        <MemoryRouter>
          <PlannerPage />
        </MemoryRouter>
      );
      
      // Clean unmount each instance
      unmount();
    }
    
    // Explore: Are there memory leaks? Cleanup issues?
    // Do event listeners get properly removed?
    console.log('Lifecycle stress test completed');
  });

  test('EXPLORATORY: What happens when localStorage is full?', () => {
    // Exploring: Browser storage limitations
    
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = jest.fn(() => {
      throw new Error('QuotaExceededError: localStorage is full');
    });
    
    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );
    
    // Try to trigger any localStorage usage
    const saveButton = screen.getByRole('button', { name: /save plan/i });
    fireEvent.click(saveButton);
    
    // Explore: Does the app handle storage errors gracefully?
    console.log('localStorage full scenario tested');
    
    // Restore original
    Storage.prototype.setItem = originalSetItem;
  });

  test('EXPLORATORY: Accessibility edge cases', () => {
    // Exploring: How accessible is the app really?
    
    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );
    
    // Test keyboard navigation
    const firstButton = screen.getByRole('button', { name: /add module/i });
    firstButton.focus();
    
    // Simulate tab navigation
    if (document.activeElement) {
      fireEvent.keyDown(document.activeElement, { key: 'Tab' });
      fireEvent.keyDown(document.activeElement, { key: 'Tab' });
    }
    
    // Explore: Can users navigate entirely with keyboard?
    // Are focus indicators visible and logical?
    
    // Test screen reader scenarios
    const selectElement = screen.getByLabelText(/select a semester/i);
    expect(selectElement).toHaveAttribute('aria-label', 'Select a semester');
    
    const inputElement = screen.getByLabelText(/enter module code/i);
    expect(inputElement).toHaveAttribute('aria-label', 'Enter module code');
    
    console.log('Accessibility exploration completed');
  });
});

// Exploratory test that logs findings for manual review
describe('Exploratory Findings Logger', () => {
  test('EXPLORATORY: Document unexpected behaviors found', () => {
    // This test is designed to capture and log any unexpected behaviors
    // discovered during exploratory testing for manual review
    
    const findings: string[] = [];
    
    // Log any console errors during testing
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      findings.push(`Console Error: ${args.join(' ')}`);
      originalConsoleError(...args);
    };
    
    // Run a basic render to catch any immediate issues
    render(
      <MemoryRouter>
        <PlannerPage />
      </MemoryRouter>
    );
    
    // Restore console
    console.error = originalConsoleError;
    
    // Log findings for manual review
    if (findings.length > 0) {
      console.log('=== EXPLORATORY TEST FINDINGS ===');
      findings.forEach((finding, index) => {
        console.log(`${index + 1}. ${finding}`);
      });
      console.log('=== END FINDINGS ===');
    }
    
    expect(true).toBe(true); // Always pass - this is for discovery
  });
});
