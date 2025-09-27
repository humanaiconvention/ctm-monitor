import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders vision heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /our vision/i })).toBeInTheDocument()
  })
})
