const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session')
const companion = require('@uppy/companion')

const app = express()

// Companion requires body-parser and express-session middleware.
// You can add it like this if you use those throughout your app.
//
// If you are using something else in your app, you can add these
// middlewares in the same subpath as Companion instead.
app.use(bodyParser.json())
app.use(session({ secret: 'MY_COMPANION_SECRET' }))

const options = {
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
    },
    server: {
        host: 'localhost:3020',
        protocol: 'https',
        // This MUST match the path you specify in `app.use()` below:
        path: '/companion',
    },
    secret: "MY_COMPANION_SECRET",
    filePath: 'D:/Work/storage/',
}

const { app: companionApp } = companion.app(options)

app.use('/companion', companionApp)