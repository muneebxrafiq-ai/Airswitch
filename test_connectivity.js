
const axios = require('axios');

async function testConnection() {
    try {
        console.log('Testing connection to http://192.168.100.68:3000...');
        const response = await axios.get('http://192.168.100.68:3000/');
        console.log('Success! Status:', response.status);
        console.log('Data:', response.data);
    } catch (error) {
        console.error('Connection failed:', error.message);
        if (error.code) console.error('Error Code:', error.code);
    }
}

testConnection();
