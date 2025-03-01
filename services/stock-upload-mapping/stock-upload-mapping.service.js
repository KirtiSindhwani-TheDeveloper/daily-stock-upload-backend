import { getPool1 } from "../../connection.js"

export const addMapping=async (req,res)=>{

    try{
       let stockType=req.stockType;
       let  brandColumns=JSON.stringify(req.brandColumns);
       let  brandId=req.brandId;
       let  userId=req.userId;
       let partNumber=req.values.partNumber;
       let location=req.values.location;
       let stockQty=req.values.stockQty;
      const pool=await getPool1();
      let query=`Insert into Stock_Upload_Mapping(part_number,stock_qty,loc,added_by,brand_id,stock_type,brandColumns) 
      output inserted.id
       values(@partNumber,@stockQty,@location,@userId,@brandId,@stockType,@brandColumns)`;

     const result= await pool.request()
      .input('partNumber',partNumber)
      .input('stockQty',stockQty)
      .input('location',location)
      .input('userId',userId)
      .input('brandId',brandId)
      .input('brandColumns',brandColumns)
      .input('stockType',stockType)
      .query(query);

      let insertedId=result.recordset[0]?.id;
    //   console.log("result ",result,insertedId)
      let logQuery=`Insert into Stock_Upload_Logs(added_by,mapping_id,operation_type) values(@userId, @insertedId,'create stock upload mapping')`
    await pool.request()
    .input('userId',userId)
    .input('insertedId',insertedId)
    .query(logQuery);


    }
    catch(error){
        console.log("error in add mapping in service ",error.message)
     return error 
    }
}

export const viewMapping=async (req,res)=>{
    try{
        const pool=await getPool1();
        let brandId=req.brand_id;
        let query='Select * from Stock_Upload_Mapping where brand_id=@brandId';
        const result=await pool.request().input('brandId',brandId).query(query);
  
        return result.recordset;
      }
      catch(error){
          console.log("error in view mapping in service ",error.message)
       return error 
      }
}

export const editMapping=async(req,res)=>{
    try{
        const pool=await getPool1();
        let query;
        await pool.request().input().query(query);
  
  
      }
      catch(error){
          console.log("error in edit mapping in service ",error.message)
       return error 
      }
}

export const alreadyExistedMapping=async(req,res)=>{
    try{
        const pool=await getPool1();
        let query;
        await pool.request().input().query(query);
  
  
      }
      catch(error){
          console.log("error in already existed mapping in service ",error.message)
       return error 
      }
}