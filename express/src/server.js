import dotenv from 'dotenv';

dotenv.config();
import express from 'express';
import multer from 'multer';
import AWS from 'aws-sdk';
import crypto from 'crypto';
import sharp from 'sharp';
import { S3, PutObjectCommand } from '@aws-sdk/client-s3';

const randomImageName = () => crypto.randomBytes(32).toString('hex');
const region = process.env.BUCKET_REGION;
const bucketName = process.env.BUCKET_NAME;
const accessKeyId = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

let posts = [];

// const s3 = new S3({
//   region: region,
//   credentials: {
//     accessKeyId: accessKeyId,
//     secretAccessKey: secretAccessKey,
//   },
// });
const s3 = new AWS.S3({
  region: region,
  accessKeyId: accessKeyId,
  secretAccessKey: secretAccessKey,
});
// s3.createBucket(
//   {
//     Bucket: 'fan-demo-created',
//   },
//   (error, success) => {
//     if (error) {
//       console.log(error);
//     }
//     console.log(success);
//   }
// );

// s3.putObject(
//   {
//     Bucket: 'fan-demo-created',
//     Key: 'my-test-s3.txt',
//     Body: Buffer('This is my test file'),
//   },
//   (error, success) => {
//     if (error) {
//       console.log(error);
//     }
//     console.log(success);
//   }
// );

const app = express();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
// upload.single('avatar')

app.get('/api/posts', async (req, res) => {
  for (const post of posts) {
    var params = {
      Bucket: bucketName,
      Key: post.imageName,
      Expires: 60,
    };
    var url = s3.getSignedUrl('getObject', params);
    post.imageUrl = url;
  }

  res.send(posts);
});

app.post('/api/posts', upload.single('image'), async (req, res) => {
  console.log('req.body', req.body);
  console.log('req.file', req.file);

  // resize image
  const buffer = await sharp(req.file.buffer)
    .resize({ height: 1920, weight: 1080, fit: 'contain' })
    .toBuffer();

  const ImageName = randomImageName();
  const params = {
    Bucket: 'fan-demo-created',
    Key: ImageName,
    Body: buffer,
    ContentType: req.file.mimetype,
  };
  posts.push({
    caption: req.body.caption,
    imageName: ImageName,
  });

  s3.putObject(params, (error, success) => {
    if (error) {
      console.log(error);
    }
    console.log(success);
  });

  res.send(posts);
});

app.delete('/api/posts', async (req, res) => {
  const id = req.params.id;
  // const post  = await Posts.findById(id)
  //

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: '74f20a5fe5e0d97fe3f63e8a2cfd77130c2ad30a80fdff1d99aa568ac0496d91',
  };
  s3.deleteObject(params, (error, success) => {
    if (error) {
      console.log(error);
    }
    console.log(success);
  });
});

app.listen(8080, () => {
  console.log('Listening on port 8080');
});
