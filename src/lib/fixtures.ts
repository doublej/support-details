import type { Report } from './report'

/** A full report as Chrome on a Mac produces it, for link format tests. */
export const macReport: Report = {
  v: 1,
  at: '2026-09-14T12:09:55.000Z',
  note: 'Sam, ticket #42',
  summary: [
    ['Device', 'Mac'],
    ['System', 'macOS 26.6'],
    ['Browser', 'Chrome 152.0.0.0'],
    ['Screen', '1512 × 982 at 2×'],
    ['Time zone', 'Europe/Amsterdam'],
  ],
  sections: [
    {
      title: 'Device',
      rows: [
        ['Platform code', 'MacIntel'],
        ['Processor', 'arm, 64-bit'],
        ['CPU cores', '10'],
        ['Memory', 'At least 16 GB'],
        ['Battery', '100%, charging'],
        ['Touch screen', 'No'],
        ['Main input', 'Mouse or trackpad'],
        ['Can hover', 'Yes'],
      ],
    },
    {
      title: 'Browser',
      rows: [
        [
          'User agent',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36',
        ],
        ['Exact versions', 'Chromium 152.0.7977.84, Google Chrome 152.0.7977.84'],
        ['Cookies', 'Working'],
        ['Do Not Track', null],
        ['Global Privacy Control', null],
        ['Built-in PDF viewer', 'Yes'],
        ['Opened as installed app', 'No'],
      ],
    },
    {
      title: 'Screen',
      rows: [
        ['Screen size', '1512 × 982'],
        ['Screen in device pixels', '3024 × 1964'],
        ['Pixel ratio', '2'],
        ['Browser window', '1512 × 859'],
        ['Pinch zoom', 'Not zoomed'],
        ['Orientation', 'Landscape'],
        ['Color depth', '30-bit'],
        ['Color range', 'Display P3'],
        ['HDR', 'Yes'],
      ],
    },
    {
      title: 'Appearance & accessibility',
      rows: [
        ['Dark mode', 'No'],
        ['Text size', 'Default (100%)'],
        ['Reduce motion', 'No'],
        ['Increase contrast', 'No'],
        ['Reduce transparency', 'No'],
        ['High contrast mode', 'No'],
        ['Inverted colors', null],
      ],
    },
    {
      title: 'Permissions & media',
      rows: [
        ['Camera access', 'Will ask'],
        ['Microphone access', 'Will ask'],
        ['Location access', 'Will ask'],
        ['Camera found', 'Yes'],
        ['Microphone found', 'Yes'],
        ['Video formats it can play', 'H.264, HEVC, VP9, AV1, HLS streaming'],
      ],
    },
    {
      title: 'Browser features',
      rows: [
        ['Graphics', 'ANGLE (Apple, ANGLE Metal Renderer: Apple M1 Pro, Unspecified Version)'],
        ['Graphics vendor', 'Google Inc. (Apple)'],
        ['WebGL 2', 'Yes'],
        ['WebGPU', 'Yes'],
        ['WebAssembly', 'Yes'],
        ['Local storage', 'Works'],
        ['Storage quota', '10.7 GB'],
        ['Websites can work offline', 'Yes'],
        ['Notifications', 'Not asked yet'],
        ['Passkeys', 'Yes'],
        ['Share menu', 'Yes'],
        ['Websites can use Bluetooth', 'Yes'],
        ['Websites can use USB', 'Yes'],
      ],
    },
    {
      title: 'Network',
      rows: [
        ['Connection type', null],
        ['Connection quality (browser estimate)', 'Good, 10+ Mbit/s, about 50 ms delay'],
        ['Data saver', 'No'],
      ],
    },
    {
      title: 'Language & time',
      rows: [
        ['Time zone', 'Europe/Amsterdam'],
        ['UTC offset', 'UTC+02:00'],
        ['Local time', 'Mon Sep 14 2026 14:09:55 GMT+0200 (Central European Summer Time)'],
        ['Clock accuracy', 'Correct'],
        ['Preferred languages', 'en-GB, en-US, en'],
        ['Region format', 'en-GB'],
        ['Number format', '1,234,567.89'],
        ['Clock style', '24-hour'],
        ['Calendar', 'gregory'],
      ],
    },
  ],
}
