import {stockUploadSingleLocation,getPartNotInMasterSingleLocationInService,
    getAllRecordsSingleLocation,getUploadedDataSingleLocationInService} from '../../services/stock-upload/stock-upload.service.js'
const uploadDataSingleLocation=async (req,res)=>{

    try{

        const result=await stockUploadSingleLocation(req);
        res.status(200).json(result);
    }
    catch(error){

        res.status(201).json({error:error.message});
    }
}

const allRecordsSingleLocation=async (req,res)=>{
    try{

        const result=await getAllRecordsSingleLocation(req.body);
        res.status(200).json({data:result});
    }
    catch(error){

        res.status(201).json({error:error.message});
    }
}

const getPartNotInMasterSingleLocation=async (req,res)=>{
    try{

        const result=await getPartNotInMasterSingleLocationInService(req.body);
        res.status(200).json({data:result});
    }
    catch(error){

        res.status(201).json({error:error.message});
    }
}

const uploadedDataSingleLocation=async(req,res)=>{
    try{

        const result=await getUploadedDataSingleLocationInService(req.body);
        res.status(200).json({data:result});
    }
    catch(error){

        res.status(201).json({error:error.message});
    }
}
export  {uploadDataSingleLocation,allRecordsSingleLocation,getPartNotInMasterSingleLocation,uploadedDataSingleLocation}