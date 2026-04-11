const express = require('express')
const bodyParser = require('body-parser')
const session = require('express-session')
const companion = require('@uppy/companion')

const app = express()
const HOST_URL = process.env.HOST_URL;

app.use(bodyParser.json())
app.use(session({
  secret: 'some-secret',
  resave: true,
  saveUninitialized: true,
}))

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  next()
})

// Routes
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/plain')
  res.send('Welcome to Companion')
})

// initialize uppy
const companionOptions = {
  providerOptions: {
    drive: {
      key: process.env.GOOGLEDRIVE_KEY,
      secret: process.env.GOOGLEDRIVE_SECRET,
    },
    dropbox: {
      key: process.env.DROPBOX_KEY,
      secret: process.env.DROPBOX_SECRET,
    },
    onedrive: {
      key: process.env.ONEDRIVE_KEY,
      secret: process.env.ONEDRIVE_SECRET,
    }
    // you can also add options for additional providers here
  },
  uploadUrls: [
    /.*/
  ],
  server: {
    // host: `${HOST_URL}:3020`, //dev
    host: `${HOST_URL}/wsup`, //Production
    protocol: 'https',
  },
  filePath: 'uploads',
  secret: 'some-secret',
  debug: true,
}

const { app: companionApp } = companion.app(companionOptions)
app.use(companionApp)

// handle 404
app.use((req, res) => {
  return res.status(404).json({ message: 'Not Found' })
})

// handle server errors
app.use((err, req, res) => {
  console.error('\x1b[31m', err.stack, '\x1b[0m')
  res.status(err.status || 500).json({ message: err.message, error: err })
})

companion.socket(app.listen(3020))

console.log('Welcome to Companion!')
console.log(`Listening on http://0.0.0.0:${3020}`)
