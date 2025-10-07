import {Schema,model} from 'mongoose';

import type { UserProps } from '../types.js';

const UserSchema=new Schema<UserProps>({

    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    password:{
        type:String,
        required:true,
        minlength:6 
    },
    name:{
        type:String,
        required:true,
        trim:true
    },
    avatar:{   
        type:String,
        default:""
    },
    created:{
        type:Date,
        default:Date.now
    }


});

export default model<UserProps>('User',UserSchema);