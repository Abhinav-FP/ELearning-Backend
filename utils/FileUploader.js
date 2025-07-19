const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3'); // Importing specific commands
const { v4: uuidv4 } = require('uuid');

// Configure AWS SDK for DigitalOcean Spaces (SDK v3)
const s3Client = new S3Client({
  region: process.env.region,
  endpoint: `https://${process.env.endpoint}`, // Endpoint for your DigitalOcean Space
  credentials: {
    accessKeyId: process.env.accesskeyId, // Your DigitalOcean Space Access Key
    secretAccessKey: process.env.secretAccess, // Your DigitalOcean Space Secret Key
  },
});

const upload = multer({ storage: multer.memoryStorage() });

const uploadFileToSpaces = async (file) => {
  try {
    const fileName = `${uuidv4()}-${file.originalname.replaceAll(" ", "_")}`; // Unique filename

    const uploadParams = {
      Bucket: process.env.bucketName, // Your Space Name
      Key: `uploads/${fileName}`, // Path within the Space
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read', // Publicly accessible file
    };

    // Using PutObjectCommand for uploading file
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Construct and return the complete public URL
    const fileUrl = `https://${process.env.bucketName}.${process.env.endpoint}/uploads/${fileName}`;
    return fileUrl; // Full public URL
  } catch (err) {
    console.error('Upload error:', err.message);
    return null; // Return null on error
  }
};

const deleteFileFromSpaces = async (fileUrl) => {
  try {
    // Extract the file key from the URL
    const urlParts = fileUrl.split('/');
    const fileKey = urlParts.slice(urlParts.indexOf('uploads')).join('/'); // Extracting 'uploads/filename'

    // Prepare the delete parameters
    const deleteParams = {
      Bucket: process.env.bucketName, // Your Space Name
      Key: fileKey, // File key from the URL
    };

    // Using DeleteObjectCommand to delete the file
    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);
    return true;
  } catch (err) {
    console.error('Delete error:', err.message);
    return false;
  }
};

module.exports = { upload, uploadFileToSpaces, deleteFileFromSpaces };