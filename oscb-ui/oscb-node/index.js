const express = require('express');
const axios = require('axios');
const fs = require('fs-extra');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path')
const mime = require('mime');
const archiver = require('archiver');
const util = require('util');
const stat = util.promisify(fs.stat);
const multer = require("multer");
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const hostIp = process.env.SSH_CONNECTION.split(' ')[2];
const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
require('dotenv').config();

const mongoDBConfig = JSON.parse(fs.readFileSync('./configs/mongoDB.json'));// Import the MongoDB connection configuration
const { mongoUrl, dbName, optionsCollectionName, datasetCollection, userDatasetsCollection, jobsCollection, preProcessResultsCollection, benchmarksCollection, errorlogcollection, projectsCollection, chatHistoryCollection } = mongoDBConfig;
const { MongoClient, ObjectId } = require('mongodb');

// const Option = require('../models/Option');
// // Import the database configuration
// require('./config/mongoDBClient');
const chatRoutes = require('./routes/chatRoutes');
console.log("JWT_TOKEN_SECRET:", process.env.JWT_TOKEN_SECRET)


// Increase the limit for the request body size to 25MB

console.log('HOSTURL: ' + process.env.HOST_URL);
const app = express();
app.use(cors({
    // origin: [`http://${process.env.HOST_URL}:3000`, `http://${hostIp}:3000`],
    origin: [`https://${process.env.HOST_URL}`, `https://${process.env.HOST_URL}:3000`, `https://${hostIp}:3000`, `https://${process.env.HOST_URL}:3001`, `http://${hostIp}:3001`, `https://${process.env.HOST_URL}/node/`, `https://${hostIp}/node/`],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'],
    allowedHeaders: ['Range', 'Content-Type', 'Authorization'],
    credentials: true
}));
// app.use(cors());
app.use(bodyParser.json({ limit: '25mb' }));
app.use(cookieParser());
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Unhandled Error in Node Application');
});

// Serve static files from the "s" directory
app.use("/zarr", express.static(path.join(__dirname, 'storage/zarr/'), { dotfiles: 'allow' }));
app.use('/node/api/chat', chatRoutes);

const dbConfig = JSON.parse(fs.readFileSync('./configs/dbconfigs.json'));
const storageConfig = JSON.parse(fs.readFileSync('./configs/storageConfig.json'));
const { storageDir, storageAllowance, intermediateStorage, publicStorage } = storageConfig;

// Create a connection pool to handle multiple connections to the database
const pool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: process.env.MYSQL_ROOT_PASSWORD,
    database: dbConfig.database,
    connectionLimit: dbConfig.connectionLimit
});
console.log('MySQL connection pool created with config:', { host: dbConfig.host, port: dbConfig.port, user: dbConfig.user, database: dbConfig.database, connectionLimit: dbConfig.connectionLimit });
console.log('MYSQL_ROOT_PASSWORD:', process.env.MYSQL_ROOT_PASSWORD);

// Middleware function to verify JWT token
function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];

    if (typeof bearerHeader !== 'undefined') {
        const bearerToken = bearerHeader.split(' ')[1];
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);
    }
}


// Middleware to verify the token
const verifyJWTToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    if (bearerHeader) {
      const bearerToken = bearerHeader.split(' ')[1];
      jwt.verify(bearerToken, process.env.JWT_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(403).send({ message: 'Failed to authenticate token.' });
        }
        // If token is successfully verified, you can attach decoded info to request
        req.user = decoded;
        next();
      });
    } else {
      // If no token is provided
      res.status(403).send({ message: 'No token provided.' });
    }
  };


function getUserFromToken(token) {
    if (typeof token !== 'string') {
        return 'Unauthorized';
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET);
        if (!decoded.username) {
            return 'Unauthorized';
        }

        return decoded.username;
    } catch (err) {
        console.log('Session Expired. Please login again ' + err)
        return 'Unauthorized';
    }
}


function removeFiles(fileList) {
    if (fileList && Array.isArray(fileList)) {
        let successCount = 0;
        let errorCount = 0;
        for (const filePath of fileList) {           
            try {
                if (fs.existsSync(filePath)) {
                    fs.removeSync(filePath);
                    // file or folder removed
                    successCount++;
                } else {
                    console.log('Error Deleting: ' + filePath);
                    errorCount++;
                }
            } catch (err) {
                console.error(err);
                errorCount++;
            }
        }
    }
}


const createDirectoryIfNotExists = async (dirPath) => {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`Directory "${dirPath}" created successfully.`);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        console.error('Error creating the directory:', err);
      }
    }
  };


const createUniqueFolder = (destinationDir, folderName, index = 1) => {
    const targetFolderName = index === 1 ? path.join(destinationDir, folderName) : path.join(destinationDir, `${folderName}(${index})`);
    const targetFolderPath = path.join(__dirname, targetFolderName);
  
    if (!fs.existsSync(targetFolderPath)) {
      try {
        fs.mkdirSync(targetFolderPath);
        console.log(`Directory "${targetFolderName}" created successfully.`);
        return targetFolderName;
      } catch (err) {
        console.error('Error creating the directory:', err);
        return null;
      }
    } else {
      return createUniqueFolder(destinationDir, folderName, index + 1); // Try with the next index
    }
  };


// Function to copy files from source directory to destination directory
const copyFiles = async (sourceDir, destinationDir, dirName, files, fromPublic) => {
    try {

  
      for (let file of files) {
        const sourceFilePath = path.join(sourceDir, file);
        let destinationFilePath = "";
        if (fromPublic) {
            file = file.replace(/^\/?publicDatasets\//, '/'); // Remove "PUBLIC_DATASETS" from the start
            destinationFilePath = path.join(destinationDir, file);
        } else {
            destinationFilePath = path.join(destinationDir, file);
        }

        const sourceFileDir = path.dirname(sourceFilePath);
        const destinationFileDir = path.dirname(destinationFilePath);
  
        // Ensure the destination directory exists before copying files
        await createDirectoryIfNotExists(destinationFileDir);

        // Perform the actual file copy
        await fs.copyFile(sourceFilePath, destinationFilePath);
      }
    } catch (error) {
      console.error('Error copying files:', error);
    }
  };


app.post('/node/copyFiles', async (req, res) => {

    const { selectedFiles, userId } = req.body;

    try {
        let filesFromPublic = false;
        let dirName = ""

        // Logic to Copy files from public storage to user private storage if it is a public Dataset.
        for (const file of selectedFiles) {                      
          if (file.startsWith("publicDataset") || file.startsWith("/publicDatasets")) {
              filesFromPublic = true;
              break;
          }
      }
  
      if (filesFromPublic) {
  
          if (selectedFiles.length > 0) {
              dirName = path.dirname(selectedFiles[0])
          } 
  
          let userPrivateStorageDir = storageDir + userId // Change this to the user's private storage path
  
          // Copy files from public dataset directory to user's private storage
          copyFiles("/usr/src/app/storage/", userPrivateStorageDir, dirName, selectedFiles, filesFromPublic);
          res.json({ status: 200, message: 'Files copied successfully' });
      }
    } catch (error) {
        res.json({ status: 500, message: 'Error while copying files from source to destination' });
    }
  });


// Refresh token endpoint
app.get('/node/refresh-token', verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.JWT_TOKEN_SECRET, (err, authData) => {
        if (err) {
            res.sendStatus(403);
        } else {
            if (authData.username !== null && authData.username !== undefined) {
                const newToken = jwt.sign({ username: authData.username }, process.env.JWT_TOKEN_SECRET, { expiresIn: '1h' });
                res.cookie('jwtToken', newToken, { maxAge: 60 * 60 * 1000, path: "/" });
                res.json({ status: 200, message: 'Token refreshed', token: newToken });
            }
        }
    })    
});


// Route to handle user signup
app.post('/node/signup', (req, res) => {
    const { username, email, password } = req.body;

    // Hash the password using bcrypt
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error(err);
            res.json({ status: 500, message: 'Internal Server Error' });
            return;
        }

        // Insert the user into the database
        pool.query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, hash], (err) => {
            if (err) {
                console.error(err);
                res.json({ status: 500, message: 'An Account is already present with the given email or username. Please try to login or create a new account using different email.' });
                return;
            }

            try {
                if (!err) {
                    if (!fs.existsSync(storageDir + username))
                        fs.promises.mkdir(storageDir + username);

                    // Create JWT token and send it back to the client
                    const jwtToken = jwt.sign({ username }, process.env.JWT_TOKEN_SECRET, { expiresIn: '1h' });

                    // the cookie will be set with the name "jwtToken" and the value of the token
                    // the "httpOnly" and "secure" options help prevent XSS and cookie theft
                    // the "secure" option is only set if the app is running in production mode
                    // set the cookie with the JWT token on the response object
                    res.cookie("jwtToken", jwtToken, {
                        //httpOnly: true,
                        maxAge: 60 * 60 * 1000,
                        path: "/"
                        //secure: process.env.NODE_ENV === "production",
                    });
                    res.json({ status: 200, message: 'User account created successfully' });
                }
            }
            catch (error) {
                res.json({ status: 500, message: 'Error occured while creating a storage directory for the user' });
            }

        });
    });
});


// Route to handle user login
app.post('/node/login', (req, res) => {
    const { username, password } = req.body;

    pool.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error(err);
            res.json({ status: 500, message: 'Internal Server Error' });
            return;
        }

        if (results.length === 0) {
            res.json({ status: 401, message: 'Invalid credentials' });
            return;
        }

        const user = results[0];

        bcrypt.compare(password, user.password_hash, (err, isMatch) => {
            if (err) {
                console.error(err);
                res.json({ status: 500, message: 'Internal Server Error' });
                return;
            }

            if (!isMatch) {
                res.json({ status: 401, message: 'Invalid credentials' });
                return;
            }

            // Create JWT token and send it back to the client
            const jwtToken = jwt.sign({ username }, process.env.JWT_TOKEN_SECRET, { expiresIn: '1h' });

            // the cookie will be set with the name "jwtToken" and the value of the token
            // the "httpOnly" and "secure" options help prevent XSS and cookie theft
            // the "secure" option is only set if the app is running in production mode
            // set the cookie with the JWT token on the response object
            res.cookie("jwtToken", jwtToken, {
                //httpOnly: true,
                maxAge: 60 * 60 * 1000,
                path: "/"
                //secure: process.env.NODE_ENV === "production",
            });

            res.json({ status: 200, message: 'Logged in successfully', jwtToken });
        });
    });
});


const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, 
    port: process.env.EMAIL_PORT,  
    secure: true,  
    auth: {
      user: process.env.EMAIL_ACCOUNT, 
      pass: process.env.EMAIL_PWD  
    },
    tls: {
      rejectUnauthorized: false  
    }
  });
  const sendResetPasswordEmail = (email, resetToken) => {
    // const resetLink = `https://${process.env.HOST_URL}:3000/reset/${resetToken}`; // Dev
    const resetLink = `https://${process.env.HOST_URL}/reset/${resetToken}`; // Production
    const mailOptions = {
        from: process.env.EMAIL_ACCOUNT,
        to: email,
        subject: 'Password Reset',
        html: `
            <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
            <p>Please click on the following link to reset your password:</p>
            <p><a href="${resetLink}">${resetLink}</a></p>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        `
    };

    return transporter.sendMail(mailOptions);
};

  
// Endpoint to handle forgot password
app.post('/node/forgot-password', (req, res) => {
    const { email } = req.body;
    console.log("email", email)
    pool.query('SELECT user_id FROM users WHERE email = ?', [email], (err, results) => {
        console.log("inside query")
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(400).json({ message: 'User not found' });
        }

        const userId = results[0].user_id;
        const token = uuidv4();
        const expiry = Date.now() + 3600000; // 1 hour from now

        pool.query('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE user_id = ?', [token, expiry, userId], (err, results) => {
            if (err) {
                console.error('Database update error:', err);
                return res.status(500).json({ message: 'Database error' });
            }

            // Send email with reset link using sendResetPasswordEmail function
            sendResetPasswordEmail(email, token)
                .then(() => {
                    res.json({ message: 'Please check your email for password reset link.' });
                })
                .catch((error) => {
                    console.error('Error when sending email:', error);
                    return res.status(500).json({ message: 'Error when sending email' });
                });
        });
    });
});


app.post('/node/reset-password', (req, res) => {
    const { token, newPassword, confirmPassword } = req.body;
    console.log("resetpass", newPassword);

    // Validate token and ensure passwords match
    if (!token || !newPassword || newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Invalid request' });
    }

    // Validate the token and check if it's still valid
    pool.query('SELECT user_id FROM users WHERE reset_token = ? AND reset_token_expiry > ?', [token, Date.now()], (err, results) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ message: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        const userId = results[0].user_id;
        console.log("userid", userId);
        // const hashedPassword = bcrypt.hashSync(newPassword, 10); // Hash the new password
        // pool.query('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = ?', [hashedPassword, userId], (err, results) => {
        //     if (err) {
        //         console.error('Database update error:', err);
        //         return res.status(500).json({ message: 'Datasbase error' });
        //     }
        //     res.json({ message: 'Password has been reset successfully' });
        // });

        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
            if (err) {
                console.error(err);
                res.json({ status: 500, message: 'Internal Server Error' });
                return;
            }
    
            // Insert the user into the database
                pool.query('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = ?', [hashedPassword, userId], (err, results) => {
            if (err) {
                console.error('Database update error:', err);
                return res.status(500).json({ message: 'Datasbase error' });
            }
            res.json({ message: 'Password has been reset successfully. Redirecting to Login page...' }); 
            });
        });
    });
});


// Route for resetting password via email link
app.get('/reset/:token', (req, res) => {
    const { token } = req.params;
    // Render a form where users can enter a new password
    res.send(`
       
    `);
});


// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.stack);
    res.status(500).send('Unhandled Error in Node Application');
});


// Route to handle protected resource
app.get('/node/protected', verifyToken, (req, res) => {
    jwt.verify(req.token, process.env.JWT_TOKEN_SECRET, (err, authData) => {
        if (err) {
            res.sendStatus(403);
        } else {
            if (authData.username !== null && authData.username !== undefined) {
                pool.query('SELECT isAdmin FROM users WHERE username = ?', authData.username, (err, results) => {
                    if (err) {
                        console.error(err);
                        res.json({ message: 'Internal Server Error' });
                        return;
                    }
            
                    if (results.length === 0) {
                        res.json({ message: 'Invalid credentials' });
                        return;
                    }
            
                    const adminFlag = results[0].isAdmin;

                    authData.isAdmin = (adminFlag == 1) ? true : false;

                    res.json({ message: 'You have access to the protected resource', authData });
                });
            }
        }
    });
});


app.post('/node/createDataset', async (req, res) => {

    const { title, n_cells, reference, summary, authToken, files, makeItpublic } = req.body;
    const username = getUserFromToken(authToken);

    let filesFromPublic = false;

    // Logic to Copy files from public storage to user private storage if it is a public Dataset.
    for (const file of files) {
    
        if (file.startsWith("publicDataset") || file.startsWith("/publicDatasets")) {
            filesFromPublic = true;
            break;
        }
    }
    if (filesFromPublic) {
        let dirName = ""

        if (files.length > 0) {
            dirName = path.dirname(files[0])
        } 

        let userPrivateStorageDir = storageDir + username // Change this to the user's private storage path

        // Copy files from user's private storage to public dataset directory
        await copyFiles("/usr/src/app/storage/", userPrivateStorageDir, dirName, files, filesFromPublic);
    }

    pool.getConnection(function (err, connection) {
        if (err) {
            console.error('Error getting DB connection:', err);
            return res.status(500).json({ message: 'Database connection error' });
        }

        connection.beginTransaction(function (err) {
            if (err) {
                console.error('Error starting transaction:', err);
                connection.release();
                return res.status(500).json({ message: 'Transaction error' });
            }

            // Run SELECT command
            connection.query('SELECT user_id FROM users WHERE username = ? LIMIT 1', [username], function (err, userRows) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                }

                const userId = userRows[0].user_id;

                if (!userId) {
                    res.status(400).send('User not found');
                    connection.rollback(function () {
                        connection.release();
                    });
                    return;
                }

                connection.query('INSERT INTO dataset (title, n_cells, reference, summary, user_id) VALUES (?, ?, ?, ?, ?)', [title, n_cells, reference, summary, userId], function (err, datasetResult) {
                    if (err) {
                        if (err.code === 'ER_DUP_ENTRY') {
                            console.log('Duplicate Record');
                            connection.release();
                            return res.status(400).send('Dataset title already exists');
                        } else {
                            connection.rollback(function () {
                                connection.release();
                            });
                        }
                    } else {
                        const datasetId = datasetResult.insertId;

                        for (let file of files) {
                            if (filesFromPublic) {
                                file = file.replace(/^\/?publicDatasets\//, '/'); 
                            }
                            connection.query('INSERT INTO file (file_loc, dataset_id) VALUES (?, ?)', [file, datasetId]);
                        }

                        // Commit transaction
                        connection.commit(function (err) {
                            if (err) {
                                connection.rollback(function () {
                                    connection.release();
                                });
                            }

                            console.log('Transaction completed successfully');
                            connection.release();
                            res.status(201).jsonp('Dataset Created.');
                        });
                    }
                });

            });
        });
    });

    if (makeItpublic) {
        try {
            let dirName = "";
            const fromPublic = false;
            if (files.length > 0) {
                dirName = path.dirname(files[0])
            } 

            let userPrivateStorageDir = storageDir + username // Change this to the user's private storage path

            // Copy files from user's private storage to public dataset directory
            await copyFiles(userPrivateStorageDir, publicStorage, dirName, files, fromPublic);

         } catch (err) {
            console.error(err);
        }
      }
});

app.put('/node/updateDataset', async (req, res) => {

    const { title, n_cells, reference, summary, authToken, files, currentFileList } = req.body;
    const username = getUserFromToken(authToken);

    const insertList = files.filter(item => !currentFileList.includes(item));
    const deleteList = currentFileList.filter(item => !files.includes(item));

    let filesFromPublic = false;

    // Logic to Copy files from public storage to user private storage if it is a public Dataset.
    for (const file of files) {
        if (file.startsWith("publicDatasets") || file.startsWith("/publicDatasets")) {
            filesFromPublic = true;
            break;
        }
    }


    if (filesFromPublic) {
        let dirName = ""

        if (files.length > 0) {
            dirName = path.dirname(files[0])
        } 

        let userPrivateStorageDir = storageDir + username // Change this to the user's private storage path

        // Copy files from user's private storage to public dataset directory
        await copyFiles("/usr/src/app/storage/", userPrivateStorageDir, dirName, files, filesFromPublic);
    }


    pool.getConnection(function (err, connection) {
        if (err) {
            console.error('Error getting DB connection:', err);
            return res.status(500).json({ message: 'Database connection error' });
        }

        connection.beginTransaction(function (err) {
            if (err) {
                console.error('Error starting transaction:', err);
                connection.release();
                return res.status(500).json({ message: 'Transaction error' });
            }

            // Run SELECT command
            connection.query('SELECT user_id FROM users WHERE username = ? LIMIT 1', [username], function (err, userRows) {
                if (err) {
                    connection.rollback(function () {
                        connection.release();
                    });
                    return res.status(500).send('Database query error');
                }

                const userId = userRows[0].user_id;

                if (!userId) {
                    res.status(400).send('User not found');
                    connection.rollback(function () {
                        connection.release();
                    });
                    return;
                }

                connection.query('SELECT dataset_id FROM dataset WHERE user_id = ? and title = ? LIMIT 1', [userId, title], function (err, datasetRows) {
                    if (err) {
                        connection.rollback(function () {
                            connection.release();
                        });
                        return res.status(500).send('Dataset query error');
                    }

                    const datasetId = datasetRows[0].dataset_id;

                    if (!datasetId) {
                        res.status(400).send('Dataset not found');
                        connection.rollback(function () {
                            connection.release();
                        });
                        return;
                    }

                    connection.query('UPDATE dataset SET n_cells=?, reference=?, summary=? WHERE dataset_id=?', [n_cells, reference, summary, datasetId], function (err, datasetResult) {
                        if (err) {
                            connection.rollback(function () {
                                connection.release();
                            });
                            return res.status(500).send('Dataset update error');
                        }
                        for (let file of insertList) {
                            if (filesFromPublic) {
                                file = file.replace(/^\/?publicDatasets\//, '/'); 
                            }
                            connection.query('INSERT INTO file (file_loc, dataset_id) VALUES (?, ?)', [file, datasetId]);
                        }

                        for (const file of deleteList) {
                            connection.query('DELETE FROM file WHERE file_loc=? AND dataset_id=?', [file, datasetId]);
                        }

                        // Commit transaction
                        connection.commit(function (err) {
                            if (err) {
                                connection.rollback(function () {
                                    connection.release();
                                });
                                return res.status(500).send('Dataset update error');
                            }

                            console.log('Transaction completed successfully');
                            connection.release();
                            res.status(200).jsonp('Dataset Updated.');
                        });
                    });
                });
            });
        });
    });
});


// app.delete('/node/deleteDataset', async (req, res) => {
//     const { authToken, dataset } = req.query;
//     const username = getUserFromToken(authToken);

//     pool.getConnection(function (err, connection) {
//         if (err) {
//             console.error('Error getting DB connection:', err);
//             return res.status(500).send('Database connection error');
//         }

//         connection.beginTransaction(function (err) {
//             if (err) {
//                 console.error('Error starting transaction:', err);
//                 connection.release();
//                 return res.status(500).send('Transaction error');
//             }

//             // Run SELECT command
//             connection.query('SELECT user_id FROM users WHERE username = ? LIMIT 1', [username], function (err, userRows) {
//                 if (err) {
//                     console.error('Error in SELECT query:', err);
//                     connection.rollback(function () {
//                         connection.release();
//                     });
//                     return res.status(500).send('Database query error');
//                 }

//                 const userId = userRows[0].user_id;

//                 if (!userId) {
//                     res.status(400).send('User not found');
//                     connection.rollback(function () {
//                         connection.release();
//                     });
//                     return;
//                 }

//                 connection.query('SELECT dataset_id FROM dataset WHERE user_id = ? and title = ? LIMIT 1', [userId, dataset], function (err, datasetRows) {
//                     if (err) {
//                         console.error('Error in SELECT query for dataset:', err);
//                         connection.rollback(function () {
//                             connection.release();
//                         });
//                         return res.status(500).send('Dataset query error');
//                     }

//                     const datasetId = datasetRows[0].dataset_id;

//                     if (!datasetId) {
//                         res.status(400).send('Dataset not found');
//                         connection.rollback(function () {
//                             connection.release();
//                         });
//                         return;
//                     }

//                     connection.query('delete FROM file WHERE dataset_id=?', [datasetId], function (err, datasetResult) {
//                         if (err) {
//                             console.error('Error deleting files:', err);
//                             connection.rollback(function () {
//                                 connection.release();
//                             });
//                             return res.status(500).send('Error deleting files');
//                         }
//                         connection.query('DELETE FROM dataset where dataset_id=?', [datasetId]);

//                         // Commit transaction
//                         connection.commit(function (err) {
//                             if (err) {
//                                 console.error('Error committing transaction:', err);
//                                     connection.rollback(function () {
//                                         connection.release();
//                                     });
//                                     return res.status(500).send('Transaction commit error');
//                             }

//                             console.log('Transaction completed successfully');
//                             connection.release();
//                             res.status(200).jsonp('Dataset deleted.');
//                         });
//                     });
//                 });
//             });
//         });
//     });
// });


app.post('/node/renameFile', async (req, res) => {
    let { oldName } = req.query;
    let { newName } = req.query;
    let { authToken } = req.query;

    oldName = oldName.replace('//', '/');
    newName = newName.replace('//', '/');

    const uname = getUserFromToken(authToken);
    if (uname == 'Unauthorized')
        return res.status(403).jsonp('Unauthorized');

    pool.query(`SELECT f.file_loc FROM oscb.file f JOIN oscb.dataset d ON f.dataset_id = d.dataset_id JOIN oscb.users u ON d.user_id = u.user_id WHERE u.username = '${uname}' AND f.file_loc LIKE '${oldName}%';`, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ status: 500, message: 'Internal Server Error' });
        }

        if (results.length > 0) {
            return res.status(409).json({ status: 409, message: 'Directory already exists' });
        } else {
            if (oldName.includes("publicDatasets") && newName.includes("publicDatasets")) {
                fs.rename(`/usr/src/app/storage/${oldName}`, `/usr/src/app/storage/${newName}`, (err) => {    
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ status: 500, message: 'Internal Server Error' });
                    } else {
                        console.log('File renamed successfully!');
                        return res.status(200).jsonp('Ok');
                    }
                });
            } else {
                fs.rename(`${storageDir}${uname}/${oldName}`, `${storageDir}${uname}/${newName}`, (err) => {    
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ status: 500, message: 'Internal Server Error' });
                    } else {
                        console.log('File renamed successfully!');
                        return res.status(200).jsonp('Ok');
                    }
                });
            }
        }
    });
});


app.post('/node/download', async (req, res) => {
    const { fileList } = req.body;
    const { authToken } = req.query;
    const { pwd } = req.query;

    try {
        const username = getUserFromToken(authToken);
        if (fileList && Array.isArray(fileList)) {
            const zipName = 'files.zip';
            const output = fs.createWriteStream(zipName);
            const archive = archiver('zip');

            archive.pipe(output);

            async function appendToArchive(filePath, archivePath) {
                const fileStat = await stat(filePath);

                if (fileStat.isDirectory()) {
                    // Recursively append directory contents
                    const dirEntries = await fs.promises.readdir(filePath);
                    for (const entry of dirEntries) {
                        const entryPath = path.join(filePath, entry);
                        const entryArchivePath = path.join(archivePath, entry);
                        await appendToArchive(entryPath, entryArchivePath);
                    }
                } else {
                    // Append file to archive
                    archive.append(fs.createReadStream(filePath), { name: archivePath });
                }
            }

            for (const item of fileList) {
                let filePath = "";
                if (pwd && pwd.includes("publicDatasets")) {
                    filePath = path.join(storageDir, item);
                } else if (pwd && pwd.includes("jobResults")) {
                    filePath = item;
                }
                else {
                    filePath = path.join(storageDir, username, item);
                }
                const archivePath = item;
                await appendToArchive(filePath, archivePath);
            }

            archive.finalize();

            output.on('close', () => {
                const zipPath = path.join(__dirname, zipName);
                const zipSize = fs.statSync(zipPath).size;
                res.setHeader('Content-disposition', 'attachment; filename=' + zipName);
                res.setHeader('Content-type', 'application/zip');
                res.setHeader('Content-length', zipSize);

                const zipstream = fs.createReadStream(zipPath);
                zipstream.pipe(res);

                // Delete the zip file after it has been sent to the client
                // fs.unlinkSync(zipPath);
            });
        } else {
            return res.status(400).jsonp('Invalid request');
        }
    } catch (error) {
        console.error(error);
        return res.status(400).jsonp(error);
    }
});


app.get('/node/download', async (req, res) => {
    const { fileUrl, authToken, forResultFile } = req.query;
    const { pwd } = req.query
    const username = getUserFromToken(authToken);
    let filePath = '';

    if (!fileUrl) {
        return res.status(400).jsonp('Invalid request');
    }
    
    if (pwd && pwd.includes("publicDatasets")) {
        filePath = path.join(storageDir, fileUrl);
    } else if (pwd && pwd.includes("jobResults")) {
        filePath = fileUrl;
    } else {
        filePath = path.join(storageDir, username, fileUrl);
    }

    try {
        const fileStat = await fs.promises.stat(filePath);

        if (fileStat.isFile()) {
            // Download file
            const filename = path.basename(fileUrl);
            const mimetype = mime.getType(filePath, { legacy: true });

            res.setHeader('Content-disposition', 'attachment; filename=' + filename);
            res.setHeader('Content-type', mimetype);

            const filestream = fs.createReadStream(filePath);
            console.log('Filename: ' + filename)
            filestream.pipe(res);
        } else if (fileStat.isDirectory()) {
            // Download folder as zip
            const folderName = path.basename(filePath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.directory(filePath, folderName);
            archive.pipe(res);

            res.setHeader('Content-disposition', 'attachment; filename=' + folderName + '.zip');
            res.setHeader('Content-type', 'application/zip');

            archive.finalize();
        } else {
            return res.status(400).jsonp('Invalid request');
        }
    } catch (error) {
        console.error(error);
        return res.status(400).jsonp(error);
    } 
});


// Define the route handler for downloading a file
app.get('/node/download2/:id', async (req, res) => {
    try {
        const id = req.params.id;

        // Create a new MongoClient
        const client = new MongoClient(mongoUrl, { useUnifiedTopology: true });

        // Connect to the MongoDB server
        await client.connect();
        console.log('Connected to MongoDB'); // Log message indicating successful connection

        // Select the database
        const db = client.db(dbName);
        console.log(`Selected database: ${db}`); // Log message indicating selected database

        // Select the collection
        const collection = db.collection(datasetCollection);
        console.log(`Selected collection: ${datasetCollection}`); // Log message indicating selected collection

        // Fetch the document where the ID matches
        const document = await collection.findOne({ Id: id });

        if (!document) {
            console.error('Document not found for ID:', id);
            res.status(404).send('Document not found');
            return;
        }

        // Get the adata_path from the matched document
        const filePath = document.adata_path;

        // Check if the file exists
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                console.error('Error accessing file:', err);
                res.status(404).send('File not found');
                return;
            }

            // Set appropriate headers for file download
            res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Length', fs.statSync(filePath).size); // Set Content-Length based on file size

            // Pipe the file stream directly to the response
            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(res);
        });

        // Close the MongoDB connection when done
        await client.close();
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/node/fetchPreview', async (req, res) => {
    const { fileUrl, authToken, forResultFile } = req.query;
    const username = getUserFromToken(authToken);
    let filePath = '';

    if (!fileUrl) {
        return res.status(400).jsonp('Invalid request');
    }

    if (!forResultFile)
        filePath = `${storageDir}/${username}/${fileUrl}`;
    else
        filePath = `${intermediateStorage}/${fileUrl}`;

    console.log('file: ' + filePath);
    const fileStat = await fs.promises.stat(filePath);

    if (fileStat.isFile()) {
        // Read first 100 lines of the file
        const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
        let lines = '';

        fileStream.on('data', (data) => {
            lines += data;

            // Check if 100 lines have been read
            if (lines.split('\n').length >= 20) {
                fileStream.destroy();
            }
        });

        fileStream.on('close', () => {
            res.status(200).send(lines);
        });

        fileStream.on('error', (error) => {
            console.log('Error reading file: ' + error);
            res.status(500).jsonp('Error reading file');
        });
    } else {
        return res.status(400).jsonp('Invalid request');
    }
});


app.delete('/node/deleteFiles', async (req, res) => {
    const { fileList } = req.body;
    const { authToken } = req.query;
    const { pwd } = req.query
    const isAdmin = req.query.isAdmin;
    const uname = getUserFromToken(authToken);
    if (uname === 'Unauthorized') {
        return res.status(403).json('Unauthorized');
    }
    if (fileList && Array.isArray(fileList)) {
        let successCount = 0;
        let errorCount = 0;
        let failFlag = false;
        for (const file of fileList) {
            try {
                const [rows, fields] = await pool.promise().execute(`SELECT f.file_loc FROM oscb.file f JOIN oscb.dataset d ON f.dataset_id = d.dataset_id JOIN oscb.users u ON d.user_id = u.user_id WHERE u.username = '${uname}' AND f.file_loc like '${file.replace("'", "''")}%';`);
                console.log('Count: ' + rows.length);
                if (rows.length > 0) {
                    res.status(401).json({ message: 'File(s) being used by datasets.' });
                    return;
                } else {
                    let filePath = ""
                    if (pwd.includes("publicDatasets")) {
                        filePath = `${storageDir}${file}`;
                    } else {
                        filePath = `${storageDir}${uname}/${file}`;
                    }
                    console.log(filePath);
                    try {
                        if (fs.existsSync(filePath)) {
                            fs.removeSync(filePath);
                            // file or folder removed
                            successCount++;
                        } else {
                            console.log('Error Deleting: ' + filePath);
                            errorCount++;
                        }
                    } catch (err) {
                        console.error(err);
                        errorCount++;
                    }
                }
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: 'Internal Server Error' });
                return;
            }
        }
        return res.jsonp({ success: successCount, errorCount: errorCount });
    } else {
        return res.status(400).jsonp('Invalid request');
    }
});


const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
    };
    const formattedDate = date.toLocaleDateString('en-GB', options);
    return formattedDate;
}

app.get('/node/getDirContents', async (req, res) => {
    try {
        console.log(`HOSTURL: ${process.env.HOST_URL}`);
        const { dirPath, authToken, usingFor } = req.query;

        let uid = getUserFromToken(authToken);
        if (uid == "Unauthorized") {
            return res.status(403).jsonp(uid);
        }

        subdir = req.query.subdir;
        var directoryPath = ""

        
        var directoryPath = path.join(storageDir + uid + "/" + dirPath + "/");
        
        if (subdir != undefined)
            directoryPath = path.join(storageDir + uid + "/", subdir);

        if (dirPath == "publicDatasets") {
            directoryPath = publicStorage;
        }

        if (dirPath.includes("publicDatasets/")) {
            directoryPath = "/usr/src/app/storage/" + dirPath;
        }

        // Check if the directory exists
        if (!fs.existsSync(directoryPath)) {
            // Create the directory if it doesn't exist
            fs.mkdirSync(directoryPath, { recursive: true });
            console.log(`Directory "${directoryPath}" created successfully.`);
        } else {
            console.log(`Directory "${directoryPath}" already exists.`);
        }
        
        const directoryContents = fs.readdirSync(directoryPath);
        const dirList = [];
        const fileList = [];


        directoryContents.forEach((item) => {
            const itemPath = `${directoryPath}/${item}`;
            const itemStats = fs.statSync(itemPath);


            if (itemStats.isDirectory() == true)
                dirList.push({ "name": item, "created": formatDate(itemStats.birthtime) });
            else {
                let dotIndex = item.lastIndexOf('.');
                fileList.push({ "name": item, "created": formatDate(itemStats.birthtime), "type": (dotIndex != -1 ? item.substring(dotIndex + 1).toUpperCase() + " " : "") });
            }
        });

        return res.json({ 'Directories': dirList, 'Files': fileList });

    }
    // uid = req.session.username;
    catch (e) {
        console.log('Errordsd: ' + e);
        // return res.status(400).jsonp('Invalid request');
    }

});


app.post('/node/upload', async (req, res) => {
    let { uploadDir, authToken, publicDatasetFlag } = req.query;
    let username = getUserFromToken(authToken);

    let destDir = publicDatasetFlag === "true" ? "./storage/" + uploadDir : "./storage/" + username + uploadDir;

    let tempDir = './uploads'; 

    let storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, tempDir);
        },
        filename: (req, file, cb) => {
            console.log(file.originalname);
            cb(null, file.originalname);
        },
    });

    let uploadFiles = multer({
        storage: storage,
        // limits: { fileSize: FILE_UPLOAD_MAX_SIZE },
    }).array("files", 10);

    let uploadFunction = util.promisify(uploadFiles);

    try {
        await uploadFunction(req, res);

        // Move uploaded files to storage directory
        let files = req.files;
        for (let i = 0; i < files.length; i++) {
            let file = files[i];
            let tempFilePath = path.join(tempDir, file.filename);
            let destFilePath = path.join(destDir, file.originalname);

            console.log(`Tempstorage: ${tempFilePath}, DestinationL ${destFilePath}`);
            if (!fs.existsSync(path.join(destDir))) {
                fs.mkdirSync(path.join(destDir), { recursive: true });
            }

            fs.copyFileSync(tempFilePath, destFilePath);
            fs.unlinkSync(tempFilePath);
        }

        res.status(200).json({ message: 'File uploaded successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to upload file', error });
    }
});


app.post('/node/createNewFolder', (req, res) => {
    const { pwd, folderName, authToken } = req.query;
    const username = getUserFromToken(authToken);
    let folderPath = ""
    if (pwd.includes("publicDatasets")) {
        folderPath = `/usr/src/app/storage/${pwd}/${folderName}`;
    } else {
        folderPath = `${storageDir}/${username}/${pwd}/${folderName}`;
    }
    if (fs.existsSync(folderPath)) {
        res.status(400).jsonp('Folder already exists');
        return;
    }
    try {
        fs.promises.mkdir(folderPath);
        res.status(201).jsonp('Folder created')
    }
    catch (err) {
        res.status(404).jsonp('Bad root folder: ' + err);
    }
})

const { exec } = require('child_process');

app.get('/node/getStorageDetails', async (req, res) => {
    const sizeRegex = /^(\d+(\.\d+)?)\s*([KMG]B?)$/i;
    try {
        const { authToken } = req.query;

        let username = getUserFromToken(authToken);
        if (username === "Unauthorized") {
            return res.status(403).jsonp(uid);
        }

        const cmd = `du -sh ${storageDir}/${username}`;
        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (stderr) {
                console.error(stderr);
                return res.status(500).json({ error: 'Internal server error' });
            }
            const [size, folder] = stdout.split('\t');
            const match = size.match(sizeRegex);
            const [_, value, __, unit] = match;
            const gigabytes = parseFloat(value) / ({ K: 1024 * 1024, M: 1024, G: 1 }[unit.toUpperCase()]);

            console.log(`disk utilization: ${gigabytes} GB, folder: ${folder}`);

            return res.json({ used: gigabytes.toFixed(2), allowed: storageAllowance });
        });
    } catch (e) {
        console.log('Error in getting Storage usage: ' + e);
        return res.status(400).jsonp('Invalid request');
    }
});

// Route to get datasets and files for a specific user
app.get('/node/preview/datasets', (req, res) => {

    const { authToken } = req.query;

    const username = getUserFromToken(authToken);

    if (username == "Unauthorized") {
        return res.status(403).jsonp(username);
    }

    // Get user ID based on username
    const userQuery = `SELECT user_id FROM users WHERE username = '${username}'`;

    pool.query(userQuery, (err, userResult) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        if (userResult.length === 0) {
            res.status(404).send(`User '${username}' not found`);
        } else {
            const userID = userResult[0].user_id;

            // Get datasets and files for the specified user
            const datasetsQuery = `
          SELECT dataset.dataset_id, dataset.title, dataset.n_cells, dataset.reference, dataset.summary, file.file_id, file.file_loc, SUBSTRING_INDEX(SUBSTRING_INDEX(file.file_loc, '/', 2), '/', -1) AS direc
          FROM dataset
          JOIN file ON dataset.dataset_id = file.dataset_id
          WHERE dataset.user_id = ${userID}
        `;

            pool.query(datasetsQuery, (err, datasetsResult) => {
                if (err) {
                    console.error('Database query error:', err);
                    return res.status(500).json({ message: 'Internal Server Error' });
                }

                const datasets = {};

                datasetsResult.forEach(row => {
                    const { dataset_id, title, n_cells, reference, summary, file_id, file_loc, direc } = row;
                    if (!datasets[dataset_id]) {
                        datasets[dataset_id] = {
                            title,
                            n_cells,
                            reference,
                            summary,
                            files: [],
                            direc,
                            dataset_id
                        };
                    }
                    datasets[dataset_id].files.push({
                        file_id,
                        file_loc
                    });
                });

                res.json(datasets);
            });
        }
    });
});


// Define API endpoint
app.get('/node/tools/leftnav', function (req, res) {
    // Query the category and filter tables and group the filters by category
    const sql = 'SELECT c.id AS category_id, c.name AS category_name, ' +
        'JSON_ARRAYAGG(f.name) AS filters ' +
        'FROM categories c ' +
        'LEFT JOIN filters f ON c.id = f.category_id ' +
        'GROUP BY c.id ' +
        'ORDER BY c.id ASC';
    pool.query(sql, function (error, results, fields) {
        if (error) {
            console.log(error);
            res.status(500).send('Internal server error');
        } else {
            res.json(results);
        }
    });
});

app.post('/node/job/create', async (req, res) => {
    const client = new MongoClient(mongoUrl);
    
    try {
        const date = new Date();
        const timestamp = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
        const formData = req.body;
        formData['Created on'] = timestamp;
        
        // Connect to the MongoDB server
        await client.connect();
        const db = client.db(dbName);

        const collection = db.collection(jobsCollection);
        
        await collection.insertOne(formData);
        console.log('Job is created successfully');

        res.status(200).json({ message: 'Job is created successfully' });
        
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ error: err });
    } finally {
      // Ensure the client will close when you finish/error
      await client.close();
    }
});

// Route to retrieve documents from task_results collection
app.post('/node/getJobs', verifyJWTToken, async (req, res) => {
    const client = new MongoClient(mongoUrl);

    try {
        const top = parseInt(req.query.top) || 0;
        const username = req.user.username;
        const curent = parseInt(req.query.page, 10) || 1;
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        let globalSearchQuery = req.query.q;
        const filters = req.body.filters || null;

        // const fieldsWithLabel = ['Process', 'Method', 'Category', 'Status', 'Created on', 'Completed on'];

        let matchConditions = [];

        // Global search query
        if (globalSearchQuery) {
            matchConditions.push({
                $or: [
                    { 'job_id': { $regex: globalSearchQuery, $options: 'i' } },
                    { 'Category': { $regex: globalSearchQuery, $options: 'i' } },
                    { 'Method': { $regex: globalSearchQuery, $options: 'i' } },
                    { 'Process': { $regex: globalSearchQuery, $options: 'i' } },
                    { 'Created on': { $regex: globalSearchQuery, $options: 'i' } },
                    { 'Completed on': { $regex: globalSearchQuery, $options: 'i' } },
                    { 'Description': { $regex: globalSearchQuery, $options: 'i' } },
                    { 'Status': { $regex: globalSearchQuery, $options: 'i' } },
                    {
                        'process_ids': {
                            $elemMatch: {
                                value: { $regex: globalSearchQuery, $options: 'i' }
                            }
                        }
                    },
                ],
            });
        }

        // Apply additional filters
        if (filters) {
            Object.keys(filters).forEach((filterCategory) => {
                const filterValue = filters[filterCategory];
                if (Array.isArray(filterValue) && filterValue.length > 0) {
                    let condition = {};
                    // Directly use the filter category for other fields
                    condition[filterCategory] = { $in: filterValue };
                    // Add this condition to the matchConditions array
                    matchConditions.push(condition);
                }
            });
        }

        let userConditions = [];
        userConditions.push({ 'created_by': username });
        matchConditions.push({ $or: userConditions });

        let matchStage = {};
        if (matchConditions.length > 0) {
            matchStage = matchConditions.length > 1 ? { $and: matchConditions } : matchConditions[0];
        }

        // Connect to the MongoDB server
        await client.connect();
        const db = client.db(dbName);
    
        // Get reference to the task_results collection
        const collection = db.collection(jobsCollection);

        // Define the pipeline for facets
        const facetsPipeline = [
            { $match: matchStage },
            {
                $facet: {
                    // Each facet is directly within $facet and maps to its pipeline
                    'Description': [
                        { $group: { _id: '$Description', count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ],
                    'Category': [
                        { $group: { _id: { $ifNull: ["$Category", "N/A"] }, count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ],
                    'Process': [
                        { $group: { _id: '$Process', count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ],
                    'Method': [
                        { $group: { _id: '$Method', count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ],
                    // More facets as per your requirement
                    'Status': [
                        { $group: { _id: { $ifNull: ["$Status", "N/A"] }, count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ],
                    'Created on': [
                        // { $group: { _id: { $ifNull: ["$Created on", ""] }, count: { $sum: 1 } } },
                        { $group: { _id: { $ifNull: ["$Created on", "N/A"] }, count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ],
                    'Completed on': [
                        // { $group: { _id: { $ifNull: ["$Completed on", ""] }, count: { $sum: 1 } } },
                        { $group: { _id: { $ifNull: ["$Completed on", "N/A"] }, count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ],
                    'job_id': [
                        { $group: { _id: '$job_id', count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ],
                    documents: [
                        {
                            $project:
                            {
                                job_id: "$job_id",
                                Description: "$Description",
                                Category: { $ifNull: ["$Category", "N/A"] },
                                Process: "$Process",
                                Method: "$Method",
                                Status: { $ifNull: ["$Status", "N/A"] },
                                'Created on': { $ifNull: ["$Created on", "N/A"] },
                                'Completed on': { $ifNull: ["$Completed on", "N/A"] },
                            }
                        }
                    ]
                }
            }
        ];

        // Get the facets
        const facetsResult = await collection.aggregate(facetsPipeline).toArray();

        // Pagination: Get total count for the query
        const totalCount = await collection.countDocuments(matchStage);

        // Build the pipeline for search results with pagination
        const searchResultsPipeline = [
            { $match: matchStage },
            {
                $project: { job_id: 1, 'Job ID': "$job_id", Description: 1, Category: { $ifNull: ["$Category", "N/A"] }, Process: 1, Method: 1, Status: { $ifNull: ["$Status", "N/A"] }, 'Created on': { $ifNull: ["$Created on", "N/A"] }, 'Completed on': { $ifNull: ["$Completed on", "N/A"] }, process_ids: 1, datasetURL: 1, results: 1, output: 1 }
            }, // Excluding fields
            { $sort: { 'Created on': -1 } },
            // { $skip: (page - 1) * pageSize },
            // { $limit: pageSize },
        ];

        if (top > 0) {
            searchResultsPipeline.push({ $limit: top });
        }

        // Get the paginated search results
        const searchResults = await collection.aggregate(searchResultsPipeline).toArray();

        res.status(200).json({
            facets: facetsResult[0],
            results: searchResults,
            pagination: {
                curent: curent,
                pageSize: pageSize,
                pageCount: Math.ceil(totalCount / pageSize),
                totalCount: totalCount
            }
        });
    } catch (error) {
        console.error('Search failed:', error);
        res.status(500).send('An error occurred while fetching jobs.');
    } finally {
        // Ensure the MongoDB client is always closed, even if an error occurs
        if (client) {
            await client.close();
        }
    }
});

const getProcessFolder = (filePath, processId) => {
    if (!filePath) return null;
    const normalizedPath = path.normalize(filePath);
    const processIdIndex = normalizedPath.lastIndexOf(processId);
    if (processIdIndex !== -1) {
        return normalizedPath.substring(0, processIdIndex + processId.length);
    }
    return null;
};

const emptyDirectory = async (dirPath) => {
    try {
        if (await fs.pathExists(dirPath)) {
            await fs.emptyDir(dirPath);
            console.log(`Emptied contents of directory: ${dirPath}`);
        }
    } catch (error) {
        console.error(`Error emptying folder ${dirPath}:`, error);
    }
};

async function cleanUpJobData(jobId, username) {
    const client = new MongoClient(mongoUrl);

    try {
        await client.connect();
        const db = client.db(dbName);

        const jobsCollection = db.collection('jobs');
        const ppResultsCollection = db.collection('pp_results');
        const datasetsCollection = db.collection('datasets');
        const userDatasetsCollection = db.collection('user_datasets');
        const largeDocsCollection = db.collection('large_documents');

        // 1. Verify Job Ownership
        const job = await jobsCollection.findOne(
            { job_id: jobId, created_by: username },
            { projection: { process_ids: 1, _id: 0 } }
        );

        if (!job || !job.process_ids || job.process_ids.length === 0) {
            console.log(`Job ID ${jobId} not found, does not belong to user ${username}, or has no process_ids. Aborting.`);
            console.log(`Deleting job ${jobId}...`);
            const res = await jobsCollection.deleteOne({ job_id: jobId, created_by: username });
            if (res.deletedCount === 0) {
                return false;
            } else {
                return true;
            }
        }

        const originalProcessIds = job.process_ids;

        // 2. Verify pp_results Ownership
        const ppDocs = await ppResultsCollection.find(
            { process_id: { $in: originalProcessIds }, created_by: username },
            { projection: { process_id: 1, adata_path: 1, zarr_path: 1, _id: 0 } }
        ).toArray();

        const validProcessIds = ppDocs.map(doc => doc.process_id);

        if (validProcessIds.length === 0) {
            console.log(`None of the process_ids belong to user '${username}'. Skipping.`);
        }

        // ==========================================
        // NEW STEP: Filter out Shared process_ids
        // ==========================================
        const otherJobs = await jobsCollection.find(
            {
                job_id: { $ne: jobId }, // Exclude the current job
                process_ids: { $in: validProcessIds } // Look for jobs sharing these IDs
            },
            { projection: { process_ids: 1, _id: 0 } }
        ).toArray();

        const sharedProcessIds = new Set();
        otherJobs.forEach(otherJob => {
            if (otherJob.process_ids) {
                otherJob.process_ids.forEach(pid => sharedProcessIds.add(pid));
            }
        });

        // Keep only the process_ids that are NOT in the shared set
        const processIdsToDelete = validProcessIds.filter(pid => !sharedProcessIds.has(pid));

        if (processIdsToDelete.length === 0) {
            console.log(`All process_ids are being used by other jobs. Nothing to delete. Skipping.`);
        }

        console.log(`Safe to delete process_ids: ${processIdsToDelete.join(', ')}`);

        // 3. File System Cleanup (Using ONLY processIdsToDelete)
        const foldersToClean = new Set();
        ppDocs.forEach(doc => {
            if (processIdsToDelete.includes(doc.process_id)) {
                if (doc.adata_path) {
                    const folder = getProcessFolder(doc.adata_path, doc.process_id);
                    if (folder) foldersToClean.add(folder);
                }
                if (doc.zarr_path) {
                    const folder = getProcessFolder(doc.zarr_path, doc.process_id);
                    if (folder) foldersToClean.add(folder);
                }
            }
        });

        console.log(`Found ${foldersToClean.size} folders to clear on the file system.`);
        for (const folder of foldersToClean) {
            await emptyDirectory(folder);
        }

        // 4. Database Cleanup
        const processIdRegexes = processIdsToDelete.map(id => new RegExp(`^${escapeRegex(id)}`));

        const [
            deletePpResults, updateDatasets, updateUserDatasets, deleteLargeDocs
        ] = await Promise.all([
            ppResultsCollection.deleteMany({ process_id: { $in: processIdsToDelete } }),
            datasetsCollection.updateMany({ process_ids: { $in: processIdsToDelete } }, { $pullAll: { process_ids: processIdsToDelete } }),
            userDatasetsCollection.updateMany({ process_ids: { $in: processIdsToDelete } }, { $pullAll: { process_ids: processIdsToDelete } }),
            largeDocsCollection.deleteMany({ document_id: { $in: processIdRegexes } })
        ]);

        console.log(`Deleted ${deletePpResults.deletedCount} documents from 'pp_results'.`);
        console.log(`Updated ${updateDatasets.modifiedCount} documents in 'datasets'.`);
        console.log(`Updated ${updateUserDatasets.modifiedCount} documents in 'user_datasets'.`);
        console.log(`Deleted ${deleteLargeDocs.deletedCount} documents from 'large_documents'.`);

        // 5. After cleaning up related pp_results, delete the job document from the jobs collection
        const result = await jobsCollection.deleteOne({ job_id: jobId, created_by: username });

        if (result.deletedCount === 0) {
            return false;
        } else {
            return true;
        }

    } catch (error) {
        console.error("Error during cleanup operation:", error);
    } finally {
        await client.close();
    }
}

app.delete('/node/deleteJob', verifyJWTToken, async (req, res) => {
    const jobID = req.query.jobID;
    const username = req.user.username;
    console.log("jobID: ", jobID);
    console.log("username: ", username);

    if (!jobID) {
        return res.status(400).json({ error: 'Job ID is required' });
    }

    try {
        result = await cleanUpJobData(jobID, username);

        if (result === false) {
            return res.status(404).json({ error: 'Document not found' });
        } else {
            res.status(200).json({ message: 'Job is deleted successfully' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
        console.error('Error deleting job:', err);
    } 
});


app.put('/node/updateTaskStatus', (req, res) => {
    const { job_ids, status } = req.body;
    const jobIdsArr = job_ids.split(',');

    pool.getConnection(function (err, connection) {
        if (err) {
            console.error('Error getting DB connection:', err);
            return res.status(500).json({ message: 'Database connection error' });
        }

        connection.beginTransaction(function (err) {
            if (err) {
                console.error('Error starting transaction:', err);
                connection.release();
                return res.status(500).json({ message: 'Transaction error' });
            }

            const date = new Date();
            const timestamp = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
            connection.query('UPDATE task SET status = ?, finish_datetime = ? WHERE job_id IN (?)', [status, timestamp, jobIdsArr], function (err, taskResult) {
                if (err) {
                    console.error('Error in UPDATE query:', err);
                    connection.rollback(function () {
                        connection.release();
                    });
                    return res.status(500).json({ message: 'Database update error' });
                } else {
                    // Commit transaction
                    connection.commit(function (err) {
                        if (err) {
                            console.error('Error committing transaction:', err);
                            connection.rollback(function () {
                                connection.release();
                            });
                            return res.status(500).json({ message: 'Transaction commit error' });
                        }

                        console.log('Transaction completed successfully');
                        connection.release();
                        res.status(200).jsonp('Task status updated.');
                    });
                }
            });
        });
    });
});


// app.get('/getJobs', (req, res) => {
//     const { authToken } = req.query;
//     const username = getUserFromToken(authToken);

//     pool.getConnection(function (err, connection) {
//         if (err) {
//             console.error('Error getting DB connection:', err);
//             return res.status(500).json({ message: 'Database connection error' });
//         }

//         connection.beginTransaction(function (err) {
//             if (err) {
//                 console.error('Error starting transaction:', err);
//                 connection.release();
//                 return res.status(500).json({ message: 'Transaction error' });
//             }
//             connection.query('SELECT user_id FROM users WHERE username = ? LIMIT 1', [username], function (err, userRows) {
//                 if (err) {
//                     console.error('Database query error:', err);
//                     return res.status(500).json({ message: 'Internal Server Error' });
//                 }

//                 const userId = userRows[0].user_id;

//                 if (!userId) {
//                     res.status(400).send('User not found');
//                     connection.rollback(function () {
//                         connection.release();
//                     });
//                     return;
//                 }

//                 connection.query('SELECT task_title, job_id, results_path, tool, status, created_datetime, finish_datetime FROM task WHERE user_id = ?', [userId], function (err, rows) {
//                     if (err) {
//                         console.error('Error committing transaction:', err);
//                         connection.rollback(function () {
//                             connection.release();
//                         });
//                         return res.status(500).json({ message: 'Transaction commit error' });
//                     } else {
//                         connection.release();
//                         res.json(rows);
//                     }
//                 });
//             });
//         });
//     });
// });


// Connect to MongoDB and retrieve options
app.get('/node/options', async (req, res) => {
    try {
        const client = new MongoClient(mongoUrl, { useUnifiedTopology: true });

        // Connect to the MongoDB server
        await client.connect();

        const db = client.db(dbName);
        const collection = db.collection(optionsCollectionName);

         // Define the unique compound index on 'field' and 'name'
         await collection.createIndex({ field: 1, name: 1 }, { unique: true });

        // Use the aggregation framework to group options by field
        const pipeline = [
            {
                $group: {
                    _id: '$field',
                    options: { $addToSet: { name: '$name', abbreviation: '$abbreviation' } },
                },
            },
        ];

        const result = await collection.aggregate(pipeline).toArray();

        // Transform the result into an object with field names as keys
        const optionsByField = {};
        result.forEach((item) => {
            optionsByField[item._id] = item.options;
        });

        // Close the MongoDB connection
        client.close();

        // Return the options as a JSON response
        res.status(200).json(optionsByField);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.post('/node/submitDatasetMetadata', async (req, res) => {
    const client = new MongoClient(mongoUrl);

    try {
        const formData = req.body; // This assumes you have middleware to parse JSON in the request body
        const makeItpublic = formData.makeItpublic;
        let files = formData.files;
        let inputFiles = formData.inputFiles;
        let username = formData.Owner;

        // Connect to the MongoDB server
        await client.connect();
        const db = client.db(dbName);
        const collection = formData.flow == "Benchmark" ? db.collection(datasetCollection) : db.collection(userDatasetsCollection);

        // Check if a document with the provided Id already exists
        const existingDocument = await collection.findOne({ Id: formData.Id });

        if (existingDocument) {
            console.log('Document with Id already exists:', formData.Id);
            removeFiles(inputFiles); // Remove original input files
            res.status(400).json({ error: 'Document with the provided Id already exists' });
        } else {
            // Document with the provided Id does not exist, proceed with insertion
            await collection.insertOne(formData);
            console.log('Metadata is submitted successfully');

            if (makeItpublic) {
                console.log("Transfering files from local to public folder");
                try {
                    let dirName = "";
                    const fromPublic = false;
                    if (files && files.length > 0) {
                        dirName = path.dirname(files[0]);
                    }

                    let userPrivateStorageDir = storageDir + username; // Change this to the user's private storage path
                    if (formData.flow == "Benchmark") {
                        removeFiles(inputFiles); // Remove original input files
                        formData.inputFiles = formData.adata_path;
                    }

                    // Copy files from user's private storage to public dataset directory
                    await copyFiles(userPrivateStorageDir, publicStorage, dirName, files, fromPublic);

                } catch (err) {
                    console.error(err);
                }
            }

            // Update unique cell type labels to a JSON file
            // Retrieve unique values for the field "Selected Cell Types.label"
            try {
                const uniqueCellLabelsPublic = await db.collection(datasetCollection).distinct("Selected Cell Types.label", { "Selected Cell Types.label": { $ne: "Unspecified" } });
                const uniqueCellLabelsUser = await db.collection(userDatasetsCollection).distinct("Selected Cell Types.label", { "Selected Cell Types.label": { $ne: "Unspecified" } });
                const uniqueCellLabels = [...new Set([...uniqueCellLabelsPublic, ...uniqueCellLabelsUser])];
                const jsonString = JSON.stringify(uniqueCellLabels, null, 2);
                fs.writeFileSync(storageDir + 'uniqueCellLabels.json', jsonString, 'utf8');
            } catch (err) {
                console.error('Error updating unique cell labels:', err);
            }

            res.status(200).json({ message: 'Metadata is submitted successfully' });
        }
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        // Ensure the client will close when you finish/error
        await client.close();
    }
});


app.post('/node/submitTaskMetadata', async (req, res) => {
    const client = new MongoClient(mongoUrl);
  
    try {
      await client.connect();
      const db = client.db(dbName);
      const collection = db.collection(benchmarksCollection);
  
      let documents = req.body;
      // Ensure documents is always an array for consistency
      if (!Array.isArray(documents)) {
        documents = [documents];
      }
  
      const updateResults = [];
      for (const formData of documents) {
        // // Check if a document with the provided Id already exists
        // const existingDocument = await collection.findOne({ Id: formData.Id });
  
        // if (existingDocument) {
        //   console.log('Document with Id already exists:', formData.Id);
        //   updateResults.push({
        //     Id: formData.Id,
        //     status: 'error',
        //     message: 'Document with the provided Id already exists',
        //   });
        // } else {
        //   // Document with the provided Id does not exist, proceed with insertion
        //   await collection.insertOne(formData);
        //   console.log('Form data submitted successfully for Id:', formData.Id);
        //   updateResults.push({
        //     Id: formData.Id,
        //     status: 'success',
        //     message: 'Form data submitted successfully',
        //   });
        // }
        const query = { benchmarksId: formData.Id };
        const update = { $set: formData };
        // const options = { upsert: true };
        // await collection.updateOne(query, update, options);
        await collection.updateOne(query, update);
          console.log('Benchmarks submitted successfully for Id:', formData.Id);

        updateResults.push({
            Id: formData.Id,
            status: 'success',
            message: 'Benchmarks submitted successfully',
        });
      }
  
      // If handling multiple documents, you might want to aggregate results and respond accordingly
      if (updateResults.length > 1) {
        // Respond with the aggregated results for multiple documents
        res.status(200).json(updateResults);
      } else if (updateResults.length === 1) {
        // For a single document, you can respond with the single result
        const result = updateResults[0];
        if (result.status === 'success') {
          res.status(200).json({ message: result.message });
        } else {
          res.status(400).json({ error: result.message });
        }
      } else {
        // No documents were processed
        res.status(400).json({ error: 'No documents were submitted' });
      }
    } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    } finally {
      await client.close();
    }
  });
  
app.post('/node/updateDatasetDetails', async (req, res) => {
    const client = new MongoClient(mongoUrl);

    try {
        await client.connect();
        const db = client.db(dbName);
        const { Id, ...updateFields } = req.body;

        let collection = (Id.startsWith("U-") && Id.includes("@")) 
                                                    ? db.collection(userDatasetsCollection) 
                                                    : db.collection(datasetCollection);


        if (!Id) {
            return res.status(400).json({ error: 'Document Id is required' });
        }

        const result = await collection.updateOne(
            { Id: Id },  // Query to find the document by the custom Id field
            { $set: updateFields } // Update only the specified fields
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.status(200).json({ message: 'Document updated successfully' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        await client.close();
    }
});

// API endpoint to get datasets
app.get('/node/getDatasets', async (req, res) => {
    const client = new MongoClient(mongoUrl);

    try {
        // Connect to the MongoDB server
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(datasetCollection);

        // Fetching all documents from the collection
        const datasets = await collection.find({}).toArray();

        // Sending the datasets as a JSON response
        res.status(200).json(datasets);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        // Ensure the client will close when you finish/error
        await client.close();
    }
});


// Define a route to handle adding a new option to MongoDB
app.post('/node/addNewOption', async (req, res) => {
    const { field, name, username } = req.body;

    // Create the document object with the specified format
    const newOption = {
        field: field,
        name: name,
        username: username
    };  
    try {
      const client = new MongoClient(mongoUrl, { useUnifiedTopology: true });
      await client.connect();
  
      const db = client.db(dbName);
      const collection = db.collection(optionsCollectionName);
      
    // Define the unique compound index on 'field' and 'name'
    await collection.createIndex({ field: 1, name: 1 }, { unique: true });
  
      // Insert the new option into the collection
      const insertResult = await collection.insertOne(newOption);
  
      client.close();
  
      res.status(200).json({
        message: `New option "${name}" added to MongoDB for field "${field}"`,
        insertedId: insertResult.insertedId,
      });
    } catch (error) {
      console.error('Error adding new option to MongoDB:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


// Connect to MongoDB and retrieve options
app.get('/node/groupedUserOptions', async (req, res) => {
    try {
        const client = new MongoClient(mongoUrl, { useUnifiedTopology: true });

        // Connect to the MongoDB server
        await client.connect();

        const db = client.db(dbName);
        const collection = db.collection(optionsCollectionName);

        const username = req.query.username;
        const isAdmin = req.query.isAdmin;

        // Define the match stage of the aggregation pipeline
        const matchStage = isAdmin === 'true' ? {} : { username: username };

        // Aggregation pipeline stages
        const pipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: '$field',
                    options: { $addToSet: { _id: '$_id', name: '$name', username: '$username', abbreviation: '$abbreviation' } },
                },
            },
        ];

        const result = await collection.aggregate(pipeline).toArray();

        // Transform the result into an object with field names as keys
        const optionsByField = {};
        result.forEach((item) => {
            optionsByField[item._id] = item.options;
        });

        // Close the MongoDB connection
        client.close();

        // Return the options as a JSON response
        res.status(200).json(optionsByField);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Define a DELETE route to delete selected options
app.delete('/node/deleteOptions', async (req, res) => {
    try {
      const optionIds = req.body.optionIds; // Assuming the request body contains an array of option IDs

      const client = new MongoClient(mongoUrl, { useUnifiedTopology: true });

      // Connect to the MongoDB server
      await client.connect();

      const db = client.db(dbName);
      const collection = db.collection(optionsCollectionName);
  
      // Convert optionIds to MongoDB ObjectIDs
      const objectIds = optionIds.map(id => new ObjectId(id));
  
      // Delete the options with the specified ObjectIDs
      const deleteResult = await collection.deleteMany({ _id: { $in: objectIds } });
  
      client.close();
  
      if (deleteResult.deletedCount > 0) {
        res.status(200).json({ message: 'Options deleted successfully' });
      } else {
        res.status(404).json({ message: 'Options not found' });
      }
    } catch (error) {
      console.error('Error deleting options:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  

// Define a route to handle adding a new option for Task field to MongoDB
app.post('/node/addTaskOption', async (req, res) => {
    const { field, name, username, abbreviation } = req.body;

    // Create the document object with the specified format
    const newOption = {
        field: field,
        name: name,
        username: username,
        abbreviation: abbreviation
    };  
    try {
      const client = new MongoClient(mongoUrl, { useUnifiedTopology: true });
      await client.connect();
  
      const db = client.db(dbName);
      const collection = db.collection(optionsCollectionName);
      
    // Define the unique compound index on 'field' and 'name'
    await collection.createIndex({ field: 1, name: 1 }, { unique: true });
  
      // Insert the new option into the collection
      const insertResult = await collection.insertOne(newOption);
  
      client.close();
  
      res.status(200).json({
        message: `New option "${name}" added to MongoDB for field "${field}"`,
        insertedId: insertResult.insertedId,
      });
    } catch (error) {
      console.error('Error adding new option to MongoDB:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


  //API to move files from one folder to another
  app.post('/node/move-files', (req, res) => {
      const { newDirectoryPath, isBenchmarks, jwtToken } = req.body;
    const username = getUserFromToken(jwtToken);
    let destinationPath = ""
    if (isBenchmarks) {
        destinationPath = `${storageDir}/Benchmarks/${newDirectoryPath}`;
    } else if (username) {
        destinationPath = `${storageDir}/${username}/${newDirectoryPath}`;
    }
    let sourcePath = `${storageDir}/tempStorage`;

    if (!fs.existsSync(destinationPath)) {
      fs.mkdirSync(destinationPath, { recursive: true });
    }
  
    const files = fs.readdirSync(sourcePath);
  
    files.forEach((filename) => {
      const sourcePathFile = path.join(sourcePath, filename);
      const destinationPathFile = path.join(destinationPath, filename);
      
      fs.renameSync(sourcePathFile, destinationPathFile);
    });
  
    res.sendStatus(200);
  });

  
app.delete('/node/storage/delete-file', (req, res) => {

    try {
        const { fileName, authToken, newDirectoryPath } = req.query;

        const uname = getUserFromToken(authToken);
        if (uname == 'Unauthorized')
            return res.status(403).jsonp('Unauthorized');
    
        let filepath = `${storageDir}/${newDirectoryPath}/${fileName}`;
        
    
        fs.unlink(filepath, (err) => {
            if (err) {
                console.error("Error deleting file:", err);
                return res.status(500).send('Error deleting file');
            }
            res.send('File deleted successfully');
        });
    } catch (error) {
        console.error('Error deleting a file:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.post('/node/storage/renameFile', async (req, res) => {

    try {

        let { oldName } = req.query;
        let { newName } = req.query;

        fs.rename(`${storageDir}${oldName}`, `${storageDir}${newName}`, (err) => {    
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'Internal Server Error' });
            } else {
                console.log('File renamed successfully!');
                return res.status(200).jsonp('File renamed successfully!');
            }
        });

    } catch (error) {
        console.error('Error renaming a file:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.post('/node/errorlogdata', async (req, res) => {
    console.log(mongoUrl)
    const client = new MongoClient(mongoUrl);
    console.log(52)

    try {
        // Connect to the MongoDB server
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(errorlogcollection);
        console.log(1234)

        // Create the document to insert into the collection
        const formData = {
            name: req.body.name,
            id: req.body.id,
            Result: req.body.taskResult,
            status: req.body.taskStatus,
            job_id: req.body.job_id,
            UserComments: req.body.userComments
        };
        // Insert the document into the collection
        const result = await collection.insertOne(formData);

        // Log the success message and send response
        console.log('Form data saved successfully:', result.insertedId);
        res.status(200).json({ message: 'Form data saved successfully' });
    } catch (err) {
        // Log and send error response
        console.log(400008)
        console.error('Error:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        // Ensure the client connection is closed
        await client.close();
    }
});


// Fetch facets and paginated results
app.post('/node/benchmarks/datasets/search', async (req, res) => {
    let client;
    try {
        client = new MongoClient(mongoUrl);
        await client.connect();

        const db = client.db(dbName);
        const datasetType = req.query.datasetType; // New parameter
        const collection = datasetType === "myDatasets" ? db.collection(userDatasetsCollection) : db.collection(datasetCollection);


      const page = parseInt(req.query.page, 10) || 1;
      const pageSize = parseInt(req.query.pageSize, 10) || 10;
      let globalSearchQuery = req.query.q; 
      const filters = req.body.filters;

      //Update this field accordingly whenever you add a new facet 
      // const fieldsWithLabel = ['Species', 'Anatomical Entity', 'Organ Part', 'Selected Cell Types', 'Disease Status (Donor)', 'Disease Status (Donor)'];
      const fieldsWithLabel = ['Species', 'Organ Part', 'Selected Cell Types', 'Disease Status (Donor)'];

      let matchConditions = [];

        // Add the global search query to the match conditions
        if (globalSearchQuery) {
            matchConditions.push({
                $or: [
                    { 'Species.label': { $regex: globalSearchQuery, $options: 'i' } },
                    { 'Author': { $regex: globalSearchQuery, $options: 'i' } },
                    // { 'Anatomical Entity.label': { $regex: globalSearchQuery, $options: 'i' } },
                    { 'Organ Part.label': { $regex: globalSearchQuery, $options: 'i' } },
                    {
                        'Selected Cell Types': {
                            $elemMatch: {
                                value: { $regex: globalSearchQuery, $options: 'i' }
                            }
                        }
                    },
                    {
                        'Disease Status (Donor)': {
                            $elemMatch: {
                                label: { $regex: globalSearchQuery, $options: 'i' }
                            }
                        }
                    },
                    // { 'Disease Status (Donor)': { 
                    //     $elemMatch: { 
                    //         label: { $regex: globalSearchQuery, $options: 'i' } 
                    //     } 
                    // }},
                ],
            });
        }

        // Apply additional filters
        if (filters) {
            Object.keys(filters).forEach((filterCategory) => {
                const filterValue = filters[filterCategory];
                if (Array.isArray(filterValue) && filterValue.length > 0) {
                    let condition = {};

                    if (filterCategory === 'Selected Cell Types') {
                        // Handle filtering for the 'Selected Cell Types' array
                        condition['Selected Cell Types.value'] = {
                            $in: filterValue
                        };
                    } 
                    // Check if the filter category should use the 'label' property for array of objects
                    else if (fieldsWithLabel.includes(filterCategory)) {
                        condition[`${filterCategory}.label`] = { $in: filterValue };

                    } else {
                        // Directly use the filter category for other fields
                        condition[filterCategory] = { $in: filterValue };
                    }

                    // Add this condition to the matchConditions array
                    matchConditions.push(condition);
                }
            });
        }

        // Construct the final match stage using $and, only if there are multiple conditions
        let matchStage = {};
        if (matchConditions.length > 0) {
            matchStage = matchConditions.length > 1 ? { $and: matchConditions } : matchConditions[0];
        }

      // Define the pipeline for facets
      const facetsPipeline = [
        { $match: matchStage },
        { $unwind: '$Selected Cell Types.value' },
        { $unwind: '$Disease Status (Donor)' },
            {
                $facet: {
            'Species': [
                    { $group: { _id: '$Species.label', uniqueValues: { $addToSet: '$Id' } } },
                    {
                        $project: {
                            _id: '$_id',
                            count: { $size: "$uniqueValues" }
                        }
                    }, 
                    { $sort: { count: -1 } } 
            ],
            'Author': [
                    { $group: { _id: '$Author', uniqueValues: { $addToSet: '$Id' } } },
                    {
                        $project: {
                            _id: '$_id',
                            count: { $size: "$uniqueValues" }
                        }
                    },
                    { $sort: { count: -1 } }
            ],
            //   'Anatomical Entity': [
            //     { $group: { _id: '$Anatomical Entity.label', count: { $sum: 1 } } }, { $sort: { count: -1 } } 
            //   ],
            'Organ Part': [
                    { $group: { _id: '$Organ Part.label', uniqueValues: { $addToSet: '$Id' } } },
                    {
                        $project: {
                            _id: '$_id',
                            count: { $size: "$uniqueValues" }
                        }
                    },
                    { $sort: { count: -1 } }
            ],
            'Selected Cell Types': [
                    { $group: { _id: '$Selected Cell Types.value', uniqueValues: { $addToSet: '$Id' } } },
                    {
                        $project: {
                            _id: '$_id',
                            count: { $size: "$uniqueValues" }
                        }
                    },
                    { $sort: { count: -1 } }
            ],
            'Disease Status (Donor)': [
                    { $group: { _id: '$Disease Status (Donor).label', uniqueValues: { $addToSet: '$Id' } } },
                    {
                        $project: {
                            _id: '$_id',
                            count: { $size: "$uniqueValues" }
                        }
                    },
                    { $sort: { count: -1 } }
            ],
        //   'Disease Status (Donor)': [
        //     { $group: { _id: '$Disease Status (Donor).label', count: { $sum: 1 } } }, { $sort: { count: -1 } } 
        //   ],
          // ... add other facets here
                }
            }
      ];
  
      // Get the facets
      const facetsResult = await collection.aggregate(facetsPipeline).toArray();
  
      // Pagination: Get total count for the query
      const totalCount = await collection.countDocuments(matchStage);
  
      // Build the pipeline for search results with pagination
      const searchResultsPipeline = [
        { $match: matchStage },
          {
              $project: { Id: 1, Title: 1, 'Species': 1, adata_path: 1, 'Cell Count Estimate': 1, 'Organ Part': 1, 'Dataset ID': "$Id", Owner: 1, 'Disease Status(Donor)': 1, 'Development Stage': 1, 'Author': 1, 'Submission Date': 1, 'Source': 1, process_ids: 1, Category: 1, cell_metadata_head: 1, obs_names: 1, uns: 1, varm: 1, embeddings: 1, mod_keys: 1 } 
          }, // Excluding fields
        // { $skip: (page - 1) * pageSize },
        // { $limit: pageSize },
      ];
  
      // Get the paginated search results
      const searchResults = await collection.aggregate(searchResultsPipeline).toArray();
  
      res.json({
        facets: facetsResult[0],
        results: searchResults,
        pagination: {
          page,
          pageSize,
          pageCount: Math.ceil(totalCount / pageSize),
          totalCount
        }
      });
    } catch (error) {
      console.error('Search failed:', error);
      res.status(500).send('An error occurred while searching.');
    } finally {
        // Ensure the MongoDB client is always closed, even if an error occurs
        if (client) {
          await client.close();
        }
      }
  });


app.post('/node/tasks/search', async (req, res) => {
    let client;
    try {
        client = new MongoClient(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();

        const db = client.db(dbName);
        const tasksCollection = db.collection(benchmarksCollection);

        const page = parseInt(req.query.page, 10) || 1;
        const taskType = req.query.task_type; // Extract task_type from query parameters
        const pageSize = parseInt(req.query.pageSize, 10) || 10;
        const globalSearchQuery = req.query.q || '';
        const filters = req.body.filters;

        //Update this field accordingly whenever you add a new facet 
        // const fieldsWithLabel = ['Species', 'Anatomical Entity', 'Organ Part', 'Selected Cell Types', 'Disease Status (Donor)', 'Disease Status (Donor)'];
        const fieldsWithLabel = ['Species', 'Organ Part', 'Selected Cell Types', 'Disease Status (Donor)'];

        if (!taskType) {
            return res.status(400).send('task_type is required');
        }
        // Initialize matchConditions to include the taskType filter
        let matchConditions = [{ 'task_type': taskType }];

        // Include global search query in match conditions
        if (globalSearchQuery) {
            matchConditions.push({
                $or: [
                    { 'task_type': { $regex: globalSearchQuery, $options: 'i' } },
                    { 'datasetDetails.Species.label': { $regex: globalSearchQuery, $options: 'i' } },
                    { 'datasetDetails.Author': { $regex: globalSearchQuery, $options: 'i' } },
                    // { 'datasetDetails.Anatomical Entity.label': { $regex: globalSearchQuery, $options: 'i' } },
                    { 'datasetDetails.Organ Part.label': { $regex: globalSearchQuery, $options: 'i' } },
                    {
                        'datasetDetails.Selected Cell Types': {
                            $elemMatch: {
                                label: { $regex: globalSearchQuery, $options: 'i' }
                            }
                        }
                    },
                    {
                        'datasetDetails.Disease Status (Donor)': {
                            $elemMatch: {
                                label: { $regex: globalSearchQuery, $options: 'i' }
                            }
                        }
                    },
                    // { 'datasetDetails.Disease Status (Donor)': { 
                    //     $elemMatch: { 
                    //         label: { $regex: globalSearchQuery, $options: 'i' } 
                    //     } 
                    // }},
                ]
            });
        }


        // Apply additional filters
        if (filters && Object.keys(filters).length > 0) {
            Object.keys(filters).forEach((filterCategory) => {
                const filterValue = filters[filterCategory];
                if (Array.isArray(filterValue) && filterValue.length > 0) {
                    let condition = {};
                    if (filterCategory === 'Selected Cell Types') {
                        // Handle filtering for the 'Selected Cell Types' array
                        condition['datasetDetails.Selected Cell Types.value'] = {
                            $in: filterValue
                        };
                    } 
                    // Check if the filter category should use the 'label' property for array of objects
                   else if (fieldsWithLabel.includes(filterCategory)) {
                        condition[`datasetDetails.${filterCategory}.label`] = { $in: filterValue };

                    } else {
                        // Directly use the filter category for other fields
                        condition[`datasetDetails.${filterCategory}`] = { $in: filterValue };
                    }
                    matchConditions.push(condition);
                }
            });
        }

        // Construct the final match stage
        let matchStage = {};
        if (matchConditions.length > 1) {
            matchStage = { $and: matchConditions };
        } else if (matchConditions.length === 1) {
            matchStage = matchConditions[0];
        }

        const basePipeline = [
            {
                $lookup: {
                    from: datasetCollection,
                    localField: "datasetId",
                    foreignField: "Id",
                    as: "datasetDetails"
                }
            },
            { $unwind: "$datasetDetails" },
            {
                $match: matchStage
            }
        ];

        // Define the pipeline for counting the total number of matching tasks
        const countPipeline = [
            ...basePipeline,
            { $count: "total" }
        ];

        // Execute the count pipeline
        const countResults = await tasksCollection.aggregate(countPipeline).toArray();
        const totalTasksCount = countResults.length > 0 ? countResults[0].total : 0;


        const facetAndDocumentsPipeline = [
            { $unwind: '$datasetDetails.Selected Cell Types.value' },
            { $unwind: '$datasetDetails.Disease Status (Donor)' },
            {
                $facet: {
                    // Each facet is a direct property of the `$facet` object
                    Species: [
                        { $group: { _id: '$datasetDetails.Species.label', uniqueValues: { $addToSet: '$datasetDetails.Id' } } },
                        {
                            $project: {
                                _id: '$_id',
                                count: { $size: "$uniqueValues" }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    Author: [
                        { $group: { _id: '$datasetDetails.Author', uniqueValues: { $addToSet: '$datasetDetails.Id' } } },
                        {
                            $project: {
                                _id: '$_id',
                                count: { $size: "$uniqueValues" }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    /* 'Anatomical Entity': [
                        { $group: { _id: '$datasetDetails.Anatomical Entity.label', uniqueValues: { $addToSet: '$datasetDetails.Id' } } },
                        {
                            $project: {
                                _id: '$_id',
                                count: { $size: "$uniqueValues" }
                            }
                        },
                        { $sort: { count: -1 } }
                    ], */
                    'Organ Part': [
                        { $group: { _id: '$datasetDetails.Organ Part.label', uniqueValues: { $addToSet: '$datasetDetails.Id' } } },
                        {
                            $project: {
                                _id: '$_id',
                                count: { $size: "$uniqueValues" }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    'Selected Cell Types': [
                        { $group: { _id: '$datasetDetails.Selected Cell Types.value', uniqueValues: { $addToSet: '$datasetDetails.Id' } } },
                        {
                            $project: {
                                _id: '$_id',
                                count: { $size: "$uniqueValues" }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    'Disease Status (Donor)': [
                        { $group: { _id: '$datasetDetails.Disease Status (Donor).label', uniqueValues: { $addToSet: '$datasetDetails.Id' } } },
                        {
                            $project: {
                                _id: '$_id',
                                count: { $size: "$uniqueValues" }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    /* 'Disease Status (Donor)': [
                        { $group: { _id: '$datasetDetails.Disease Status (Donor).label', uniqueValues: { $addToSet: '$datasetDetails.Id' } } },
                        {
                            $project: {
                                _id: '$_id',
                                count: { $size: "$uniqueValues" }
                            }
                        }, 
                        { $sort: { count: -1 } }
                    ], */
                    // Documents facet for pagination
                    documents: [
                        // { $skip: (page - 1) * pageSize },
                        // { $limit: pageSize },
                        { 
                            $group: { 
                                _id: {
                                    "Benchmarks ID": "$benchmarksId",
                                    // "Dataset ID": "$datasetDetails.Id",
                                    Title: "$datasetDetails.Title",
                                    'Task': "$task_type",
                                    Species: "$datasetDetails.Species.label",
                                    'Organ Part': "$datasetDetails.Organ Part.label",
                                    'Cell Count Estimate': "$datasetDetails.Cell Count Estimate",
                                    'Development Stage': "$datasetDetails.Development Stage",
                                    // 'Anatomical Entity': "$datasetDetails.Anatomical Entity.label",
                                    // 'Disease Status (Donor)': "$datasetDetails.Disease Status (Donor).label",
                                    Author: "$datasetDetails.Author",
                                    TaskLabel: "$task_label",
                                    'Source': "$datasetDetails.Source",
                                    'Submission Date': "$datasetDetails.Submission Date",
                                }
                            } 
                        },
                        {
                            $project: {
                                _id: '$_id.Benchmarks ID',
                                "Benchmarks ID": "$_id.Benchmarks ID",
                                // "Dataset ID": "$_id.Id",
                                Title: "$_id.Title",
                                'Task': "$_id.Task",
                                Species: "$_id.Species",
                                'Organ Part': "$_id.Organ Part",
                                'Cell Count Estimate': "$_id.Cell Count Estimate",
                                'Development Stage': "$_id.Development Stage",
                                // 'Anatomical Entity': "$_id.Anatomical Entity",
                                // 'Disease Status (Donor)': "$_id.Disease Status (Donor)",
                                Author: "$_id.Author",
                                TaskLabel: "$_id.TaskLabel",
                                'Source': "$_id.Source",
                                'Submission Date': "$_id.Submission Date",
                            }
                        }
                    ]
                }
            }
        ];

        const finalPipeline = basePipeline.concat(facetAndDocumentsPipeline);

        const aggregatedResults = await tasksCollection.aggregate(finalPipeline).toArray();

        // console.log(aggregatedResults);

        // Extract the first (and only) element of the aggregatedResults, which contains your facets and documents
        const aggregationResult = aggregatedResults[0];

        // Extract documents from the 'documents' facet
        const documents = aggregationResult.documents;

        // Extract and transform facets
        const facets = Object.keys(aggregationResult)
            .filter(key => key !== 'documents') // Exclude the 'documents' key to process only facets
            .reduce((acc, key) => {
                // Transform each facet's results for easier consumption
                acc[key] = aggregationResult[key].map(facet => ({
                    _id: facet._id, // Assuming each object has an _id field
                    count: facet.count // Assuming each object has a count field
                }));
                return acc;
            }, {});

        // Assuming totalTasksCount is calculated elsewhere in your code
        res.json({
            results: documents,
            facets: facets,
            pagination: {
                page,
                pageSize,
                pageCount: Math.ceil(totalTasksCount / pageSize),
                totalCount: totalTasksCount,
            }
        });
    } catch (error) {
        console.error('API request failed:', error);
        res.status(500).send('An error occurred while fetching tasks.');
    } finally {
        if (client) {
            await client.close();
        }
    }
});


// app.post('/node/test', async (req, res) => {
//   let client;
//   try {
//     client = new MongoClient(mongoUrl);
//     await client.connect();

//     const db = client.db(dbName);
//     const { q: globalSearchQuery, page: queryPage, private: isPrivate, public: isPublic, shared: isShared, pageSize: pagesize } = req.query;

//     const page = parseInt(queryPage, 10) || 1;
//     const pageSize = parseInt(pagesize, 10) || 1;
//     const filters = req.body.filters;

//     //Update this field accordingly whenever you add a new facet 
//     const fieldsWithLabel = ['Species', 'Anatomical Entity', 'Organ Part', 'Selected Cell Types', 'Disease Status (Donor)', 'Disease Status (Donor)'];

//     let matchConditions = [];

//     // Add the global search query to the match conditions
//     if (globalSearchQuery) {
//         matchConditions.push({
//             $or: [
//                 { 'Species.label': { $regex: globalSearchQuery, $options: 'i' } },
//                 { 'Title': { $regex: globalSearchQuery, $options: 'i' } },
//                 { 'Author': { $regex: globalSearchQuery, $options: 'i' } },
//                 { 'Anatomical Entity.label': { $regex: globalSearchQuery, $options: 'i' } },
//                 { 'Organ Part.label': { $regex: globalSearchQuery, $options: 'i' } },
//                 { 'Selected Cell Types.value': { $regex: globalSearchQuery, $options: 'i' } },
//                 { 'Disease Status (Donor).label': { $regex: globalSearchQuery, $options: 'i' } },
//                 { 'Disease Status (Donor).label': { $regex: globalSearchQuery, $options: 'i' } },
//                 { 'Category': { $regex: globalSearchQuery, $options: 'i' } },
//             ],
//         });
//     }

//     // Apply additional filters
//     if (filters) {
//         Object.keys(filters).forEach((filterCategory) => {
//             const filterValue = filters[filterCategory];
//             if (Array.isArray(filterValue) && filterValue.length > 0) {
//                 let condition = {};

//                 // Check if the filter category should use the 'label' property
//                 if (fieldsWithLabel.includes(filterCategory)) {
//                     condition[`${filterCategory}.label`] = { $in: filterValue };
//                 } else {
//                     // Directly use the filter category for other fields
//                     condition[filterCategory] = { $in: filterValue };
//                 }

//                 // Add this condition to the matchConditions array
//                 matchConditions.push(condition);
//             }
//         });
//     }

//     let collectionQueries = [];
//     if (isPublic === 'true') {
//         collectionQueries.push(queryCollection(db.collection(datasetCollection), matchConditions,  page, pageSize));
//     }
//     if (isPrivate === 'true' || isShared === 'true') {
//         // Adjusts the filter to capitalize the first letter to match document values ('Private', 'Shared')
//         const categories = ['private', 'shared']
//             .filter(flag => req.query[flag] === 'true')
//             .map(value => value.charAt(0).toUpperCase() + value.slice(1)); // Transform 'private' to 'Private' and 'shared' to 'Shared'

//         if (categories.length > 0) {
//             matchConditions.push({ Category: { $in: categories } });
//         }
//         collectionQueries.push(queryCollection(db.collection(userDatasetsCollection), matchConditions,  page, pageSize));
//     }

//     // Execute all collection queries in parallel
//     const results = await Promise.all(collectionQueries);

//     const combinedTotalCount = results.reduce((acc, result) => acc + result.totalCount, 0);
//     const combinedDocuments = results.flatMap(result => result.documents);

//     const mergeFacets = (facetsArray) => {
//         const combinedFacets = {};

//         facetsArray.forEach(facets => {
//             Object.keys(facets).forEach(category => {
//                 if (!combinedFacets[category]) {
//                     combinedFacets[category] = {};
//                 }

//                 facets[category].forEach(facet => {
//                     if (!combinedFacets[category][facet._id]) {
//                         combinedFacets[category][facet._id] = 0;
//                     }
//                     combinedFacets[category][facet._id] += facet.count;
//                 });
//             });
//         });

//         // Convert back to the array structure
//         const facetsArrayStructure = {};
//         Object.keys(combinedFacets).forEach(category => {
//             facetsArrayStructure[category] = Object.entries(combinedFacets[category]).map(([key, value]) => ({
//                 _id: key,
//                 count: value
//             }));
//         });

//         return facetsArrayStructure;
//     };

//     // Assume results is an array of results from your collection queries
//     const combinedFacets = mergeFacets(results.map(result => result.facets));


//     const pageCount = Math.ceil(combinedTotalCount / pageSize);

//     res.json({
//         results: combinedDocuments,
//         facets: combinedFacets,
//         pagination: {
//             page,
//             pageSize,
//             pageCount,
//             totalCount: combinedTotalCount,
//         }
//     });


//   } catch (error) {
//     console.error('Search failed:', error);
//     res.status(500).send('An error occurred while searching.');
//   } finally {
//     if (client) {
//       await client.close();
//     }
//   }
// });

// async function queryCollection(collection, conditions, page, pageSize) {
//     // Construct the final match stage using $and, only if there are multiple conditions
//     let matchStage = {};
//     if (conditions.length > 0) {
//         matchStage = conditions.length > 1 ? { $and: conditions } : conditions[0];
//     }

//     const pipeline = [
//         { $match: matchStage },
//         {
//             $facet: {
//                 totalCount: [
//                     { $count: "total" }
//                 ],
//                 // Each facet is directly within $facet and maps to its pipeline
//                 'Species': [
//                     { $group: { _id: '$Species.label', count: { $sum: 1 } } },
//                     { $sort: { count: -1 } }
//                 ],
//                 'Category': [
//                     { $group: { _id: '$Category', count: { $sum: 1 } } },
//                     { $sort: { count: -1 } }
//                 ],
//                 'Author': [
//                     { $group: { _id: '$Author', count: { $sum: 1 } } },
//                     { $sort: { count: -1 } }
//                 ],
//                 'Anatomical Entity': [
//                     { $group: { _id: '$Anatomical Entity.label', count: { $sum: 1 } } },
//                     { $sort: { count: -1 } }
//                 ],
//                 // More facets as per your requirement
//                 'Organ Part': [
//                     { $group: { _id: '$Organ Part.label', count: { $sum: 1 } } },
//                     { $sort: { count: -1 } }
//                 ],
//                 'Selected Cell Types': [
//                     { $group: { _id: '$Selected Cell Types.value', count: { $sum: 1 } } },
//                     { $sort: { count: -1 } }
//                 ],
//                 'Disease Status (Donor)': [
//                     { $group: { _id: '$Disease Status (Donor).label', count: { $sum: 1 } } },
//                     { $sort: { count: -1 } }
//                 ],
//                 'Disease Status (Donor)': [
//                     { $group: { _id: '$Disease Status (Donor).label', count: { $sum: 1 } } },
//                     { $sort: { count: -1 } }
//                 ],
//                 documents: [
//                     { $skip: (page - 1) * pageSize },
//                     { $limit: pageSize },
//                     { $project: 
//                         {
//                             Title: "$Title",
//                             Id: "$Id",
//                             Category: "$Category",
//                             Species: "$Species.label",
//                             'Organ Part': "$Organ Part.label",
//                             'Cell Count Estimate': "$Cell Count Estimate",
//                             'Development Stage': "$Development Stage",
//                             'Anatomical Entity': "$Anatomical Entity.label",
//                             'Disease Status (Donor)': "$Disease Status (Donor).label",
//                             Author: "$Author",
//                             'Source': "$Source",
//                             'Submission Date': "$Submission Date",
//                         }
//                     }
//                 ]
//             }
//         }
//     ];

//     const [result] = await collection.aggregate(pipeline).toArray();

//     // Extract and transform facets
//     const facets = Object.keys(result)
//     .filter(key => key !== 'documents' && key !== 'totalCount') // Exclude the 'documents' key to process only facets
//     .reduce((acc, key) => {
//         // Transform each facet's results for easier consumption
//         acc[key] = result[key].map(facet => ({
//             _id: facet._id, // Assuming each object has an _id field
//             count: facet.count // Assuming each object has a count field
//         }));
//         return acc;
//     }, {});
//     return {
//         totalCount: result.totalCount[0] ? result.totalCount[0].total : 0,
//         documents: result.documents,
//         facets: facets,
//     };

// }


app.post('/node/datasets/search', async (req, res) => {
    let client;
    try {
        client = new MongoClient(mongoUrl);
        await client.connect();
        const db = client.db(dbName);

        const {
            q: globalSearchQuery,
            page: queryPage = 1,
            pageSize: queryPageSize = 10,
            public: isPublic,
            shared: isShared
        } = req.query;

        const page = parseInt(queryPage, 10);
        const pageSize = parseInt(queryPageSize, 10);
        const filters = req.body.filters;

        //Update this field accordingly whenever you add a new facet 
        // const fieldsWithLabel = ['Species', 'Anatomical Entity', 'Organ Part', 'Selected Cell Types', 'Disease Status (Donor)', 'Disease Status (Donor)'];
        const fieldsWithLabel = ['Species', 'Organ Part', 'Selected Cell Types', 'Disease Status (Donor)'];


        // If no flags are provided, do not query any collection.
        if (isPublic === 'false' && isShared === 'false') {
            res.json({ message: "No action performed.", results: [], facets: {}, pagination: {} });
            return;
        }
        let matchConditions = [];

        if (globalSearchQuery) {
            matchConditions.push({
                $or: [
                    { 'Species.label': { $regex: globalSearchQuery, $options: 'i' } },
                    { 'Title': { $regex: globalSearchQuery, $options: 'i' } },
                    { 'Author': { $regex: globalSearchQuery, $options: 'i' } },
                    // { 'Anatomical Entity.label': { $regex: globalSearchQuery, $options: 'i' } },
                    { 'Organ Part.label': { $regex: globalSearchQuery, $options: 'i' } },
                    {
                        'Selected Cell Types': {
                            $elemMatch: {
                                value: { $regex: globalSearchQuery, $options: 'i' }
                            }
                        }
                    },
                    {
                        'Disease Status (Donor)': {
                            $elemMatch: {
                                label: { $regex: globalSearchQuery, $options: 'i' }
                            }
                        }
                    },
                    // { 'Disease Status (Donor)': { 
                    //     $elemMatch: { 
                    //         label: { $regex: globalSearchQuery, $options: 'i' } 
                    //     } 
                    // }},
                    { 'Category': { $regex: globalSearchQuery, $options: 'i' } },
                ],
            });
        }

        // Apply additional filters
        if (filters) {
            Object.keys(filters).forEach((filterCategory) => {
                const filterValue = filters[filterCategory];
                if (Array.isArray(filterValue) && filterValue.length > 0) {
                    let condition = {};

                    if (filterCategory === 'Selected Cell Types') {
                        // Handle filtering for the 'Selected Cell Types' array
                        condition['Selected Cell Types.value'] = {
                            $in: filterValue
                        };
                    }
                    // Check if the filter category should use the 'label' property for array of objects
                    else if (fieldsWithLabel.includes(filterCategory)) {
                        condition[`${filterCategory}.label`] = { $in: filterValue };

                    } else {
                        // Directly use the filter category for other fields
                        condition[filterCategory] = { $in: filterValue };
                    }

                    // Add this condition to the matchConditions array
                    matchConditions.push(condition);
                }
            });
        }

        let categoryConditions = [];

        if (isPublic === 'true') {
            categoryConditions.push({ 'Category': 'Public' });
        }

        if (isShared === 'true') {
            categoryConditions.push({ 'Category': 'Shared' });
        }

        // Now, use $or to apply these category conditions if more than one flag is true
        if (categoryConditions.length > 0) {
            matchConditions.push({ $or: categoryConditions });
        }

        // Determine the initial collection based on flags
        let initialCollectionName;

        if (isPublic === 'true') {
            initialCollectionName = datasetCollection;
        } else if (isShared === 'true') {
            initialCollectionName = userDatasetsCollection;
        }


        let matchStage = {};
        if (matchConditions.length > 0) {
            matchStage = matchConditions.length > 1 ? { $and: matchConditions } : matchConditions[0];
        }
        // Initial aggregation pipeline
        let pipeline = [
            { $match: matchStage },
            { $unwind: '$Selected Cell Types.value' },
            { $unwind: '$Disease Status (Donor)' },
            {
                $facet: {
                    // totalCount: [{ $count: "total" }],
                    documents: [
                        {
                            $group: {
                                _id: {
                                    Title: "$Title",
                                    Id: "$Id",
                                    'Dataset ID': "$Id",
                                    Category: "$Category",
                                    Owner: "$Owner",
                                    Species: "$Species.label",
                                    'Organ Part': "$Organ Part.label",
                                    'Cell Count Estimate': "$Cell Count Estimate",
                                    'Development Stage': "$Development Stage",
                                    // 'Disease Status (Donor)': "$Disease Status (Donor).label",
                                    // 'Anatomical Entity': "$Anatomical Entity.label",
                                    // 'Disease Status (Donor)': "$Disease Status (Donor).label",
                                    Author: "$Author",
                                    'Source': "$Source",
                                    'Submission Date': "$Submission Date",
                                    'inputFiles': "$inputFiles",// We want inputFiles to read data from tools page
                                    'adata_path': "$adata_path",
                                    'process_ids': "$process_ids",
                                    "layers": "$layers",
                                    "mod_keys": "$mod_keys",
                                    "obs_names": "$obs_names",
                                    "embeddings": "$embeddings",
                                    "uns": "$uns",
                                    "obsp": "$obsp",
                                    "varm": "$varm",
                                },
                                uniqueValues: { $addToSet: '$Id' }
                            }
                        },
                        {
                            $project: {
                                _id: "$_id.Id",
                                Title: "$_id.Title",
                                Id: "$_id.Id",
                                'Dataset ID': "$_id.Id",
                                Category: "$_id.Category",
                                Owner: "$_id.Owner",
                                Species: "$_id.Species",
                                'Organ Part': "$_id.Organ Part",
                                'Cell Count Estimate': "$_id.Cell Count Estimate",
                                'Development Stage': "$_id.Development Stage",
                                // 'Disease Status (Donor)': "$_id.Disease Status (Donor)",
                                // 'Anatomical Entity': "$Anatomical Entity",
                                // 'Disease Status (Donor)': "$Disease Status (Donor).",
                                Author: "$_id.Author",
                                'Source': "$_id.Source",
                                'Submission Date': "$_id.Submission Date",
                                'inputFiles': "$_id.inputFiles",// We want inputFiles to read data from tools page
                                'adata_path': "$_id.adata_path",
                                'process_ids': "$_id.process_ids",
                                'layers': "$_id.layers",
                                "obs_names": "$_id.obs_names",
                                "mod_keys": "$_id.mod_keys",
                                "embeddings": "$_id.embeddings",
                                "uns": "$_id.uns",
                                "obsp": "$_id.obsp",
                                "varm": "$_id.varm",
                                totalCount: { $size: "$uniqueValues" }
                            }
                        }
                    ],
                    // Each facet is directly within $facet and maps to its pipeline
                    'Species': [
                        { $group: { _id: '$Species.label', uniqueValues: { $addToSet: '$Id' } } },
                        {
                            $project: {
                                _id: '$_id',
                                count: { $size: "$uniqueValues" }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    'Category': [
                        { $group: { _id: '$Category', uniqueValues: { $addToSet: '$Id' } } },
                        {
                            $project: {
                                _id: '$_id',
                                count: { $size: "$uniqueValues" }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    'Author': [
                        { $group: { _id: '$Author', uniqueValues: { $addToSet: '$Id' } } },
                        {
                            $project: {
                                _id: '$_id',
                                count: { $size: "$uniqueValues" }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    // 'Anatomical Entity': [
                    //     { $group: { _id: '$Anatomical Entity.label', count: { $sum: 1 } } },
                    //     { $sort: { count: -1 } }
                    // ],
                    // More facets as per your requirement
                    'Organ Part': [
                        { $group: { _id: '$Organ Part.label', uniqueValues: { $addToSet: '$Id' } } },
                        {
                            $project: {
                                _id: '$_id',
                                count: { $size: "$uniqueValues" }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    'Selected Cell Types': [
                        { $group: { _id: '$Selected Cell Types.value', uniqueValues: { $addToSet: '$Id' } } },
                        {
                            $project: {
                                _id: '$_id',
                                count: { $size: "$uniqueValues" }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    'Disease Status (Donor)': [
                        { $group: { _id: '$Disease Status (Donor).label', uniqueValues: { $addToSet: '$Id' } } },
                        {
                            $project: {
                                _id: '$_id',
                                count: { $size: "$uniqueValues" }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    // 'Disease Status (Donor)': [
                    //     { $group: { _id: '$Disease Status (Donor).label', count: { $sum: 1 } } },
                    //     { $sort: { count: -1 } }
                    // ],
                }
            }
        ];


        // If both flags are true, use $unionWith to combine collections
        if (isPublic === 'true' && (isShared === 'true')) {
            pipeline.unshift({
                $unionWith: {
                    coll: userDatasetsCollection,
                }
            });
            // pipeline.push({ $group: { _id: "$Id" }});
            initialCollectionName = datasetCollection; // Start with the "public" datasets collection
        }

        const collection = db.collection(initialCollectionName);

        const result = await collection.aggregate(pipeline).toArray();

        // Assuming the first element contains the desired structure
        const data = result[0];
        // const totalCount = data.documents[0].totalCount ? data.documents[0].totalCount.total : 0;

        // Extract and transform facets, excluding facets that would result in an empty array
        const facets = Object.keys(data)
            .filter(key => key !== 'documents' && key !== 'totalCount') // Exclude the 'documents' key to process only facets
            .reduce((acc, key) => {
                // Check if data[key] exists, is an array, and has length before mapping
                if (Array.isArray(data[key]) && data[key].length > 0) {
                    acc[key] = data[key].map(facet => ({
                        _id: facet._id, // Assuming each object has an _id field
                        count: facet.count // Assuming each object has a count field
                    }));
                }
                // If data[key] doesn't exist, isn't an array, or is empty, it's not included
                return acc;
            }, {});


        res.json({
            results: data.documents,
            facets: facets,
            pagination: {
                // totalCount: totalCount,
                page,
                pageSize,
                // pageCount: Math.ceil(totalCount / pageSize),
            }
        });
    } catch (error) {
        console.error('Search failed:', error);
        res.status(500).send('An error occurred while searching.');
    } finally {
        if (client) {
            await client.close();
        }
    }
});


app.post('/node/tools/allDatasets/search', verifyJWTToken, async (req, res) => {
    let client;
    try {
        client = new MongoClient(mongoUrl);
        await client.connect();
        const db = client.db(dbName);
        let owner = req.user.username;

        const mongoProjectsCollection = db.collection(projectsCollection);
        const userProjects = await mongoProjectsCollection.find({
            $or: [
                { admin: owner },
                { members: owner }
            ]
        }).toArray();

        const accessibleProjectNames = userProjects.map(p => p.project_name);
        const {
            q: globalSearchQuery,
            page: queryPage = 1,
            pageSize: queryPageSize = 10,
            private: isPrivate,
            public: isPublic,
            shared: isShared
        } = req.query;

        const page = parseInt(queryPage, 10);
        const pageSize = parseInt(queryPageSize, 10);
        const filters = req.body.filters;

        //Update this field accordingly whenever you add a new facet 
        // const fieldsWithLabel = ['Species', 'Anatomical Entity', 'Organ Part', 'Selected Cell Types', 'Disease Status (Donor)', 'Disease Status (Donor)'];
        const fieldsWithLabel = ['Species', 'Organ Part', 'Selected Cell Types', 'Disease Status (Donor)'];


        // If no flags are provided, do not query any collection.
        if (isPublic === 'false' && isPrivate === 'false' && isShared === 'false') {
            res.json({ message: "No action performed.", results: [], facets: {}, pagination: {} });
            return;
        }
        let matchConditions = [];

        if (globalSearchQuery) {
            matchConditions.push({
                $or: [
                    { 'Species.label': { $regex: globalSearchQuery, $options: 'i' } },
                    { 'Title': { $regex: globalSearchQuery, $options: 'i' } },
                    { 'Author': { $regex: globalSearchQuery, $options: 'i' } },
                    // { 'Anatomical Entity.label': { $regex: globalSearchQuery, $options: 'i' } },
                    { 'Organ Part.label': { $regex: globalSearchQuery, $options: 'i' } },
                    {
                        'Selected Cell Types': {
                            $elemMatch: {
                                value: { $regex: globalSearchQuery, $options: 'i' }
                            }
                        }
                    },
                    {
                        'Disease Status (Donor)': {
                            $elemMatch: {
                                label: { $regex: globalSearchQuery, $options: 'i' }
                            }
                        }
                    },
                    // { 'Disease Status (Donor)': { 
                    //     $elemMatch: { 
                    //         label: { $regex: globalSearchQuery, $options: 'i' } 
                    //     } 
                    // }},
                    { 'Category': { $regex: globalSearchQuery, $options: 'i' } },
                ],
            });
        }

        // Apply additional filters
        if (filters) {
            Object.keys(filters).forEach((filterCategory) => {
                const filterValue = filters[filterCategory];
                if (Array.isArray(filterValue) && filterValue.length > 0) {
                    let condition = {};

                    if (filterCategory === 'Selected Cell Types') {
                        // Handle filtering for the 'Selected Cell Types' array
                        condition['Selected Cell Types.value'] = {
                            $in: filterValue
                        };
                    } 
                    // Check if the filter category should use the 'label' property for array of objects
                    else if (fieldsWithLabel.includes(filterCategory)) {
                        condition[`${filterCategory}.label`] = { $in: filterValue };

                    } else {
                        // Directly use the filter category for other fields
                        condition[filterCategory] = { $in: filterValue };
                    }

                    // Add this condition to the matchConditions array
                    matchConditions.push(condition);
                }
            });
        }

        let categoryConditions = [];

        if (isPublic === 'true') {
            categoryConditions.push({ 'Category': 'Public' });
        }
        if (isPrivate === 'true') {
            categoryConditions.push({ 'Owner': owner });
        }
        if (isShared === 'true') {
            categoryConditions.push({ 'Category': 'Shared' });
        }

        // New project access level
        // if (accessibleProjectNames.length > 0) {
        //     categoryConditions.push({ 'projectAccess': { $in: accessibleProjectNames } });
        // }

        if (accessibleProjectNames.length > 0) {
            const regexConditions = accessibleProjectNames.map(name => ({
                projectAccess: { $regex: `^${name}$`, $options: 'i' }
            }));
            categoryConditions.push({ $or: regexConditions });
        }
        // Now, use $or to apply these category conditions if more than one flag is true
        if (categoryConditions.length > 0) {
            matchConditions.push({ $or: categoryConditions });
        }

        // Determine the initial collection based on flags
        let initialCollectionName;

        if (isPublic === 'true') {
            initialCollectionName = datasetCollection;
        } else if (isPrivate === 'true' || isShared === 'true') {
            initialCollectionName = userDatasetsCollection;
        }


        let matchStage = {};
        if (matchConditions.length > 0) {
            matchStage = matchConditions.length > 1 ? { $and: matchConditions } : matchConditions[0];
        }
        // Initial aggregation pipeline
        let pipeline = [
            { $match: matchStage },
            { $unwind: '$Selected Cell Types.value' },
            { $unwind: '$Disease Status (Donor)' },
            {
                $facet: {
                    // totalCount: [{ $count: "total" }],
                    documents: [
                        {
                            $group: {
                                _id: {
                                    Title: "$Title",
                                    Id: "$Id",
                                    'Dataset ID': "$Id",
                                    Category: "$Category",
                                    Owner: "$Owner",
                                    Species: "$Species.label",
                                    'Organ Part': "$Organ Part.label",
                                    'Cell Count Estimate': "$Cell Count Estimate",
                                    'Development Stage': "$Development Stage",
                                    // 'Disease Status (Donor)': "$Disease Status (Donor).label",
                                    // 'Anatomical Entity': "$Anatomical Entity.label",
                                    // 'Disease Status (Donor)': "$Disease Status (Donor).label",
                                    Author: "$Author",
                                    'Source': "$Source",
                                    'Submission Date': "$Submission Date",
                                    'inputFiles': "$inputFiles",// We want inputFiles to read data from tools page
                                    'adata_path': "$adata_path",
                                    'process_ids': "$process_ids",
                                    "layers": "$layers",
                                    "mod_keys": "$mod_keys",
                                    "obs_names": "$obs_names",
                                    "embeddings": "$embeddings",
                                    "uns": "$uns",
                                    "obsp": "$obsp",
                                    "varm": "$varm",
                                }, 
                                uniqueValues: { $addToSet: '$Id' }
                            }
                        },
                        {
                            $project: {
                                _id: "$_id.Id",
                                Title: "$_id.Title",
                                Id: "$_id.Id",
                                'Dataset ID': "$_id.Id",
                                Category: "$_id.Category",
                                Owner: "$_id.Owner",
                                Species: "$_id.Species",
                                'Organ Part': "$_id.Organ Part",
                                'Cell Count Estimate': "$_id.Cell Count Estimate",
                                'Development Stage': "$_id.Development Stage",
                                // 'Disease Status (Donor)': "$_id.Disease Status (Donor)",
                                // 'Anatomical Entity': "$Anatomical Entity",
                                // 'Disease Status (Donor)': "$Disease Status (Donor).",
                                Author: "$_id.Author",
                                'Source': "$_id.Source",
                                'Submission Date': "$_id.Submission Date",
                                'inputFiles': "$_id.inputFiles",// We want inputFiles to read data from tools page
                                'adata_path': "$_id.adata_path",
                                'process_ids': "$_id.process_ids",
                                'layers': "$_id.layers",
                                "obs_names": "$_id.obs_names",
                                "mod_keys": "$_id.mod_keys",
                                "embeddings": "$_id.embeddings",
                                "uns": "$_id.uns",
                                "obsp": "$_id.obsp",
                                "varm": "$_id.varm",
                                totalCount: { $size: "$uniqueValues" }
                            }
                        }
                    ],
                    // Each facet is directly within $facet and maps to its pipeline
                    'Species': [
                        { $group: { _id: '$Species.label', uniqueValues: { $addToSet: '$Id' } } },
                        {
                            $project: {
                                _id: '$_id',
                                count: { $size: "$uniqueValues" }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    'Category': [
                        { $group: { _id: '$Category', uniqueValues: { $addToSet: '$Id' } } },
                        {
                            $project: {
                                _id: '$_id',
                                count: { $size: "$uniqueValues" }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    'Author': [
                        { $group: { _id: '$Author', uniqueValues: { $addToSet: '$Id' } } },
                        {
                            $project: {
                                _id: '$_id',
                                count: { $size: "$uniqueValues" }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    // 'Anatomical Entity': [
                    //     { $group: { _id: '$Anatomical Entity.label', count: { $sum: 1 } } },
                    //     { $sort: { count: -1 } }
                    // ],
                    // More facets as per your requirement
                    'Organ Part': [
                        { $group: { _id: '$Organ Part.label', uniqueValues: { $addToSet: '$Id' } } },
                        {
                            $project: {
                                _id: '$_id',
                                count: { $size: "$uniqueValues" }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    'Selected Cell Types': [
                        { $group: { _id: '$Selected Cell Types.value', uniqueValues: { $addToSet: '$Id' } } },
                        {
                            $project: {
                                _id: '$_id',
                                count: { $size: "$uniqueValues" }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    'Disease Status (Donor)': [
                        { $group: { _id: '$Disease Status (Donor).label', uniqueValues: { $addToSet: '$Id' } } },
                        {
                            $project: {
                                _id: '$_id',
                                count: { $size: "$uniqueValues" }
                            }
                        },
                        { $sort: { count: -1 } }
                    ],
                    // 'Disease Status (Donor)': [
                    //     { $group: { _id: '$Disease Status (Donor).label', count: { $sum: 1 } } },
                    //     { $sort: { count: -1 } }
                    // ],
                }
            }
        ];


        // If both flags are true, use $unionWith to combine collections
        if (isPrivate === 'true' || (isPublic === 'true' && (isPrivate === 'true' || isShared === 'true'))) {
            pipeline.unshift({
                $unionWith: {
                    coll: userDatasetsCollection,
                }
            });
            // pipeline.push({ $group: { _id: "$Id" }});
            initialCollectionName = datasetCollection; // Start with the "public" datasets collection
        }

        const collection = db.collection(initialCollectionName);

        const result = await collection.aggregate(pipeline).toArray();

        // Assuming the first element contains the desired structure
        const data = result[0];
        // const totalCount = data.documents[0].totalCount ? data.documents[0].totalCount.total : 0;

        // Extract and transform facets, excluding facets that would result in an empty array
        const facets = Object.keys(data)
            .filter(key => key !== 'documents' && key !== 'totalCount') // Exclude the 'documents' key to process only facets
            .reduce((acc, key) => {
                // Check if data[key] exists, is an array, and has length before mapping
                if (Array.isArray(data[key]) && data[key].length > 0) {
                    acc[key] = data[key].map(facet => ({
                        _id: facet._id, // Assuming each object has an _id field
                        count: facet.count // Assuming each object has a count field
                    }));
                }
                // If data[key] doesn't exist, isn't an array, or is empty, it's not included
                return acc;
            }, {});


        res.json({
            results: data.documents,
            facets: facets,
            pagination: {
                // totalCount: totalCount,
                page,
                pageSize,
                // pageCount: Math.ceil(totalCount / pageSize),
            }
        });
    } catch (error) {
        console.error('Search failed:', error);
        res.status(500).send('An error occurred while searching.');
    } finally {
        if (client) {
            await client.close();
        }
    }
});


// app.post('/node/tools/allDatasets/search', verifyJWTToken, async (req, res) => {
//     let client;
//     try {
//         client = new MongoClient(mongoUrl);
//         await client.connect();
//         const db = client.db(dbName);
//         let owner = req.user.username;
//         const {
//             q: globalSearchQuery,
//             page: queryPage = 1,
//             pageSize: queryPageSize = 10,
//             private: isPrivate,
//             public: isPublic,
//             shared: isShared
//         } = req.query;

//         const page = parseInt(queryPage, 10);
//         const pageSize = parseInt(queryPageSize, 10);
//         const filters = req.body.filters;

//         //Update this field accordingly whenever you add a new facet 
//         // const fieldsWithLabel = ['Species', 'Anatomical Entity', 'Organ Part', 'Selected Cell Types', 'Disease Status (Donor)', 'Disease Status (Donor)'];
//         const fieldsWithLabel = ['Species', 'Organ Part', 'Selected Cell Types', 'Disease Status (Donor)'];


//         // If no flags are provided, do not query any collection.
//         if (isPublic === 'false' && isPrivate === 'false' && isShared === 'false') {
//             res.json({ message: "No action performed.", results: [], facets: {}, pagination: {} });
//             return;
//         }
//         let matchConditions = [];

//         if (globalSearchQuery) {
//             matchConditions.push({
//                 $or: [
//                     { 'Species.label': { $regex: globalSearchQuery, $options: 'i' } },
//                     { 'Title': { $regex: globalSearchQuery, $options: 'i' } },
//                     { 'Author': { $regex: globalSearchQuery, $options: 'i' } },
//                     // { 'Anatomical Entity.label': { $regex: globalSearchQuery, $options: 'i' } },
//                     { 'Organ Part.label': { $regex: globalSearchQuery, $options: 'i' } },
//                     { 'Selected Cell Types.value': { $regex: globalSearchQuery, $options: 'i' } },
//                     { 'Disease Status (Donor).label': { $regex: globalSearchQuery, $options: 'i' } },
//                     // { 'Disease Status (Donor).label': { $regex: globalSearchQuery, $options: 'i' } },
//                     { 'Category': { $regex: globalSearchQuery, $options: 'i' } },
//                 ],
//             });
//         }

//         // Apply additional filters
//         if (filters) {
//             Object.keys(filters).forEach((filterCategory) => {
//                 const filterValue = filters[filterCategory];
//                 if (Array.isArray(filterValue) && filterValue.length > 0) {
//                     let condition = {};

//                     // Check if the filter category should use the 'label' property
//                     if (fieldsWithLabel.includes(filterCategory)) {
//                         condition[`${filterCategory}.label`] = { $in: filterValue };
//                     } else {
//                         // Directly use the filter category for other fields
//                         condition[filterCategory] = { $in: filterValue };
//                     }

//                     // Add this condition to the matchConditions array
//                     matchConditions.push(condition);
//                 }
//             });
//         }

//         let categoryConditions = [];

//         if (isPublic === 'true') {
//             categoryConditions.push({ 'Category': 'Public' });
//         }
//         if (isPrivate === 'true') {
//             categoryConditions.push({ 'Owner': owner });
//         }
//         if (isShared === 'true') {
//             categoryConditions.push({ 'Category': 'Shared' });
//         }

//         // Now, use $or to apply these category conditions if more than one flag is true
//         if (categoryConditions.length > 0) {
//             matchConditions.push({ $or: categoryConditions });
//         }

//         // Determine the initial collection based on flags
//         let initialCollectionName;

//         if (isPublic === 'true') {
//             initialCollectionName = datasetCollection;
//         } else if (isPrivate === 'true' || isShared === 'true') {
//             initialCollectionName = userDatasetsCollection;
//         }


//         let matchStage = {};
//         if (matchConditions.length > 0) {
//             matchStage = matchConditions.length > 1 ? { $and: matchConditions } : matchConditions[0];
//         }

//         // Initial aggregation pipeline
//         let facetsPipeline = [
//             { $match: matchStage },
//             { $unwind: '$Selected Cell Types' },
//             { $unwind: '$Disease Status (Donor)' },
//             {
//                 $facet: {
//                     // Each facet is directly within $facet and maps to its pipeline
//                     'Species': [
//                         { $group: { _id: '$Species.label', uniqueValues: { $addToSet: '$Id' } } },
//                         {
//                             $project: {
//                                 _id: '$_id',
//                                 count: { $size: "$uniqueValues" }
//                             }
//                         },
//                         { $sort: { count: -1 } }
//                     ],
//                     'Category': [
//                         { $group: { _id: '$Category', uniqueValues: { $addToSet: '$Id' } } },
//                         {
//                             $project: {
//                                 _id: '$_id',
//                                 count: { $size: "$uniqueValues" }
//                             }
//                         },
//                         { $sort: { count: -1 } }
//                     ],
//                     'Author': [
//                         { $group: { _id: '$Author', uniqueValues: { $addToSet: '$Id' } } },
//                         {
//                             $project: {
//                                 _id: '$_id',
//                                 count: { $size: "$uniqueValues" }
//                             }
//                         },
//                         { $sort: { count: -1 } }
//                     ],
//                     // 'Anatomical Entity': [
//                     //     { $group: { _id: '$Anatomical Entity.label', count: { $sum: 1 } } },
//                     //     { $sort: { count: -1 } }
//                     // ],
//                     // More facets as per your requirement
//                     'Organ Part': [
//                         { $group: { _id: '$Organ Part.label', uniqueValues: { $addToSet: '$Id' } } },
//                         {
//                             $project: {
//                                 _id: '$_id',
//                                 count: { $size: "$uniqueValues" }
//                             }
//                         },
//                         { $sort: { count: -1 } }
//                     ],
//                     'Selected Cell Types': [
//                         { $group: { _id: '$Selected Cell Types.value', uniqueValues: { $addToSet: '$Id' } } },
//                         {
//                             $project: {
//                                 _id: '$_id',
//                                 count: { $size: "$uniqueValues" }
//                             }
//                         },
//                         { $sort: { count: -1 } }
//                     ],
//                     'Disease Status (Donor)': [
//                         { $group: { _id: '$Disease Status (Donor).label', uniqueValues: { $addToSet: '$Id' } } },
//                         {
//                             $project: {
//                                 _id: '$_id',
//                                 count: { $size: "$uniqueValues" }
//                             }
//                         },
//                         { $sort: { count: -1 } }
//                     ],
//                     // 'Disease Status (Donor)': [
//                     //     { $group: { _id: '$Disease Status (Donor).label', count: { $sum: 1 } } },
//                     //     { $sort: { count: -1 } }
//                     // ],
//                     // totalCount: [{ $count: "total" }],
//                     // documents: [
//                     //     //   { $skip: (page - 1) * pageSize }, 
//                     //     //   { $limit: pageSize },
//                     //     {
//                     //         $project: {
//                     //             Title: "$Title",
//                     //             Id: "$Id",
//                     //             Category: "$Category",
//                     //             Owner: "$Owner",
//                     //             Species: "$Species.label",
//                     //             'Organ Part': "$Organ Part.label",
//                     //             'Cell Count Estimate': "$Cell Count Estimate",
//                     //             'Development Stage': "$Development Stage",
//                     //             'Disease Status (Donor)': "$Disease Status (Donor).label",
//                     //             // 'Anatomical Entity': "$Anatomical Entity.label",
//                     //             // 'Disease Status (Donor)': "$Disease Status (Donor).label",
//                     //             Author: "$Author",
//                     //             'Source': "$Source",
//                     //             'Submission Date': "$Submission Date",
//                     //             'inputFiles': "$inputFiles",// We want inputFiles to read data from tools page
//                     //             'adata_path': "$adata_path",
//                     //             'process_ids': "$process_ids"
//                     //         }
//                     //     }
//                     // ],
//                 }
//             }
//         ];

//         // Build the pipeline for search results with pagination
//         let searchResultsPipeline = [
//             { $match: matchStage },
//         ];

//         // If both flags are true, use $unionWith to combine collections
//         if (isPrivate === 'true' || (isPublic === 'true' && (isPrivate === 'true' || isShared === 'true'))) {
//             facetsPipeline.unshift({
//                 $unionWith: {
//                     coll: userDatasetsCollection,
//                 }
//             });

//             searchResultsPipeline.unshift({
//                 $unionWith: {
//                     coll: userDatasetsCollection,
//                 }
//             });
//             // pipeline.push({ $group: { _id: "$Id" }});
//             initialCollectionName = datasetCollection; // Start with the "public" datasets collection
//         }

//         const collection = db.collection(initialCollectionName);

//         const facetResult = await collection.aggregate(facetsPipeline).toArray();

//         // Pagination: Get total count for the query
//         const totalCount = await collection.countDocuments(matchStage);



//         // Get the paginated search results
//         const searchResults = await collection.aggregate(searchResultsPipeline).toArray();

//         // Assuming the first element contains the desired structure
//         // const data = result[0];

//         // Extract and transform facets, excluding facets that would result in an empty array
//         // const facets = Object.keys(data)
//         // .filter(key => key !== 'documents' && key !== 'totalCount') // Exclude the 'documents' key to process only facets
//         // .reduce((acc, key) => {
//         //     // Check if data[key] exists, is an array, and has length before mapping
//         //     if (Array.isArray(data[key]) && data[key].length > 0) {
//         //         acc[key] = data[key].map(facet => ({
//         //             _id: facet._id, // Assuming each object has an _id field
//         //             count: facet.count // Assuming each object has a count field
//         //         }));
//         //     }
//         //     // If data[key] doesn't exist, isn't an array, or is empty, it's not included
//         //     return acc;
//         // }, {});

//         res.json({
//             results: searchResults,
//             facets: facetResult[0],
//             pagination: {
//                 totalCount: totalCount,
//                 page,
//                 pageSize,
//                 pageCount: Math.ceil(totalCount / pageSize),
//             }
//         });
//     } catch (error) {
//         console.error('Search failed:', error);
//         res.status(500).send('An error occurred while searching.');
//     } finally {
//         if (client) {
//             await client.close();
//         }
//     }
// });


// API endpoint to get process results based on an array of process_ids
app.post('/node/getPreProcessResults', async (req, res) => {
    let client;
    let projection = { _id: 0, process_id: 1, description: 1, stage: 1, process: 1, method: 1, nCells: 1, adata_path: 1, md5: 1, info: 1, cell_metadata: 1, default_assay: 1, assay_names: 1, evaluation_results: 1 };
    try {
        const processIds = req.body.processIds;
        if (!processIds || !processIds.length) {
            return res.status(400).json({ error: 'No process ID is provided.' });
        }

        const detailsType = req.body.details;
        
        if (detailsType === "PARTIAL") {
            projection = { _id: 0, process_id: 1, description: 1, stage: 1, process: 1, method: 1, nCells: 1, adata_path: 1, cell_metadata: 1 };
        }

        client = new MongoClient(mongoUrl);

        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(preProcessResultsCollection);

        // Fetching documents where process_id is in the provided array of process IDs
        const processResults = await collection.find({
            process_id: { $in: processIds }
        }).project(projection).toArray();

        res.status(200).json(processResults);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.close();
    }
});


// API endpoint to get Benchmarks results based on benchmarksId
app.post('/node/getBenchmarksResults', async (req, res) => {
    let client;
    try {

        const benchmarksId = req.body.benchmarksId;

        if (!benchmarksId) {
            return res.status(400).json({ error: 'No BenchmarksId is provided' });
        }

        client = new MongoClient(mongoUrl);

        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(benchmarksCollection);

        // Fetching documents where process_id is in the provided array of process IDs
        const benchmarksResults = await collection.find({
            benchmarksId: benchmarksId
        }).toArray();

        res.status(200).json(benchmarksResults);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        client.close();
    }
});


app.post('/node/editDatasetMetadata', async (req, res) => {
    const client = new MongoClient(mongoUrl);

    try {
        // Connect to the MongoDB server
        await client.connect();
        const db = client.db(dbName);
        const datasetId = req.body.datasetId; 

        // Select appropriate collection based on datasetId pattern
        let collection = (datasetId.startsWith("U-") && datasetId.includes("@")) 
                                            ? db.collection(userDatasetsCollection) 
                                            : db.collection(datasetCollection);

        // Check if a document with the provided Id exists
        const existingDocument = await collection.findOne({ Id: datasetId });

        if (!existingDocument) {
            console.log('Document with Id does not exist:', datasetId);
            res.status(404).json({ error: 'Document with the provided Id does not exist' });
        } 

        res.status(200).json(existingDocument);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        // Ensure the client will close when you finish/error
        await client.close();
    }
});


app.get('/node/fetchDataforVisualize/:id', async (req, res) => {
    const { id } = req.params;

    const client = new MongoClient(mongoUrl);

    try {
        // Connect to the MongoDB server
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(datasetCollection);

        const existingDocument = await collection.findOne({ Id: id });

        if (!existingDocument) {
            return res.status(404).json({ error: 'Document not found' });
        } else {
            res.status(200).json(existingDocument);

        }
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        // Ensure the client will close when you finish/error
        await client.close();
    }
});


app.get('/node/fetchPpResults', async (req, res) => {
    const client = new MongoClient(mongoUrl);

    try {
        // Connect to the MongoDB server
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(preProcessResultsCollection);

        // Find all documents (no query criteria)
        const documents = await collection.find().toArray();
        console.log("ppresult", documents);

        // Check if any documents were found
        if (documents.length === 0) {
            return res.status(404).json({ error: 'No documents found' });
        } else {
            res.status(200).json(documents); // Send all documents found
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        // Ensure the client will close when you finish/error
        await client.close();
    }
});


app.get('/node/fetchGraphData/:process_id', async (req, res) => {
    const { process_id } = req.params;

    const client = new MongoClient(mongoUrl);

    try {
        // Connect to the MongoDB server
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(preProcessResultsCollection);

        const existingDocument = await collection.findOne({ process_id: process_id });

        if (!existingDocument) {
            return res.status(404).json({ error: 'Document not found' });
        } else {
            res.status(200).json(existingDocument);

        }
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        // Ensure the client will close when you finish/error
        await client.close();
    }
});


// API endpoint to get Benchmarks results based on benchmarksId
app.post('/node/single/getBenchmarksResultsWithDatasetDetails', async (req, res) => {
    let client;
    try {

        const benchmarksId = req.body.benchmarksId;

        if (!benchmarksId) {
            return res.status(400).json({ error: 'No BenchmarksId is provided' });
        }

        client = new MongoClient(mongoUrl);

        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection(benchmarksCollection);

    // Fetching the benchmark result with the corresponding dataset details
    const benchmarksResults = await collection.aggregate([
        {
            $match: { benchmarksId: benchmarksId }
        },
        {
            $lookup: {
                from: datasetCollection,
                localField: 'datasetId',
                foreignField: 'Id',
                as: 'datasetDetails'
            }
        },
        {
            $unwind: {
                path: '$datasetDetails',
                preserveNullAndEmptyArrays: true
            }
        }
    ]).toArray();


        res.status(200).json(benchmarksResults);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (client) {
            await client.close();
        }
    }
});

app.post("/node/projects/list", async (req, res) => {
  const { username, adminPage } = req.body;

  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }

  let client;
  try {
    client = new MongoClient(mongoUrl);
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection(projectsCollection);

    // Fetch projects where the user is the admin
    const projects = adminPage ? await collection.find({ admin: username }).toArray() : await collection.find({ members: username }).toArray();

    res.status(200).json(projects);
  } catch (err) {
    console.error("Error fetching projects:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (client) await client.close();
  }
});


// POST create new group
app.post("/node/projects/createNew", async (req, res) => {
  let client;
  try {
    const { project_name, admin } = req.body;
    if (!project_name || !admin)
      return res.status(400).json({ error: "Missing project_name or admin" });

    client = new MongoClient(mongoUrl);
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection(projectsCollection);

    // Insert with admin as member by default
    const result = await collection.insertOne({
      project_name,
      admin,
      members: [admin],
    });

    const newGroup = await collection.findOne({ _id: result.insertedId });

    res.status(201).json(newGroup);
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (client) await client.close();
  }
});

// POST add member to group
app.post("/node/projects/:id/addMember", async (req, res) => {
  let client;
  try {
    const { member } = req.body;
    const id = req.params.id;
    if (!member || !id)
      return res.status(400).json({ error: "Missing member or project id" });

    client = new MongoClient(mongoUrl);
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection(projectsCollection);

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $addToSet: { members: member } }
    );

    res.status(200).json({ message: "Member added" });
  } catch (err) {
    console.error("Error adding member:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (client) await client.close();
  }
});

// POST remove member from group
app.post("/node/projects/:id/removeMember", async (req, res) => {
  let client;
  try {
    const { member } = req.body;
    const id = req.params.id;
    if (!member || !id)
      return res.status(400).json({ error: "Missing member or project id" });

    client = new MongoClient(mongoUrl);
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection(projectsCollection);

    await collection.updateOne(
      { _id: new ObjectId(id) },
      { $pull: { members: member } }
    );

    res.status(200).json({ message: "Member removed" });
  } catch (err) {
    console.error("Error removing member:", err);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (client) await client.close();
    }
});


async function deleteDatasetAndRelatedData(Id, username) {
    const client = new MongoClient(mongoUrl);

    try {
        await client.connect();
        const db = client.db(dbName);

        // Initialize Collections
        const datasetsCollection = db.collection('datasets');
        const userDatasetsCollection = db.collection('user_datasets');
        const jobsCollection = db.collection('jobs');
        const ppResultsCollection = db.collection('pp_results');
        const largeDocsCollection = db.collection('large_documents');
        const benchmarksCollection = db.collection('benchmarks');
        const bmResultsCollection = db.collection('bm_results');

        // 1. Determine which collection to use based on the prefix
        const isUserDataset = Id.startsWith("U-");
        const targetCollection = isUserDataset ? userDatasetsCollection : datasetsCollection;
        const collectionName = isUserDataset ? 'user_datasets' : 'datasets';

        console.log(`Searching for Dataset ID '${Id}' in '${collectionName}'...`);

        // 2. Query the Dataset to get process_ids and adata_path
        const dataset = await targetCollection.findOne(
            { Id: Id, Owner: username },
            { projection: { process_ids: 1, adata_path: 1, inputFiles: 1, _id: 0 } }
        );

        if (!dataset) {
            console.log(`Dataset ID '${Id}' not found or does not belong to user '${username}'. Aborting.`);
            return;
        }

        const processIds = dataset.process_ids || [];
        const datasetAdataPath = dataset.adata_path;
        const datasetInputFiles = dataset.inputFiles || [];

        console.log(`Found dataset with ${processIds.length} process_ids.`);

        // ==========================================
        // 3. FILE SYSTEM CLEANUP
        // ==========================================

        // A. Delete the dataset's main adata_path file
        if (datasetAdataPath) {
            try {
                if (await fs.pathExists(datasetAdataPath)) {
                    await fs.remove(datasetAdataPath); // fs.remove handles both files and directories seamlessly
                    console.log(`Deleted dataset file: ${datasetAdataPath}`);
                }
            } catch (err) {
                console.error(`Failed to delete dataset file ${datasetAdataPath}:`, err);
            }
        }

        if (datasetInputFiles.length > 0) {
            for (const filePath of datasetInputFiles) {
                try {
                    if (await fs.pathExists(filePath)) {
                        await fs.remove(filePath);
                        console.log(`Deleted input file: ${filePath}`);
                    }
                } catch (err) {
                    console.error(`Failed to delete input file ${filePath}:`, err);
                }
            }
        }

        // B. Find folders associated with process_ids in pp_results
        if (processIds.length > 0) {
            const ppDocs = await ppResultsCollection.find(
                { process_id: { $in: processIds } },
                { projection: { process_id: 1, adata_path: 1, zarr_path: 1, _id: 0 } }
            ).toArray();

            const foldersToClean = new Set();
            ppDocs.forEach(doc => {
                const pid = doc.process_id;
                if (doc.adata_path) {
                    const folder = getProcessFolder(doc.adata_path, pid);
                    if (folder) foldersToClean.add(folder);
                }
                if (doc.zarr_path) {
                    const folder = getProcessFolder(doc.zarr_path, pid);
                    if (folder) foldersToClean.add(folder);
                }
            });

            console.log(`Found ${foldersToClean.size} related process_id folders to clear.`);
            for (const folder of foldersToClean) {
                await emptyDirectory(folder);
            }
        }

        // ==========================================
        // 4. DATABASE CLEANUP
        // ==========================================

        const processIdRegexes = processIds.map(id => new RegExp(`^${escapeRegex(id)}`));
        const datasetIdRegex = new RegExp(`^${escapeRegex(Id)}$`);

        // Execute all database deletions concurrently
        const [
            deleteDataset,
            deleteJobs,
            deleteBenchmarks,
            deleteBmResults,
            deletePpResults,
            deleteLargeDocs
        ] = await Promise.all([
            targetCollection.deleteOne({ Id: Id, Owner: username }),
            jobsCollection.deleteMany({ datasetId: Id }),
            benchmarksCollection.deleteMany({ datasetId: Id }),
            bmResultsCollection.deleteMany({ benchmarksId: { $regex: datasetIdRegex, $options: 'i' } }),
            processIds.length > 0 ? ppResultsCollection.deleteMany({ process_id: { $in: processIds } }) : { deletedCount: 0 },
            processIds.length > 0 ? largeDocsCollection.deleteMany({ document_id: { $in: processIdRegexes } }) : { deletedCount: 0 }
        ]);

        console.log(`\n--- Deletion Summary ---`);
        console.log(`Deleted ${deleteDataset.deletedCount} document from '${collectionName}'.`);
        console.log(`Deleted ${deleteJobs.deletedCount} documents from 'jobs'.`);
        console.log(`Deleted ${deleteBenchmarks.deletedCount} documents from 'benchmarks'.`);
        console.log(`Deleted ${deleteBmResults.deletedCount} documents from 'bm_results'.`);
        console.log(`Deleted ${deletePpResults.deletedCount} documents from 'pp_results'.`);
        console.log(`Deleted ${deleteLargeDocs.deletedCount} documents from 'large_documents'.`);
        console.log(`------------------------\n`);

        if (deleteDataset.deletedCount === 0) {
            return false; // Indicate that no dataset was deleted (either not found or not owned by user)
        } else {
            return true; // Indicate successful deletion
        }

    } catch (error) {
        console.error("Error during dataset deletion operation:", error);
    } finally {
        await client.close();
    }
}

app.delete('/node/deleteDataset', verifyJWTToken, async (req, res) => {
    const Id = req.query.datasetId;
    const username = req.user.username;
    console.log("datasetId: ", Id);
    console.log("username: ", username);

    if (!Id) {
        return res.status(400).json({ error: 'Dataset ID is required' });
    }

    try {
        result = await deleteDatasetAndRelatedData(Id, username);

        if (result === false) {
            return res.status(404).json({ error: 'Dataset not found.' });
        } else {
            res.status(200).json({ message: `${Id} is deleted successfully.` });
        }
    } catch (err) {
        res.status(500).json({ error: 'Internal Server Error' });
        console.error('Error deleting dataset:', err);
    }
});


// API endpoint to get complete dataset details along with preprocess results based on datasetId
app.post('/node/item/getDatasetInfoWithPreProcessResults', async (req, res) => {
    let client;
    try {
        const datasetId = req.body.datasetId;

        if (!datasetId) {
            return res.status(400).json({ error: 'No datasetId is provided' });
        }

        client = new MongoClient(mongoUrl);

        await client.connect();
        const db = client.db(dbName);

        // Select appropriate collection based on datasetId pattern
        let collection = (datasetId.startsWith("U-") && datasetId.includes("@")) 
            ? db.collection(userDatasetsCollection) 
            : db.collection(datasetCollection);

        // Fetch dataset details along with preprocessing results using lookup and match
        // const datasetInfo = await collection.aggregate([
        //     {
        //         $match: { Id: datasetId }  // Match dataset based on datasetId
        //     },
        //     {
        //         $lookup: {
        //             from: preProcessResultsCollection,  // Collection containing pre-process results
        //             localField: 'process_ids',          // Array field in dataset collection
        //             foreignField: 'process_id',         // Field in preprocessResults matching process_ids
        //             as: 'preProcessResults'             // Output array field for pre-process results
        //         }
        //     },
        //     {
        //         $project: {
        //             datasetDetails: { $mergeObjects: "$$ROOT" },  // Get all fields from the original dataset
        //             preProcessResults: 1,                         // Include the preProcessResults array
        //             _id: 0,                                       // Exclude the _id field from the final result
        //         }
        //     }
        // ]).toArray();

        const datasetInfo = await collection.aggregate([
            {
                $match: { Id: datasetId }
            },
            {
                $lookup: {
                    from: preProcessResultsCollection,
                    let: { pids: "$process_ids" }, 
                    pipeline: [
                        {
                            $match: {
                                $expr: { $in: ["$process_id", "$$pids"] }
                            }
                        },
                        // { $limit: 10 }, 
                        { $project: { _id: 0, process_id: 1, description: 1, stage: 1, process: 1, method: 1, nCells: 1 } } 
                    ],
                    as: 'preProcessResults'
                }
            },
            {
                $project: {
                    datasetDetails: "$$ROOT",
                    preProcessResults: 1,
                    _id: 0
                }
            }
        ]).toArray();
        

        res.status(200).json(datasetInfo);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        if (client) {
            await client.close();
        }
    }
});


// Util: return mime type from file extension
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    case '.gif': return 'image/gif';
    case '.bmp': return 'image/bmp';
    case '.webp': return 'image/webp';
    default: return 'application/octet-stream';
  }
}


// Route: POST /api/load-images
app.post('/node/load-images', (req, res) => {
  const { folderPath } = req.body;

  if (!folderPath) {
    return res.status(400).json({ error: 'Missing folderPath' });
  }

  try {
    if (!fs.existsSync(folderPath) || !fs.lstatSync(folderPath).isDirectory()) {
      return res.status(400).json({ error: 'Invalid folder path' });
    }

    const files = fs.readdirSync(folderPath);
    const imageFiles = files.filter(file => /\.(png|jpe?g|gif|bmp|webp)$/i.test(file));

    const images = imageFiles.map(file => {
      const filePath = path.join(folderPath, file);
      const base64 = fs.readFileSync(filePath, { encoding: 'base64' });
      const mimeType = getMimeType(file);
      const stats = fs.statSync(filePath);
      return {
        fileName: file,
        base64: `data:${mimeType};base64,${base64}`,
        time: stats.mtime ? stats.mtime.getTime() : 0  // Modification time
      };
    })
    .sort((a, b) => a.time - b.time); // Sort by modification time ascending;

    res.json(images);
  } catch (err) {
    console.error('Error loading images:', err.message);
    res.status(500).json({ error: 'Server error reading images' });
  }
});


app.get('/node/issues', async (req, res) => {
    // You can read these from process.env or hardcode them if they don't change
    const owner = process.env.GITHUB_OWNER || 'cirisjl';
    const repo = process.env.GITHUB_REPO || 'single-cell.ai';
    const token = process.env.GITHUB_TOKEN; // Provided safely by entrypoint.sh
    const { title, body } = req.body;

    if (!token) {
        return res.status(500).json({ error: 'GitHub token is missing on the server.' });
    }
    const { Octokit } = await import("octokit");
    const octokit = new Octokit({
        auth: token
    });

    try {
        const response = await octokit.rest.issues.create({
            owner: owner,
            repo: repo,
            title: title,
            body: body,
            labels: ['bug', 'automated'],
            // assignees: ['cirisjl'] // Optionally assign to a user
        });

        console.log(`Issue created successfully! URL: ${response.data.html_url}`);

        // Send the GitHub data back to your React app
        res.json(response.data);

    } catch (error) {
        console.error('Error fetching from GitHub:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch issues from GitHub' });
    }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});