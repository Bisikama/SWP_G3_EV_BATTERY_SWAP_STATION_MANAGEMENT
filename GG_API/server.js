const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static('public'));

// API endpoint để lấy địa điểm
app.get('/api/places', (req, res) => {
  const places = [
    { id: 1, name: 'Bưu điện Thành phố', lat: 10.7797, lng: 106.6990 },
    { id: 2, name: 'Nhà thờ Đức Bà', lat: 10.7797, lng: 106.6990 },
    { id: 3, name: 'Chợ Bến Thành', lat: 10.7720, lng: 106.6980 }
  ];
  res.json(places);
});

// Route chính
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});