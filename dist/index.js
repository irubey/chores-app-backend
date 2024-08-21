"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// example index.ts file
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
//Middleware for logging
app.use((0, morgan_1.default)('combined'));
//Middleware for parsing JSON
app.use(express_1.default.json());
//Basic route
app.get('/', (req, res) => {
    res.send('Welcome to the Chore Management API!');
});
// POST route example
app.post('/some-endpoint', (req, res) => {
    const data = req.body; // Access the JSON payload
    res.json({ receivedData: data });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke - error log from middleware!');
});
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
