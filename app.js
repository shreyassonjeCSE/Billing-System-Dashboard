require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const port = process.env.port || 4000;

let customerCounter = 1000; // Starting point for customer ID

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URL);

const moneySchema = new mongoose.Schema({
    customer_id: String,
    category: String,
    amount: Number,
    mode: String,
    date: Date
});

const Money = mongoose.model('Money', moneySchema);

app.post('/new-customer', (req, res) => {
    customerCounter++; // Increment customer ID
    const customerId = `CUST${customerCounter}`;
    res.json({ customerId });
});

app.post('/submit', async (req, res) => {
    const newMoney = new Money(req.body);
    try {
        await newMoney.save();
        res.json({ message: 'Transaction saved successfully!' });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.get('/data/:customerId', async (req, res) => {
    try {
        const data = await Money.find({ customer_id: req.params.customerId });
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching data');
    }
});

app.delete('/delete/:id', async (req, res) => {
    try {
        await Money.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted successfully!' });
    } catch (error) {
        res.status(500).send('Error deleting transaction');
    }
});

app.get('/bill/:customerId', async (req, res) => {
    try {
        const transactions = await Money.find({ customer_id: req.params.customerId });
        const total = transactions.reduce((acc, curr) => acc + curr.amount, 0);
        const paymentType = transactions.length > 0 ? transactions[0].mode : 'N/A';
        res.json({ transactions, total, paymentType });
    } catch (error) {
        res.status(500).send('Error generating bill');
    }
});

// New endpoint for getting sales by date
app.get('/sales/:date', async (req, res) => {
    const date = new Date(req.params.date);
    try {
        const transactions = await Money.find({
            date: {
                $gte: new Date(date.setHours(0, 0, 0, 0)),
                $lte: new Date(date.setHours(23, 59, 59, 999))
            }
        }).sort('customer_id');
        res.json(transactions);
    } catch (error) {
        res.status(500).send('Error fetching sales data');
    }
});

const server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
