const express = require("express")
const jwt = require("jsonwebtoken")
const bcrypt = require('bcrypt');
require("dotenv").config()
const cors = require("cors")

const PORT = process.env.PORT

const { UserModel } = require("./models/User.model")
const { BlogModel } = require("./models/Blog.model")
const { connection } = require("./config/db")
const { authentication } = require("./middlewares/authentication.middleware")

const app = express()
app.use(express.json())
app.use(cors({
    origin: "*"
}))

app.get("/", (req, res) => {
    res.send("base API endpoint")
})

app.post("/signup", async (req, res) => {
    const { email, password, name, city } = req.body;
    const is_user = await UserModel.findOne({ email: email })
    if (is_user) {
        res.send({ msg: "Already registered, Please login" })
    }
    bcrypt.hash(password, 3, async function (err, hash) {
        const new_user = new UserModel({
            email,
            password: hash,
            name,
            city
        })
        await new_user.save()
        res.send({ msg: "Sign up successfull" })
    }); 
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const is_user = await UserModel.findOne({ email })
    if (is_user) {
        const hashed_pwd = is_user.password
        bcrypt.compare(password, hashed_pwd, function (err, result) {
            if (result) {
                const token = jwt.sign({ userID: is_user._id }, process.env.SECRET_KEY)
                res.send({ msg: "Login Successfull", token: token })
            }
            else {
                res.send({msg: "Login failed"})
            }
        }); 
    } 
    else {
        res.send("Please Sign up first")
    }
})

app.get("/blogs", authentication, async (req, res) => {
    try {
        const blogs = await BlogModel.find()
        res.send({ blogs })
    }
    catch (err) {
        console.log(err)
        res.send({ msg: "Something went wrong" })
    }
})  

app.post("/blogs/add", authentication, async (req, res) => {
    const { title, author, category, content, image } = req.body;
    const userID = req.userID
    const new_Blog = new BlogModel({
        title,
        category,
        author,
        content, 
        image,
        user_id: userID
    })

    try {
        await new_Blog.save()
        return res.send({ msg: "Blog added successfully" })
    }
    catch (err) {
        console.log(err)
        res.send({ msg: "Please try again" })
    }
})

app.delete("/blogs/:BlogID", authentication, async (req, res) => {
    const { BlogID } = req.params
    try {
        const blogs = await BlogModel.findOneAndDelete({ _id: BlogID, user_id: req.userID })
        if (blogs) {
            res.send({ msg: "Blog deleted successfully" })
        }
        else {
            res.send({ msg: "You are not authorised" })
        }
    }
    catch (err) {
        console.log(err)
        res.send({ msg: "Something went wrong" })
    }
})
 
app.listen(PORT, async () => {
    try {
        await connection
        console.log("connected to db successfully")
    } 
    catch (err) {
        console.log("error while connecting to DB")
        console.log(err)
    }
    console.log(`listening on port ${process.env.PORT}`)
})  