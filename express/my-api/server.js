const express = require('express');  
const app = express();  
const port = 3000;  

// Middleware để đọc JSON
app.use(express.json());  

// API đơn giản
app.get('/', (req, res) => {
  res.send('Hello API');
});

// API trả danh sách user
app.get('/users', (req, res) => {
  const users = [
    { id: 1, name: 'Bill' },
    { id: 2, name: 'Alice' }
  ];
  res.json(users); // trả về JSON cho client
});

// API tạo user mới (POST)
app.post('/users', (req, res) => {
  const newUser = req.body; // lấy data từ client gửi lên
  res.json({ message: 'User created', data: newUser });
});

// Chạy server
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
