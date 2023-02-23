const connect = require('connect')
const serveStatic = require('serve-static')
const glob = require('glob')
const path = require('path')

connect()
  .use(serveStatic(__dirname + '/'))
  .listen(8080, () => {
    glob('**/*.html', (_, files) => {
      files.forEach((file) => {
        const dirname = path.dirname(file)
        const url = new URL(dirname, 'http://localhost:8080')
        console.log(url.href)
      })
    })
  })
