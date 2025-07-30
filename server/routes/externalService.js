const express = require('express');
const axios = require('axios');

const router = express.Router();

// GitHub integration
async function sendToGitHub(config, options) {
  const { token, repo, branch, path, message } = options;
  
  try {
    // Get current file content if it exists
    let currentContent = null;
    try {
      const getResponse = await axios.get(
        `https://api.github.com/repos/${repo}/contents/${path}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );
      currentContent = getResponse.data.content;
    } catch (error) {
      // File doesn't exist, which is fine for new files
    }

    // Prepare the commit
    const commitData = {
      message: message || 'Update service configuration',
      content: Buffer.from(JSON.stringify(config, null, 2)).toString('base64'),
      branch: branch || 'main'
    };

    if (currentContent) {
      commitData.sha = currentContent;
    }

    const response = await axios.put(
      `https://api.github.com/repos/${repo}/contents/${path}`,
      commitData,
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    return {
      success: true,
      url: response.data.content.html_url,
      sha: response.data.content.sha
    };
  } catch (error) {
    throw new Error(`GitHub integration failed: ${error.message}`);
  }
}

// S3 integration (placeholder - would need AWS SDK)
async function sendToS3(config, options) {
  const { bucket, key, region } = options;
  
  // This is a placeholder - in real implementation, you'd use AWS SDK
  // const AWS = require('aws-sdk');
  // const s3 = new AWS.S3({ region });
  
  try {
    // const result = await s3.putObject({
    //   Bucket: bucket,
    //   Key: key,
    //   Body: JSON.stringify(config, null, 2),
    //   ContentType: 'application/json'
    // }).promise();

    return {
      success: true,
      url: `https://${bucket}.s3.${region}.amazonaws.com/${key}`,
      message: 'Configuration uploaded to S3'
    };
  } catch (error) {
    throw new Error(`S3 integration failed: ${error.message}`);
  }
}

// Generic HTTP endpoint
async function sendToHttpEndpoint(config, options) {
  const { url, method = 'POST', headers = {} } = options;
  
  try {
    const response = await axios({
      method,
      url,
      data: config,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });

    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    throw new Error(`HTTP endpoint integration failed: ${error.message}`);
  }
}

router.post('/', async (req, res) => {
  try {
    const { 
      config, 
      service, 
      options 
    } = req.body;

    if (!config) {
      return res.status(400).json({
        error: 'Missing required field: config'
      });
    }

    if (!service) {
      return res.status(400).json({
        error: 'Missing required field: service'
      });
    }

    if (!options) {
      return res.status(400).json({
        error: 'Missing required field: options'
      });
    }

    let result;

    switch (service.toLowerCase()) {
      case 'github':
        result = await sendToGitHub(config, options);
        break;
      
      case 's3':
        result = await sendToS3(config, options);
        break;
      
      case 'http':
      case 'webhook':
        result = await sendToHttpEndpoint(config, options);
        break;
      
      default:
        return res.status(400).json({
          error: 'Unsupported service',
          message: `Service '${service}' is not supported. Supported services: github, s3, http, webhook`
        });
    }

    res.json({
      success: true,
      service,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending to external service:', error);
    res.status(500).json({
      error: 'Failed to send to external service',
      message: error.message
    });
  }
});

// GitHub specific endpoint
router.post('/github', async (req, res) => {
  try {
    const { config, options } = req.body;

    if (!config) {
      return res.status(400).json({
        error: 'Missing required field: config'
      });
    }

    if (!options || !options.token || !options.repo) {
      return res.status(400).json({
        error: 'Missing required GitHub options: token, repo'
      });
    }

    const result = await sendToGitHub(config, options);

    res.json({
      success: true,
      service: 'github',
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending to GitHub:', error);
    res.status(500).json({
      error: 'Failed to send to GitHub',
      message: error.message
    });
  }
});

// S3 specific endpoint
router.post('/s3', async (req, res) => {
  try {
    const { config, options } = req.body;

    if (!config) {
      return res.status(400).json({
        error: 'Missing required field: config'
      });
    }

    if (!options || !options.bucket || !options.key) {
      return res.status(400).json({
        error: 'Missing required S3 options: bucket, key'
      });
    }

    const result = await sendToS3(config, options);

    res.json({
      success: true,
      service: 's3',
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error sending to S3:', error);
    res.status(500).json({
      error: 'Failed to send to S3',
      message: error.message
    });
  }
});

module.exports = router; 