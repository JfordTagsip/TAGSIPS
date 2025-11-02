import axios from "axios";

const API_URL = "http://localhost:5000/api/users";

const test = async () => {
  try {
    const response = await axios.get(API_URL);
    console.log("Users:", response.data);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
};

test();
