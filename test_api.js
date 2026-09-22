const axios = require('axios');

async function test() {
  try {
    const res = await axios.post('http://127.0.0.1:8000/api/hazards', {
      image_url: "test.jpg",
      latitude: 1.0,
      longitude: 2.0,
      description: "test"
    }, {
      headers: {
        'Authorization': 'Bearer test'
      }
    });
    console.log("Success:", res.status);
  } catch (err) {
    if (err.response) {
      console.log("Error status:", err.response.status);
      console.log("Error data:", err.response.data);
    } else {
      console.log("Network error:", err.message);
    }
  }
}

test();
