const express = require('express');
const app = express();
const port = 4000;
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

let db = new sqlite3.Database('./images.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run('CREATE TABLE IF NOT EXISTS images(name TEXT, path TEXT)', (err) => {
            if (err) {
                console.error(err.message);
            }
        });
    }
});

app.post('/upload', upload.single('image'), (req, res) => {
    console.log(req.file); // Log the file object to see if the file is being received

    const { originalname } = req.file; // Use originalname instead of path

    // Construct the path where the file is stored
    const filePath = path.join(__dirname, 'uploads', req.file.filename);

    db.run('INSERT INTO images(name, path) VALUES(?, ?)', [originalname, filePath], (err) => {
        if (err) {
            console.error(err); // Log the error to see if there's an issue with the database
            res.status(500).send('Error uploading image');
        } else {
            res.send('Image uploaded successfully');
        }
    });
});

app.get('/fetch', (req, res) => { 
    db.all('SELECT * FROM images', (err, rows) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'Error fetching images' });
        } else {
            res.json(rows);
        }
    });  
});


app.listen(port, () => console.log(`Server started on port ${port}`)); 
