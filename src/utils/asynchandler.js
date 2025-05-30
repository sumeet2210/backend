const asynchandler = (requesthandler)=>{
    (req,res,next)=>{
        Promise.resolve(requesthandler(req,res,next))
        .catch((error)=>next(error))
    }
}
export {asynchandler};

// const asynchandler = (fn)=> async (req,res,next)=>{
// try {
//     await fn(req,res,next);
// } catch (error) {
//     res.status(error.code || 500).json({
//         success: false,
//         message: error.message
//     })
// }
// }