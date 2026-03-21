const mongoose = require('mongoose');

async function testConnection() {
    const uri = "mongodb://admin:Fcd1v582F5HE357l@ac-bgj2nib-shard-00-01.c6zxi3g.mongodb.net:27017,ac-bgj2nib-shard-00-02.c6zxi3g.mongodb.net:27017,ac-bgj2nib-shard-00-00.c6zxi3g.mongodb.net:27017/campus-connect?ssl=true&authSource=admin";
    try {
        console.log('Testing connection to shards directly...');
        const conn = await mongoose.connect(uri);
        console.log('Connected! Host: ' + conn.connection.host);
        process.exit(0);
    } catch (err) {
        console.error('Connection failed:', err.message);
        process.exit(1);
    }
}

testConnection();
