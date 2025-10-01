import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import App from '../App'

// Mock stateful banner/gate components to avoid act() warnings unrelated to logo rendering.
vi.mock('../components/AuthBanner', () => ({ __esModule: true, default: () => null }))
vi.mock('../components/PasswordGate', () => ({ __esModule: true, default: (p: { children: React.ReactNode }) => <>{p.children}</> }))

describe('Hero Logo', () => {
  it('renders the HumanAI Convention logo with aria-label', () => {
    // Render app; intro sequence may gate content. Ensure localStorage flag to skip intro.
    try { localStorage.setItem('hq:introComplete', 'true') } catch { /* ignore */ }
    render(<App />)
  const logo = screen.getByLabelText(/HumanAI Convention logo/i)
  expect(logo).toBeTruthy()
  // Ensure logo SVG contains a <title> element for accessibility
  const titleEl = logo.querySelector('title')
  expect(titleEl?.textContent).toMatch(/HumanAI Convention/i)
  })
})
