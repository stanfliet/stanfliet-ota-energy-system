// Minimal stub for mapbox-gl so build does not fail when the package is not installed in CI.
// This provides a very small compatible surface for code that imports mapbox-gl at build time.
export default {
  Map: function() { /* stub */ },
  accessToken: ''
}
