//importation des modules
require('dotenv').config()
const http = require('http')
const app = require('./app')


app.set(process.env.PORT || 3002)

const server = http.createServer(app)
 
server.listen(process.env.PORT,()=>{
    console.log('Server en marche sur PORT:',process.env.PORT) 
})
  


