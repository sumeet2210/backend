import mongoose, {Schema} from "mongoose";
const subscriptionschema = new Schema({
    subscriber:{
        type: Schema.Types.ObjectId, // one who is subscribing
        ref:"Users"
    },
    channel:{
        type: Schema.Types.ObjectId, // one who is subscriber is subscribing

        ref:"Users"
    }
},{timestamps:true});
export const subscription = model("subscription",subscriptionschema);