/**
 * Keyboard-only "skip to main content" link. Visually hidden until focused,
 * lets keyboard and screen-reader users jump past the navigation. Targets the
 * element with id="main-content" that page layouts expose.
 */
export function SkipLink() {
  return (
    <a href="#main-content" className="skip-link">
      Skip to main content
    </a>
  )
}
