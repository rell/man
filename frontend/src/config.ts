/**
 * All the configuration variables are stored here
 top is local 
 second is prod
 */
/* const API_BASE_URL = "http://localhost:8000"; */
const API_BASE_URL =  `${process.env.REACT_APP_API_BASE_URL}`;
export default API_BASE_URL;
