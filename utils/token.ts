import type { UserProps } from "../types.ts";
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

export const generateToken=(user:UserProps)=>{
    const payload={
        user:{
            id:user._id,
            email:user.email,
            name:user.name,
            avatar:user.avatar
        }
    };
    return jwt.sign(payload,process.env.JWT_SECRET as string,
        {expiresIn:'30d',
        });
}