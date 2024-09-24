const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();


const app = express();
const server = http.createServer(app);
const io = new Server(server);
const MONGOURL = process.env.MONGO_URL;


mongoose.connect(MONGOURL)
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
    username: String,
    password: String
});
const User = mongoose.model('User', userSchema);
const messageSchema = new mongoose.Schema({
    userId: String,
    name:String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('messages', messageSchema);

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', async(socket) => {
    console.log(`connected in  chat`);
 
    Message.find()
        .then((messages) => {
            socket.emit(`load messages`, messages);
        })
        .catch((err) => console.error('Error loading messages:', err));

    
    socket.on('chat message', (data) => {
        const newMessage = new Message({
            userId: data.userId,
            username : data.username,
            message: data.message
        });
        // const messageHTML = `<p><strong>${data.username}</strong>:${data.message}</p>`

        
        newMessage.save()
            .then(() => {
                io.emit('chat message', {...data,username:data.username}); 
            })
            .catch((err) => console.error('Error saving message:', err));
    });

    
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main.html'));
});

app.post("/login", async (req, res) => {
    const {username, password} = req.body;

    // const hashedPassword = await bcrypt.hash(password, 10);

    // const newUser = new User({
    //     username: username,
    //     password: hashedPassword
    // });
    // let finduser = User.findOne(newUser)
    let userdata =  await User.findOne({
      username: username,
      password: password
    })
  if(!userdata){
    res.send("Invalid username or password\nCreate a new user");
  }else{
    // res.render('chat',{username : userdata.username});
    // res.send(username)
    res.sendFile(path.join(__dirname,'public','chat.html'))
  }
});
app.post("/register", async (req, res) => {
  const {username, password} = req.body;

  // const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
      username: username,
      password: password
  });
  await newUser.save()
  res.send("Register successfully")
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
