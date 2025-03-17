import express  from 'express'
import cors from 'cors'
import { connectDB, getPool1 } from './connection.js'
const app = express()
import appRoutes from './routes/index.js'
app.use(cors())
app.use(express.json());

// app.use('/api', (req, res, next) => {
//     console.log(`Received ${req.method} request for ${req.originalUrl}`); // Logs the method and URL of the request
//     next(); // Proceed to the next middleware/route handler
//   });

const PORT = process.env.PORT
connectDB()
.then(()=>{
    
    app.use('/api', appRoutes); 
    app.listen(PORT,()=>{
        console.log(`Server is runnning at PORT: ${PORT}`)
    })
})
.catch((err)=>{
    console.log(" connection failed",err);
})
// app.use('/api',appRoutes)


