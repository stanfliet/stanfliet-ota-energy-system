const express=require('express');
const cors=require('cors');
const helmet=require('helmet');
const compression=require('compression');
const morgan=require('morgan');
const path=require('path');
const { Pool } = require('pg');
require('dotenv').config({path: path.join(__dirname,'..','.env')});

const ai = require('./routes/ai');
const auth = require('./routes/auth');
const healthRoutes = require('./routes/healthRoutes');
const tariffRoutes = require('./routes/tariffRoutes');

const app=express();
const PORT=process.env.PORT||3001;

console.log('=== Stanfliet OTA API Starting ===');
console.log('Port:', PORT);
console.log('JWT_SECRET configured:', process.env.JWT_SECRET ? 'YES' : 'NO (using fallback)');
console.log('SUPABASE_URL configured:', process.env.SUPABASE_URL ? 'YES' : 'NO');
console.log('SUPABASE_SERVICE_KEY configured:', process.env.SUPABASE_SERVICE_KEY ? 'YES' : 'NO');
console.log('================================');

let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  app.set('dbPool', pool);
}

app.use(helmet({crossOriginResourcePolicy: {policy: 'cross-origin'}}));
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(s => s.trim()) 
    : ['http://localhost:5173', 'https://stanfliet-ota-energy-system.vercel.app'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true}));

app.get('/',(req,res)=>{
  res.json({name: 'Stanfliet OTA Energy System API',version: '1.0.0',status: 'operational'});
});

app.get('/api/v1/health',(req,res)=>{
  res.json({status: 'healthy',timestamp: new Date().toISOString(),uptime: process.uptime()});
});

app.use('/api/v1/ai',ai);
app.use('/api/v1/auth',auth);
app.use('/api/v1/health',healthRoutes);
app.use('/api/v1/tariffs',tariffRoutes);

app.use((req,res)=>{
  res.status(404).json({error: 'Route not found',path: req.originalUrl});
});

app.use((err,req,res,next)=>{
  console.error('Unhandled error:',err);
  res.status(500).json({error: 'Internal server error',message: err.message});
});

app.listen(PORT,'0.0.0.0',()=>{
  console.log('Stanfliet OTA API running on port ' + PORT);
  console.log('Environment: ' + (process.env.NODE_ENV||'development'));
});

module.exports=app;
