const express = require('express')
const compression = require('compression')
const path = require('path')

const port = 9000;
const app = express()

const serverRootPath = path.join(__dirname, './dist')

app.use(compression())
app.use(express.static(serverRootPath, {
  // pass params if necessary
}))

app.get('*', (_, response) => {
   response.sendFile(path.resolve(serverRootPath, 'index.html'))
})

app.listen(port, () => {
  console.log(`server run on localhost:${port}`)
})