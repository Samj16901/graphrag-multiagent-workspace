const axios = require('axios');

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:5001';

async function requestToPython(req) {
  const config = {
    method: req.method.toLowerCase(),
    url: `${PYTHON_BACKEND_URL}${req.path}`,
    params: req.query,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      ...req.headers
    }
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    config.data = req.body;
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await axios(config);
      return { status: response.status, data: response.data };
    } catch (error) {
      if (attempt === 2) {
        if (error.response) {
          throw { status: error.response.status, data: error.response.data };
        }
        throw { status: 502, data: { error: 'Python backend unavailable' } };
      }
      await new Promise(res => setTimeout(res, 500 * (attempt + 1)));
    }
  }
}

function handleError(res, err, serviceName) {
  res.status(err.status || 500).json({
    error: `${serviceName} unavailable`,
    details: err.data?.error || err.data || 'Unknown error'
  });
}

module.exports = { requestToPython, handleError };
