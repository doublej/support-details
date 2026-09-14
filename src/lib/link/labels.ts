/**
 * The tables compact links index into. Links already sent depend on every position, so each
 * list is append-only: never reorder, remove or reword an entry. A new collector row goes in a
 * new group at the end of GROUPS (labels.ts).
 */

export const GROUPS: [section: string, labels: string[]][] = [
  // '' is the glance card (Report.summary).
  ['', ['Device', 'System', 'Browser', 'Screen', 'Time zone']],
  [
    'Device',
    [
      'Platform code',
      'Processor',
      'CPU cores',
      'Memory',
      'Battery',
      'Touch screen',
      'Main input',
      'Can hover',
    ],
  ],
  [
    'Browser',
    [
      'User agent',
      'Exact versions',
      'Cookies',
      'Do Not Track',
      'Global Privacy Control',
      'Built-in PDF viewer',
      'Opened as installed app',
    ],
  ],
  [
    'Screen',
    [
      'Screen size',
      'Screen in device pixels',
      'Pixel ratio',
      'Browser window',
      'Pinch zoom',
      'Orientation',
      'Color depth',
      'Color range',
      'HDR',
    ],
  ],
  [
    'Appearance & accessibility',
    [
      'Dark mode',
      'Text size',
      'Reduce motion',
      'Increase contrast',
      'Reduce transparency',
      'High contrast mode',
      'Inverted colors',
    ],
  ],
  [
    'Permissions & media',
    [
      'Camera access',
      'Microphone access',
      'Location access',
      'Camera found',
      'Microphone found',
      'Video formats it can play',
    ],
  ],
  [
    'Browser features',
    [
      'Graphics',
      'Graphics vendor',
      'WebGL 2',
      'WebGL',
      'WebGPU',
      'WebAssembly',
      'Local storage',
      'Storage quota',
      'Websites can work offline',
      'Notifications',
      'Passkeys',
      'Share menu',
      'Websites can use Bluetooth',
      'Websites can use USB',
    ],
  ],
  ['Network', ['Connection type', 'Connection quality (browser estimate)', 'Data saver']],
  [
    'Language & time',
    [
      'Time zone',
      'UTC offset',
      'Local time',
      'Clock accuracy',
      'Preferred languages',
      'Region format',
      'Number format',
      'Clock style',
      'Calendar',
    ],
  ],
]
