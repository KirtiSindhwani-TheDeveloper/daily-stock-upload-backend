import { getPool1 } from "../../connection.js"

export const addMapping=async (req,res)=>{

    try{
      const pool=await getPool1();
      let query;
      await pool.request().input().query(query);


    }
    catch(error){
        console.log("error in add mapping in service ",error.message)
     return error 
    }
}

export const viewMapping=async (req,res)=>{
    try{
        const pool=await getPool1();
        let query;
        const result=await pool.request().input().query(query);
  
        return result;
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