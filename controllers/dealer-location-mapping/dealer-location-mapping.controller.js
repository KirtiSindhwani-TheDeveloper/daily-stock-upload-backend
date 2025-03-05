
import addDealerLocationMappingInService from '../../services/dealer-location-mapping/dealer-location-mapping.service.js';
const addDealerLocationMapping=async (req,res)=>{

    try{
        
        const result= await addDealerLocationMappingInService(req);
        res.status(200).json({data:result});
        
    }
    catch(error){
        res.status(201).json({message:error.message})
    }
}

export default addDealerLocationMapping