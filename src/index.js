// require('dotenv').config({path:'./env'});
import dotenv from "dotenv";
import connect from "./db/index.js";
dotenv.config({
    path:'./env'
})
connect();



// ;(async()=>{
//     try {
//      await  mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//      app.on("error",(err)=>{
//         console.log("error",err);
//         throw error
//      }); 
//      app.listen(process.env.PORT, ()=>{
//         console.log(`App is listening on port ${process.env.PORT}`);
//      })
//     } catch (error) {
//         console.error("error:",error);
//     }
// })()