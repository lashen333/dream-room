const https = require('https');

https.get('https://www.damro.lk', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        // Look for "Living Room" and surrounding HTML
        const index = data.indexOf('Living Room');
        if (index !== -1) {
            console.log('Found "Living Room" at index:', index);
            console.log(data.substring(index - 200, index + 200));
        } else {
            console.log('Living Room not found in HTML');
        }

        // Look for "Bedroom"
        const index2 = data.indexOf('Bedroom');
        if (index2 !== -1) {
            console.log('Found "Bedroom" at index:', index2);
            console.log(data.substring(index2 - 200, index2 + 200));
        }
    });
}).on('error', (err) => {
    console.log('Error: ' + err.message);
});
