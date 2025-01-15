import express from 'express';
import path from 'path';
const router = express.Router();


router.get('/', (req, res) => {
    // Resolve the absolute path to the 'html' folder
    const filePath = path.resolve('html', 'index.html');
    res.sendFile(filePath);
});


export default router;
