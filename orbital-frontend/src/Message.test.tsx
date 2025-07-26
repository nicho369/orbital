import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Message from './Message';

describe('Message', () => {
  test('renders SoC GradWise heading', () => {
    render(<Message />);
    expect(screen.getByRole('heading', { name: /soc gradwise/i })).toBeInTheDocument();
  });

  test('renders as h1 element', () => {
    render(<Message />);
    const heading = screen.getByRole('heading', { name: /soc gradwise/i });
    expect(heading.tagName).toBe('H1');
  });

  test('displays correct text content', () => {
    render(<Message />);
    expect(screen.getByText('SoC GradWise')).toBeInTheDocument();
  });
});
