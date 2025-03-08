import { getPool1 } from "../../connection.js"
import { readExcelFile, readExcelFileWithSubColumns } from "../utilities/utilities.service.js";
import sql from 'mssql';
const stockUploadSingleLocation=async (req,res)=>{

    const pool=await getPool1();

    // let brandId=req.body.brand_id;

    let locationId=req.body.location_id;
    let addedBy=req.body.user_id;
    let rowData;
    let getDealerAndLocationQuery=`select dealerId,brandId from locationInfo where locationId=@locationId`;

    const result23=await pool.request().input('locationId',locationId).query(getDealerAndLocationQuery);
    // console.log("get dealer and loc id ",result23)
   let brandId=result23.recordset[0].brandId;
    let dealerId=result23.recordset[0].dealerId;
    
    let getMappingQuery=`select part_number,stock_qty,loc,stock_type from stock_upload_mapping where brand_id=@brandId and stock_type='current'`;

    const mappingResult=await pool.request().input('brandId',brandId).query(getMappingQuery);

    if(mappingResult.recordset.length==0){
        return {mappingNotPresent:true}
    }

    let mappedData=mappingResult.recordset[0];
    let fileData;
    let headers;
    let rowDataArray;
    if(brandId==11 || brandId==33){

        fileData=await readExcelFileWithSubColumns(req.file.path);
        // rowData=fileData.data.splice(2);
        rowDataArray=fileData.data.splice(1);
    }
    else{

        fileData=await readExcelFile(req.file.path);
        // rowData=fileData.data.splice(1);
        rowDataArray=fileData.data
    }
     headers=fileData.headers;

      rowData = rowDataArray.map(rowData1 => ({
        part_number: rowData1[mappedData.part_number],
        qty: rowData1[mappedData.stock_qty],
        availability:rowData1['availability'],
        status:rowData1['status'],
      }));

    //  console.log("mapped data ",mappedResult)
     let filteredRowData = rowData.filter((row) => {
        // Normalize all headers to lowercase
        const availabilityHeader = Object.keys(headers).find(header => header.toLowerCase() === 'availability');
        const statusHeader = Object.keys(headers).find(header => header.toLowerCase() === 'status');
      
        if (brandId === 17 || brandId === 28 || brandId === 13) {
          // Ensure part_number is not empty, stock_qty is >= 0,
          // Availability is not 'on-hand', or status is 'good'
          return (row.part_number && row.part_number >= 0) &&
            (row[availabilityHeader] && row[availabilityHeader].toLowerCase().trim() !== 'on-hand' ||
             row[statusHeader] && row[statusHeader].toLowerCase().trim() === 'good');
        } else {
          // For other brands, just check part_number and stock_qty
          return row.part_number || row.qty >= 0;
        }
      });
      
    //   console.log("filtered data without null",filteredRowData.length)
     
      let partMasterQuery=`select partnumber1 ,partID from part_master where brandId=@brandId`;
      
      const result=await pool.request().input('brandId',brandId).query(partMasterQuery);
      let partMasterResult=result.recordset;
      let partNotInMasterArray=[];
    //   console.log(partMasterResult)

    //  filteredRowData.forEach( (item) => {
    //     let deleteItem = false;  // Flag to determine if the item should be deleted
        
    //     partMasterResult.map( (element) => {            

    //     if (item.part_number === element.partnumber1.trim()) {
    //         // Add the partid to the item if a match is found
    //         // console.log(element);
            
    //        item={...item, partId :element.partID};  // Assuming the 'partid' field is available in partMasterResult
    //         //console.log(item)
    //         // Reset deleteItem flag as match was found
    //         deleteItem = false;
    //     } else {
    //         // If no match, handle the case where item doesn't exist in partMasterResult
    //         const partnumber = item.part_number;
    //         const exists = partNotInMasterArray.some(item1 => item1.partNumber === partnumber);
    //         if (!exists) {
    //             partNotInMasterArray.push({partNumber: partnumber});
    //         }
    //         deleteItem = true;
    //     }
    //     });
    
    //     // After all insertions are done, remove the item from filteredRowData if necessary
    //     if (deleteItem) {
    //         const index = filteredRowData.indexOf(item);
    //         if (index !== -1) {
    //             filteredRowData.splice(index, 1);  // Remove the item from filteredRowData
    //         }
    //     }
        
    // });
    const itemsToDelete = [];
    const updatedFilteredRowData=[]
    for (const item of filteredRowData) {
        let deleteItem = false;  // Flag to determine if the item should be deleted

        // Loop over the partMasterResult to find a match
        for (const element of partMasterResult) {
            if (item.part_number === element.partnumber1.trim()) {
                // Add the partid to the item if a match is found
                item.partId = element.partID;  // Directly mutate the original item
                updatedFilteredRowData.push(item);
                // Reset deleteItem flag as match was found
                deleteItem = false;
                break; // Exit the loop after finding the match
            }
            else{
                deleteItem=true;
            }
        }

        // If no match was found, flag for deletion and add to partNotInMasterArray
        if (deleteItem) {
            const partnumber = item.part_number;
            const exists = partNotInMasterArray.some(item1 => item1.partNumber === partnumber);
            if (!exists) {
                partNotInMasterArray.push({ partNumber: partnumber });
            }
        }

        //     // Mark the item for deletion
        //     itemsToDelete.push(item);
        // }
    }

    // // After processing, remove the flagged items from filteredRowData
    // filteredRowData = filteredRowData.filter(item => !itemsToDelete.includes(item));
   

    
      
    //   console.log("filtered row data ",partNotInMasterArray);
    let rowCount=updatedFilteredRowData?.length;
    let currentDate = new Date();
    const formattedDate = currentDate.toISOString().split('T')[0]; // Outputs: '2025-03-08'
    // console.log(formattedDate);
      let insertQueryForCurrentStock1=`insert into currentStock1(locationID,stockdate,addedby) output inserted.tcode values(@locationID,@formattedDate,@addedBy)`;

     const result1= await pool.request().input('locationID',locationId).input('formattedDate',formattedDate).input('addedBy',addedBy).query(insertQueryForCurrentStock1);
     let tCode =result1.recordset[0].tcode;

    //  console.log("tCode ",tCode)

 const values = partNotInMasterArray.map(item => {
               
                return [
                    parseInt(brandId, 10),  // Ensure brandId is an integer
                   item["partNumber"],
            ]
            })
            try {
                const table = new sql.Table('part_not_in_master'); // Updated table name
                table.create = false;
            
                table.columns.add('brand_id', sql.Int, { nullable: true }); 
                table.columns.add('partnumber', sql.VarChar(100), { nullable: true });            
                // Add rows to the table
                values.forEach((row) => {
                    table.rows.add(
                        row[0],
                        row[1],  // brandid

                    );
                });
                await pool.request().bulk(table);
                
               
            } catch (error) {
                console.error('Error during bulk insert: part not in master', error);
                return error; // Rethrow the error for further handling if necessary
            }

            // console.log(filteredRowData[0])
            const values1 = updatedFilteredRowData.map(item => {
               
                return [
                    
                    parseInt(tCode,10),
                    item["part_number"],
                    parseFloat(item["qty"]),
                   item["partId"]
                  
    
            ]
            })
            //  console.log("values 1 ",values1[0])
            //  values1[0].forEach((item, index) => {
            //     console.log(`Element ${index} is of type: ${typeof item}`);
            // });

            try {
                const table1 = new sql.Table('currentStock2'); // Updated table name
                table1.create = false;
            
                table1.columns.add('StockCode', sql.BigInt, { nullable: true });
                table1.columns.add('PartNumber', sql.VarChar(35), { nullable: true });
                table1.columns.add('Qty', sql.Decimal(18,2), { nullable: true }); 
                table1.columns.add('PartID', sql.Int, { nullable: true });            
                // Add rows to the table
                values1.forEach((row) => {
                    table1.rows.add(
                        row[0],
                        row[1],  // brandid
                        row[2],
                        row[3]

                    );
                });
                await pool.request().bulk(table1);
                
               
            } catch (error) {
                console.error('Error during bulk insert:', error);
                return error; // Rethrow the error for further handling if necessary
            }
      let logQuery=`insert into Stock_Upload_Logs(stockCode,added_by,brand_id, stockUploadCount,operation_type) values(@tCode,@addedBy,@brandId,@rowCount,'upload stock')`;
        await pool.request().input('tCode',tCode).input('addedBy',addedBy)
        .input('brandId',brandId).input('rowCount',rowCount).query(logQuery);
   
    // if(hasNullOrEmptyPartNumberAndQuantity){
    //     return {partNumberAndQuantityNull:true}
    // }
    


}

const getPartNotInMasterSingleLocationInService=async (req,res)=>{
    try{
        const pool=await getPool1();

        let locationId=req.location_id;

        let getBrandQuery=`Select brandId from locationInfo where locationId=@locationId`;
        const result=await pool.request().input('locationId',locationId).query(getBrandQuery);
        let brandId=result.recordset[0].brandId;
        let getQuery=`Select partnumber from part_not_in_master where brand_id=@brandId`;
        const result1=await pool.request().input('brandId',brandId).query(getQuery);

        return result1.recordset;
    }
    catch(error){
        console.log("error in service ",error.message)
        return error;
    }
}


const getAllRecordsSingleLocation=async (req,res)=>{

    try{
        const pool=await getPool1();
        let locationId=req.location_id;
        let getQuery=`select ck2.partnumber,ck2.qty from currentStock2 ck2 join 
        currentStock1 ck1 on ck1.tcode=ck2.StockCode where locationId=@locationId`;

        const result=await pool.request().input('locationId',locationId).query(getQuery);

        return result.recordset;

    }
    catch(error){
        console.log("error in service ",error.message)
        return error;
    }
}
export  {stockUploadSingleLocation,getPartNotInMasterSingleLocationInService,getAllRecordsSingleLocation}