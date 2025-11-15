const express = require('express')
const app = express()
const path = require('path')
const userModel=require("./models/userModel")
const postModel=require("./models/postModel")
const cookieParser= require("cookie-parser")
const jwt = require('jsonwebtoken')
const bcrypt=require("bcrypt")
const multer=require('multer')
const upload = require('./Config/multerConfig')

app.use(express.json())
app.use(express.urlencoded({extended : true}))
app.use(cookieParser())
app.set('view engine','ejs')
app.use(express.static(path.join(__dirname,"public")))

app.get('/create',(req,res)=>{
  res.render('createAccount')
})


app.get('/login',(req,res)=>{
  res.render('login')
})


app.get('/logout',(req,res)=>{
  res.cookie("token","")
  res.redirect('/login')
})

function isLoggedIn(req,res,next){
  if(req.cookies.token=== "") res.redirect("/login")
  else{
   let data=jwt.verify(req.cookies.token,"beepboopblapboom")
    req.user=data // jwt returned the payload (data that was used to create the token in our case it was the email and the _id)
    next ()
}
}

app.get('/profile',isLoggedIn,async (req,res)=>{
  let user = await userModel.findOne({email:req.user.email}).populate("post") 
   res.render('profile',{user})
}) 
 
app.post('/create',upload.single('image'),async (req,res)=>{
   let {username,name,age,email,password}=req.body
    let userFound= await userModel.findOne({email})
      if(userFound){res.status(500).send("User Already exist")}
else {
  bcrypt.genSalt(10, function(err, salt){
    if(err){console.log('Something Went Wrong',err)}
      bcrypt.hash(password, salt, async function(err,hash) {
        if(err){console.log('Something Went Wrong',err)}
            let newUser= await userModel.create({
              username,
              name,
              age, 
              email,
              password:hash,
              profileImage:req.file.path.replace("public/", "")
              })
       let token = jwt.sign({email: newUser.email,userid:newUser._id},'beepboopblapboom')
       res.cookie("token",token)
    });
});}
res.redirect('/login')
})


app.post('/login',async (req,res)=>{
  let {email,password}=req.body
    const existingUser= await userModel.findOne({email})
      if(existingUser){
        bcrypt.compare(password,existingUser.password,(err,result)=>{
           if(result){
            let token = jwt.sign({email:existingUser.email,userid:existingUser._id},'beepboopblapboom')
            res.cookie("token",token)
            res.status(200).redirect("/profile")
            }
           else res.redirect("/login")
    })}
     else res.redirect("/login")
})


app.get('/createpost', (req,res)=>{
   res.render('createPosts')
})

app.post('/createpost',isLoggedIn, async (req,res)=>{
  let{imageurl,description}=req.body
  let theCreater = await userModel.findOne({email:req.user.email})
  let newPost= await postModel.create({
    imageurl,
    description,
    user:req.user.userid
  })
  theCreater.post.push(newPost._id)
  await theCreater.save() // this is also a db operation so first ,
  // we let tthe database save the new input string then we will be
  //  doing so that thenew post will also display on the profile page
  res.redirect('/profile')
   
})



app.get('/like/:postid',isLoggedIn,async (req,res)=>{
 let user = await userModel.findOne({email:req.user.email})
 let thePost = await postModel.findOne({_id:req.params.postid})
  if(thePost.likes.includes(user._id)){
    thePost.likes.splice(thePost.likes.indexOf(user._id),1)
    await thePost.save()
    res.redirect('/profile')

  }
  else{
    thePost.likes.push(user._id)
    await thePost.save()
    res.redirect("/profile");
  }
 
})


app.get('/edit/:postid',isLoggedIn,async (req,res)=>{
  let post = await postModel.findOne({_id:req.params.postid})
  res.render('editPosts',{post})
 })


 app.post('/editpost/:postid',isLoggedIn,async (req,res)=>{
  let{imageurl,description}=req.body
  let post = await postModel.findOneAndUpdate({_id:req.params.postid},{imageurl,description})
  res.redirect("/profile")
 })

 app.get('/profilePicture',isLoggedIn, async function(req,res){
  let user = await userModel.findOne({_id:req.user.userid})
  res.render('editProfilePicture',{user})
 })

 app.post('/editProfilePicture/:id',upload.single('image'),async(req,res)=>{
 let user = await userModel.findOneAndUpdate({_id:req.params.id},{profileImage:req.file.path.replace("public/", "")})
  res.redirect("/profile")
 })


app.listen(3000)
