import { getPool1 } from "../../connection.js"
import {readExcelFileWithSubColumns,readExcelFile} from '../utilities/utilities.service.js'
const addDealerLocationMappingInService=async (req,res)=>{
    try{
        let brandId=req.body.brand_id;
        let fileData;
        let rowData;
        let rowCount;
        let headers;
        let userId=req.body.added_by;
        let filePath=req.file.path;
        isDealerAndLocationExist=true;
        if(brandId==33 || brandId ==11){
            fileData=await readExcelFileWithSubColumns(filePath)
            
        }
        else{
            fileData=await readExcelFile(filePath)
        }

        headers=fileData.headers;
        rowData=fileData.data;
        rowCount=fileData.length;

        const  lowerCaseHeaders=headers.map((header)=> header.trim().toLowerCase());

        if(!lowerCaseHeaders.includes('dealer') && !lowerCaseHeaders.includes('location')){
            isDealerAndLocationExist=false
            return {isDealerAndLocationPresent:isDealerAndLocationExist};
        }
         let isDealerAndLocationNull=await checkFields(rowData);

         if(isDealerAndLocationNull){
            return {isDealerAndLocationPresent:isDealerAndLocationNull}
         }

         let getDealerAndLocationQuery='Select dealer,location,dealerid,locationid from locationInfo where status=1 and dealerStatus=1';
         const dealerAndLocationResult=await pool.request().query(getDealerAndLocationQuery);

         let dealerLocationNotInMaster=[];

         rowData.forEach((row)=>{

            const normalizedItem=Object.keys(row).reduce((acc,key)=>{
                acc[key.trim().toLowerCase()]=item[key];
                return acc
            },{});

            dealerAndLocationResult.forEach((data)=>{

                if(normalizedItem['dealer']!=data.dealer || normalizedItem['location']!=data.location){
                    dealerLocationNotInMaster.push({
                        dealer:data.dealer,
                        location:data.location
                    })
                }
            })

            if(dealerLocationNotInMaster.length!=0){
                return {dealerLocationNotInMasterPresent:true}
            }


            const values = rowData.map(item => {
               
                return [
               brandId,
               item["dealer"],
               item["inventory location"],
               item["locationId"],
               item["added_by"],
               item["added_on"],
               "create dealer location mapping"

            ]
            })
        
            const table = new sql.Table('Dealer_Location_Mapping'); // Updated table name
            table.create = false;
        
            // Define columns based on your new schema
            table.columns.add('brandId', sql.Int, { nullable: true }); // [Order No]
            table.columns.add('dealerId', sql.Int, { nullable: true }); // [Part No]
            table.columns.add('inventory_location', sql.nvarchar(100), { nullable: true }); // [Recd Qty]
            table.columns.add('locationID', sql.Int, { nullable: true }); // [Status]
            table.columns.add('added_by', sql.Int, { nullable: true }); // [Ware House Name]
            table.columns.add('added_on', sql.dateTime, { nullable: true }); // [Payer Code]
            table.columns.add('operation', sql.VarChar(100), { nullable: true }); // [Division Name]
          
        
            // Add rows to the table
            values.forEach((row) => {
                table.rows.add(
                    row[0],  // brandid
                    row[1],  // dealerid
                    row[2],  // inventory_location
                    row[3],  // locationid
                    row[4],  // added_by
                    row[5],  // added_on
                    row[6],  // operation
                   
                );
            });
         })

        const pool=await getPool1();
        try {
           
            await pool.request().bulk(table);
           
        } catch (error) {
            console.error('Error during bulk insert:', error);
            return error; // Rethrow the error for further handling if necessary
        }

        let logQuery=`Insert into Stock_Upload_Logs(brand_id,added_by,operation,dealerLocationMappingRowCount) 
        values(@brandId,@userId,'create dealer location mapping',@rowCount)`;

        await pool.request().input('brandId',brandId)
        .input('userId',userId).query(logQuery)
    }
    catch(error){
        return error;
    }
}
const checkFields=(arr)=>{
    arr.some(item => item.dealer === null || item.location === null);

}
export default  addDealerLocationMappingInService