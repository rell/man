/**
 * All the configuration variables are stored here
 top is local 
 second is prod
 */
/* const API_BASE_URL = "http://localhost:8000"; */
const API_BASE_URL =  `http://${process.env.REACT_APP_AWS_PUB_DNS}/api`;
export default API_BASE_URL;
