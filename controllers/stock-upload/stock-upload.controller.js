import stockUploadSingleLocation from '../../services/stock-upload/stock-upload.service.js'
const uploadDataSingleLocation=async (req,res)=>{

    try{

        const result=await stockUploadSingleLocation(req);
        res.status(200).json(result);
    }
    catch(error){

        res.status(201).json({error:error.message});
    }
}

export default uploadDataSingleLocation