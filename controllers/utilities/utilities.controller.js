
import {getBrands,uploadFile} from '../../services/utilities/utilities.service.js'
export const getBrandsInController=async (req,res)=>{

    try{
        const brands=await getBrands();
        res.status(200).json({data:brands});
    }
    catch(error){
        console.error('Error in getBrands controller:', error.message);

       if (!res.headersSent) {
            res.status(500).json({ message: 'An error occurred while fetching brands.', error: error.message });
        } else {
            console.error('Headers already sent');
        }
    }

}

export const uploadFileInController=async (req,res)=>{

    try{
      
         // console.log("req ",req.body,req.file)
        const headers=await uploadFile(req);
        res.status(200).json({data:headers});
    }
    catch(error){
        console.error('Error in upload File controller:', error.message);
        res.status(500).json({ message: 'An error occurred while uploading the file.', error: error.message });
    }

}

