"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const User_ts_1 = __importDefault(require("../modals/User.ts"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const token_ts_1 = require("../utils/token.ts");
const registerUser = async (req, res) => {
    const { email, password, name, avatar } = req.body;
    try {
        let user = await User_ts_1.default.findOne({ email });
        if (user) {
            res.status(400).json({ success: false, message: "User already exists" });
            return;
        }
        user = new User_ts_1.default({ email, password, name, avatar });
        const salt = await bcryptjs_1.default.genSalt(10);
        user.password = await bcryptjs_1.default.hash(password, salt);
        await user.save();
        const token = (0, token_ts_1.generateToken)(user);
        res.json({
            success: true,
            token
        });
    }
    catch (error) {
        console.error('Error in registerUser:', error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User_ts_1.default.findOne({ email });
        if (!user) {
            res.status(400).json({ success: false, message: "Invalid Credentials" });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(400).json({ success: false, message: "Invalid Credentials" });
            return;
        }
        const token = (0, token_ts_1.generateToken)(user);
        res.json({
            success: true,
            token
        });
    }
    catch (error) {
        console.error('Error in registerUser:', error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
exports.loginUser = loginUser;
