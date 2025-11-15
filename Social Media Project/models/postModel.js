const mongoose = require('mongoose')
const postSchema= mongoose.Schema({
  imageurl:String,
  user:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'user'
    },
  date:{
    type:Date,
    default:Date.now()
    },
  description:{
      type: String
    },
  likes:[
    {
      type:mongoose.Schema.Types.ObjectId,
      ref:"user"
    }
    ]
})
module.exports=mongoose.model("post",postSchema)