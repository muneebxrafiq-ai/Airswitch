const axios = require('axios');

const URL = 'https://ready-insects-beg.loca.lt';

console.log(`Testing connectivity to ${URL}...`);

axios.get(URL, {
    timeout: 15000,
    headers: {
        'Bypass-Tunnel-Reminder': 'true'
    }
})
    .then(res => {
        console.log('✅ Success! Tunnel is reachable.');
        console.log('Status:', res.status);
        console.log('Data:', res.data);
    })
    .catch(err => {
        console.error('❌ Failed to connect via Tunnel.');
        console.error('Error:', err.message);
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
        }
    });
