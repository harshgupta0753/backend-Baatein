"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const db_ts_1 = __importDefault(require("./config/db.ts"));
const auth_routes_ts_1 = __importDefault(require("./routes/auth.routes.ts"));
const socket_ts_1 = require("./socket/socket.ts");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use('/auth', auth_routes_ts_1.default);
app.get('/', (req, res) => {
    res.send('Server is running');
});
const PORT = process.env.PORT || 3000;
const server = http_1.default.createServer(app);
(0, socket_ts_1.initializeSocket)(server);
(0, db_ts_1.default)().then(() => {
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error('Database connection failed:', error);
    throw error;
});
