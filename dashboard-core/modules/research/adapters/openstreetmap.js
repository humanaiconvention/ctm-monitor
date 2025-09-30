export function registerOpenStreetMap(context = {}) {
  return {
    id: 'openstreetmap',
    name: 'OpenStreetMap',
    kind: 'geospatial-data',
    description: 'Collaboratively edited free map of the world.',
    license: 'ODbL',
    supports: { tileAccess: true, fetchFeature: true },
    activate: async () => ({ active: true, note: 'Placeholder activation for OpenStreetMap' }),
    context
  };
}
