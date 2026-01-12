# Pelicula [![License][LicenseIMGURL]][LicenseURL] [![NPM version][NPMIMGURL]][NPMURL] [![Build Status][BuildStatusIMGURL]][BuildStatusURL] [![Coverage Status][CoverageIMGURL]][CoverageURL]

[NPMIMGURL]: https://img.shields.io/npm/v/pelicula.svg?style=flat
[BuildStatusURL]: https://github.com/putoutjs/pelicula/actions/workflows/nodejs.yml "Build Status"
[BuildStatusIMGURL]: https://github.com/putoutjs/pelicula/actions/workflows/nodejs.yml/badge.svg
[LicenseIMGURL]: https://img.shields.io/badge/license-MIT-317BF9.svg?style=flat
[NPMURL]: https://npmjs.org/package/pelicula "npm"
[LicenseURL]: https://tldrlegal.com/license/mit-license "MIT License"
[CoverageURL]: https://coveralls.io/github/putoutjs/pelicula?branch=master
[CoverageIMGURL]: https://coveralls.io/repos/putoutjs/pelicula/badge.svg?branch=master&service=github

<img width="600" height="953" alt="image" src="https://github.com/user-attachments/assets/a6296d52-d053-4fe8-a615-c4733b7c1b40" />

🎬 **Pelicula** 🐊Putout-compatible patterns-based linter.

## Install

```
npm i pelicula --save
```

## API

```js
import {lint} from 'pelicula';

const [code, places] = lint(source, {
    plugins: [
        'remove-debugger',
    ],
});
```

## License

MIT
