import { getPool1 } from "../../connection"
import { readExcelFile, readExcelFileWithSubColumns } from "../utilities/utilities.service";

const stockUploadSingleLocation=async (req,res)=>{

    const pool=await getPool1();

    let brandId=req.body.brand_id;

    let locationID=req.body.location_id;
    let addedBy=req.body.user_id;
    
    let getMappingQuery=`select part_number,stock_qty,loc,stock_type from stock_upload_mapping where brand_id=@brandId`;

    const mappingResult=await pool.request().input('brandId',brandId).query(getMappingQuery);

    if(mappingResult.recordset.length==0){
        return {mappingNotPresent:true}
    }

    let mappedResult=mappingResult.recordset;
    let fileData;
    let headers;
    if(brandId==11 || brandId==33){

        fileData=await readExcelFileWithSubColumns(req.file.path);
        rowData=fileData.data.splice(2);
    }
    else{

        fileData=await readExcelFile(req.file.path);
        rowData=fileData.data.splice(1);
    }
     headers=fileData.headers;
     
     const filteredRowData = rowData.filter((row) => {
        // Normalize all headers to lowercase
        const availabilityHeader = Object.keys(headers).find(header => header.toLowerCase() === 'availability');
        const statusHeader = Object.keys(headers).find(header => header.toLowerCase() === 'status');
      
        if (brandId === 17 || brandId === 28 || brandId === 13) {
          // Ensure part_number is not empty, stock_qty is >= 0,
          // Availability is not 'on-hand', or status is 'good'
          return (row[mappedResult.part_number] && row[mappedResult.stock_qty] >= 0) &&
            (row[availabilityHeader] && row[availabilityHeader].toLowerCase().trim() !== 'on-hand' ||
             row[statusHeader] && row[statusHeader].toLowerCase().trim() === 'good');
        } else {
          // For other brands, just check part_number and stock_qty
          return row[mappedResult.part_number] || row[mappedResult.stock_qty] >= 0;
        }
      });
      
      console.log("filtered data without null",filteredRowData)
     
      let partMasterQuery=`select partnumber1 ,partID from part_master where brandId=@brandId`;
      
      const result=await pool.request().input('brandId',brandId).query(partMasterQuery);
      let partMasterResult=result.recordset;

      filteredRowData.forEach(async (item) => {
        let deleteItem = false;  // Flag to determine if the item should be deleted
        
        await Promise.all(partMasterResult.map(async (element) => {            
            if (item[mappedResult["part_number"]] !== element.partnumber1.trim()) {
                let partNotInMasterInsertQuery = `insert into part_not_in_master(part_number, brand_id) values(@partNumber, @brandId)`;
    
                try {
                    // Execute the insert query
                    await pool.request()
                        .input('partNumber', item[mappedResult["part_number"]])
                        .input('brandId', brandId)
                        .query(partNotInMasterInsertQuery);
                    
                    // If the insert succeeds, set the flag to delete the item
                    deleteItem = true;
                } catch (error) {
                    console.error('Error inserting part:', error);
                }
            }
        }));
    
        // After all insertions are done, remove the item from filteredRowData if necessary
        if (deleteItem) {
            const index = filteredRowData.indexOf(item);
            if (index !== -1) {
                filteredRowData.splice(index, 1);  // Remove the item from filteredRowData
            }
        }
    });
    
      
      console.log(filteredRowData);
    let rowCount=filteredRowData.length;
        let currentDate;
      let insertQueryForCurrentStock1=`insert into currentStock1(locationID,stockDate,added_by) output inserted.tcode values(@locationID,@currentDate,@addedBy)`;

     const result1= await pool.request().input('locationID',locationID).input('currentDate',currentDate).input('addedBy',addedBy).query(insertQueryForCurrentStock1);
     let tCode =result1.recordset.tcode;

      let logQuery=`insert into Stock_Upload_Logs(stockCode,addedBy, stockUploadCount) values(@tCode,@addedBy,@rowCount)`;
    
   
    if(hasNullOrEmptyPartNumberAndQuantity){
        return {partNumberAndQuantityNull:true}
    }
    


}

export default stockUploadSingleLocation