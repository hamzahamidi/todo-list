module.exports = {
    copyAssets: {
        src: ['{{SRC}}/assets/**/*'],
        dest: '{{WWW}}/assets'
    },
    copyFakeData: {
        src: ['{{SRC}}/api/**/*'],
        dest: '{{WWW}}/api'
    },
    copyIndexContent: {
        src: ['{{SRC}}/index.html', '{{SRC}}/manifest.json', '{{SRC}}/service-worker.js'],
        dest: '{{WWW}}'
    },
    copyFonts: {
        src: ['{{ROOT}}/node_modules/ionicons/dist/fonts/**/*', '{{ROOT}}/node_modules/ionic-angular/fonts/**/*'],
        dest: '{{WWW}}/assets/fonts'
    },
    copyPolyfills: {
        src: ['{{ROOT}}/node_modules/ionic-angular/polyfills/polyfills.js'],
        dest: '{{BUILD}}'
    },
    copySwToolbox: {
        src: ['{{ROOT}}/node_modules/sw-toolbox/sw-toolbox.js'],
        dest: '{{BUILD}}'
    }
}