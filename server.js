const express = require('express')
const app = express()

// Create the server for the frontend
app.use(express.static('public'))

// Run it on port 3000
app.listen(3000, () => {
    console.log('Server Running on port 3000')
})
