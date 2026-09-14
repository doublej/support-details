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

/** macReport as the release with JSON in token bytes ('t') wrote it, 14 Sep 2026. */
export const tokenLink =
  'tVU-7TkJBEP2VzdBYHG52ln3cLbGxNbEkFIYQomC8kfsBGmOnEWoq-AgSaysrvkhhZiEk5szu5MyZOTs7oHY2mk_uCXRz-wDT3o2m49Z0vCMMPIO2LlZR1C8OrrIKIXtCzXAJPQ9iraw5mqtLUmZ_CA4cINPPby_nuVdR348s5ZSq2sN8_OPiCisQazEK7Da5lj3oV47mUqpDJrA09eAkuHSzXkdY-AIVQgZ99ptmNoZZfLO5fnpcEoJKXS4dSTeuUtldeASfYBGjuMk3kwX9mYvdipDlIYusKUEjD4cH'

/** macReport as the release with deflated wire bytes ('b') wrote it, 14 Sep 2026. */
export const wireLink =
  'by1r-RJg_ODFXR6EkMzk7tURB2cTIRevoNiMzPbNTOw1NjfQMQPDg_yAZ5UOGBscWGpopuDsdMTQwOMkswHS2obURrqb5Xg-EbW5pbq5nYaKj0IvC52RkZGI-YWhqaLTI0sLo4N-DRhCOhaklN5-EGBMzDzMQMLKysjIx2VzodywoyEnVUZhw2FAhoCh_ogkTAxMTx3FDoHFABzAJMgEBozNzkPvRfwoa52dz5aeUCYkwAAA'

/** A real link written by the last release before compact links (headless Chrome, 14 Sep 2026). */
export const legacyLink =
  'zeJx9Vttu2zgQ_ZUBgQ0SlHEkx5fG-5Q4XSdonBix3exuYBRjamwTpkiVpJw6Rb-jH9QfW1CSb70s_GCboyHPnDlnqC9sxToxZ-hZh9Wjeus0ujiNG6O40TmPOufNWrMZ_cs408YT6zDGmcvTFO2adZ6f2TWtpCDGWR8Fm_BnNlw7TynjLEXxMIR6q9Yq1q-seXFkGWfdhTUpQdys16LwKdOEJdKMs7dRBN-_QSuKAD3E378V4ZFMCV6NDie9y63J6OwydZ5sgimbTDhzJLw02rHO8xfmpVcB6xZcOLuAO1DoZ8amIExSob7VnlRxyMAaQc6ZABJtyqHVOJ1KX8S6gzEIY8kxzuIScp9SY9eMs0sPitB5iFvQuyqrRe-pCMZR9AcHsUA7l3peFmNysQC3qfjelNuh1CB1lvuAy-SOwFjwFsUyw6QEgRoWZlWw-A85Npl85btqdwxvyx07soBz0uWer1IpPGvWIjjuo5DaG7f4EwoCoI8CHobwN8TRx7j5sX0Cl1mm6Imm76U_a563a-ctOH5_M-rfcVBySdAjsTQncEOYKHKubOvZtq0wxBlaWaUW-N99RuFhRdYVraqkIPO0EkP7ot2uvW1w6BkzVwQHSqmCJRHGLGXRiydjlxterw3cGw-jQBnjOlcqrPaUmaKCgZUrFGvoGu2tUbv4VS6VP5UaBtd_wUrSy45e_sweMtKUADqQ2nlUKvzJsqptB_xvJbylv1wBJ1_pQNl7igepISlkCpn8TMr9_OAgrINFL03Q076b4EXqxLwwztrNVshptC6qHC0W8GpMWiD1xU8qVfRgJWkftgtg71AnTmBGFbHKWEgo8wvGWX1P_0XAop6HUtxjpfOb68dfUXGZZYQWtSA4AhTBVXIqlfTrfXqu0S4hLY1YmWBEn_2Gr2uaYa48HAcLnRThR0pyQZCaCnyVdauFJXQEIjQXnd-FqgxvUbsMLWmx3gVv5HyxzfkBya1ekfWUgAiVu0ovB1UOyKbSFVqGI0gpkbhfXhdTsliVH6QqlQJ0y9LtUliTLYym3zxwZ0TRot-Eq81nJtfJTst7u_4Q-SATMhBGH3oH0oNADZnCwMZNrd5qcPgwuOBw-SHmcHM3BOctYVpY61dTBmaEPi_n4bbiJ5r27irBuTzLTCCwgBsig_Ger55oeukcpVO13lsNRStw3lgsdBbcXUaG5Rp8yo3HYqzW2pth-0RTJz25oqYXY5dgZjMli8tis_O98XImS0pdBRHdkhJYU6nwATq3pLXbSxou0BKkpPND5LvTwpS-Ujl5YwrH_Pah8fDql0P7nnxAfKAbo3V5m4FfZ7Tr4V7gU47BTXA8rdpBzssUPZ0wznrGJBxwanIPca3dhP5U-jO3XWpGkDpIKHS_mJvoERyW98pPXr5DPc8D9UfgZXpwm_7_rcyf2XjUDb1wFBw5HnXfRPVONdXKVlc79o2GIWUQNyC8gUDcKt89oNcfvYnqUQTHXQo2VVCegxqGeZqShYChHA5dZcQy2CW3WLi8a6wlUXXX0oyspQRUVU9oNOnT3hUH0qfjYfiqRsY8UFx6ZfNQKaI8nQbpbyIxr583eLPVrr292IPg_FpROT4XJreVXxXpBAPDc0vz8OIwmXydfP0PxmcEng'
