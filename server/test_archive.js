import axios from 'axios';

async function test_archive() {
    try {
        const res = await axios.get('http://localhost:3000/api/archive');
        const items = res.data.data || [];
        console.log(`API returned ${items.length} items.`);
        if (items.length > 0) {
            console.log('Sample item userId:', items[0].userId);
        }
    } catch (err) {
        console.error('API Error:', err.message);
        if (err.response) console.error(JSON.stringify(err.response.data));
    }
}
test_archive();
