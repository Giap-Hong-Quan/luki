import 'dotenv/config';
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import 'colors';
import Logger from './utils/logging.js';
import connectDB from "./config/db.js";
import router from "./routes/index.js";
import { seedData } from "./config/seeData.js";
import { swaggerDocs } from './config/swagger.js';
import { errorHandle } from './middlewares/errorMiddleware.js';

const app = express();
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
// Middleware bắt log HTTP request có màu chuẩn app.apis
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const logMsg = `${ip}: ${req.method.toUpperCase()} ${req.originalUrl} --> ${statusCode} (${duration}ms)`;

        if (statusCode <= 304) {
            Logger.info(logMsg.green);
        } else {
            Logger.error(logMsg.red);
        }
    });
    next();
});
connectDB();
seedData();
swaggerDocs(app);
app.use('/v1/api',router);
app.use(errorHandle);
const port = process.env.PORT || 8000;
app.listen(port,()=>{
    console.log(`Runnig with ${port}`)
})