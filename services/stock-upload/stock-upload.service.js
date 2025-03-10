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
      const deletePartNumberQuery=`delete from part_not_in_master where brand_id=@brandId`;
      await pool.request().input('brandId',brandId).query(deletePartNumberQuery)
    const itemsToDelete = [];
    let updatedFilteredRowData=[]
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
            // console.log("partnumber ",partnumber)
            const exists = partNotInMasterArray.some(item1 => item1.partNumber === partnumber);
            if (!exists) {
                partNotInMasterArray.push({ partNumber: partnumber });
            }
        }

       
    }
    // filteredRowData = filteredRowData.filter(item => !itemsToDelete.includes(item));

    // Create a map to track the occurrences of part_number and total stock_qty
const partCountMap = new Map();

// First, count the occurrences and accumulate stock_qty for each part_number
for (const element of updatedFilteredRowData) {
    // Assuming partMasterResult contains part_number and stock_qty
    if (partCountMap.has(element.part_number)) {
        // console.log("part ",element);
        partCountMap.set(element.part_number, {
           
            partId:element.partId,
            count: partCountMap.get(element.part_number).count + 1,
            stockQty: parseFloat(partCountMap.get(element.part_number).stockQty) + parseFloat(element.qty)
        });
        
    } else {
        partCountMap.set(element.part_number, { count: 1, stockQty: parseFloat(element.qty),partId:element.partId });
    }
}

// console.log("updated filtered data ",partCountMap)
updatedFilteredRowData = Array.from(partCountMap, ([partNumber, { stockQty,partId }]) => ({
    partNumber,
    qty: stockQty,
    partId:partId
  }));
//   console.log("updated filtered data ",partCountMap);


 
  let insertedDataQuery=`Select partID,qty,ck2.StockCode from currentStock2 ck2  join currentStock1 ck1 on ck2.StockCode=ck1.tcode where locationId=@locationId`;

  let result56=await pool.request().input('locationId',locationId).query(insertedDataQuery);
 let insertedDataResult=result56.recordset;
 let countPrevRecords=insertedDataResult.length;

 let quantitySumPrev=0;
 if(insertedDataResult.length!=0){
    // console.log("countRecords inserted ",countPrevRecords)
    let StockCode=insertedDataResult[0].StockCode;
    let quanitySumQuery=`Select sum(qty) as QuantSum from currentStock2 where StockCode=@StockCode`;

    let result567=await pool.request().input('StockCode',StockCode).query(quanitySumQuery);
   
    if(result567.recordset.length!=0){
        quantitySumPrev=result567.recordset[0].QuantSum;
        // console.log("quant sum prev ",quantitySumPrev);
        let deleteQuery=`delete from currentStock2  where StockCode=@stockCode`;
        await pool.request().input('stockCode',insertedDataResult[0].StockCode).query(deleteQuery);
       
        let deleteQuery1=`delete from currentStock1  where tcode=@stockCode`;
        await pool.request().input('stockCode',insertedDataResult[0].StockCode).query(deleteQuery1);
    }
    
   
   
    // console.log("updatedFiltered ",updatedFilteredRowData)
   updatedFilteredRowData.forEach((item) => {
    // console.log(item)
    let partID = item.partId;
    let qty=item.qty;
    
    for (let i = 0; i < insertedDataResult.length; i++) {
        const element = insertedDataResult[i];
        // console.log(element,partID)
        if (element.partID === partID) {
            // Add the qty to the item.qty
            item.qty = qty + element.qty;
            break;  // Exit the loop after the first match
        }
    }
});

//  console.log("after update ",updatedFilteredRowData);

      
    //   console.log(updatedFilteredRowData);
 }


// Log the updated partCountObj
//  console.log(updatedFilteredRowData);

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
                    item["partNumber"],
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
            let currentCountQuery=`select sum(qty) as currentQuantSum from currentStock2 where stockCode=@tCode`;
            let result678=await pool.request().input('tCode',tCode).query(currentCountQuery);
            let currentQuantSum=0;
            if(result678.recordset.length!=0){
                currentQuantSum=result678.recordset[0].currentQuantSum;
            }
            
      let logQuery=`insert into Stock_Upload_Logs(location_id,stockCode,added_by,brand_id, stockUploadCount,operation_type,quantitySum,
      prevStockUploadCount,prevQuantitySum) values(@locationId,@tCode,@addedBy,@brandId,@rowCount,'upload stock',@currentQuantSum,@countPrevRecords,@quantitySumPrev)`;
        await pool.request().input('tCode',tCode).input('addedBy',addedBy).input('currentQuantSum',currentQuantSum)
        .input('brandId',brandId).input('locationId',locationId).input('rowCount',rowCount).input('quantitySumPrev',quantitySumPrev).input('countPrevRecords',countPrevRecords).query(logQuery);
   
  return {currentSumQuantity:currentQuantSum,prevSumQuantity:quantitySumPrev,currentRecords:rowCount,prevRecords:countPrevRecords}
    


}

const getPartNotInMasterSingleLocationInService=async (req,res)=>{
    try{
        const pool=await getPool1();

        let locationId=req.location_id;

        let getBrandQuery=`Select brandId from locationInfo where locationId=@locationId`;
        const result=await pool.request().input('locationId',locationId).query(getBrandQuery);
        let brandId=result.recordset[0].brandId;
        // console.log(brandId);
        let getQuery=`Select partnumber from part_not_in_master where brand_id=@brandId`;
        const result1=await pool.request().input('brandId',brandId).query(getQuery);
        // console.log(result1.recordset)
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
        let getQuery=`select added_on,added_by,stockUploadCount,quantitySum,prevQuantitySum,prevStockUploadCount from stock_upload_logs where location_id=@locationId`;

        const result=await pool.request().input('locationId',locationId).query(getQuery);

        return result.recordset;

    }
    catch(error){
        console.log("error in stock upload service in getAll records single loc",error.message)
        return error;
    }
}

const getUploadedDataSingleLocationInService=async(req,res)=>{
    try{
        const pool=await getPool1();
        let locationId=req.location_id;
        let getQuery=`select ck2.partnumber,ck2.qty from currentStock2 ck2 join 
        currentStock1 ck1 on ck1.tcode=ck2.StockCode where locationId=@locationId`;

        const result=await pool.request().input('locationId',locationId).query(getQuery);

        return result.recordset;

    }
    catch(error){
        console.log("error in  stock upload service get upload data single location",error.message)
        return error;
    }
}
export  {stockUploadSingleLocation,getPartNotInMasterSingleLocationInService,getAllRecordsSingleLocation,getUploadedDataSingleLocationInService}