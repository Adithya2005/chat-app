const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server);


mongoose.connect('mongodb+srv://adithya29725:adithya2005@cluster.vywbw.mongodb.net/chat?retryWrites=true&w=majority')
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));


const messageSchema = new mongoose.Schema({
    userId: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('messages', messageSchema);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('user connected');
 
    Message.find()
        .then((messages) => {
            socket.emit('load messages', messages);
        })
        .catch((err) => console.error('Error loading messages:', err));

    
    socket.on('chat message', (data) => {
        const newMessage = new Message({
            userId: data.userId,
            message: data.message
        });

        
        newMessage.save()
            .then(() => {
                io.emit('chat message', data); 
            })
            .catch((err) => console.error('Error saving message:', err));
    });

    
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
