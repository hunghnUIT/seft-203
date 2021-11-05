const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { docClient } = require('../libs/dynamoDb');
const { TABLE_NAME, PK_VALUE } = require('../settings');
const { generateUserSk } = require('../utils');
const sendMail = require('../services/mailService');
const { JWT_EXPIRE } = require('../settings');


class User {
  constructor({email, password, name, isVerified}) {
    this.email = email;
    this.name = name;
    this.password = password;
    this.isVerified = isVerified;
  }

  async encryptPassword(password) { 
    const salt = await bcrypt.genSalt(10);
    const encryptPassword = await bcrypt.hash(password, salt);
    return encryptPassword;
  }

  getAccessToken() {
    return jwt.sign({email: this.email} , process.env['JWT_SECRET'], {
        expiresIn: settings.JWT_EXPIRE
    })
  }

  async matchPassword(enteredPassword) {
      return await bcrypt.compare(enteredPassword, this.password);
  }

  async saveToDb(willEncryptPassword = false) {
    if (willEncryptPassword)
      this.password = await this.encryptPassword(this.password);

    const sk = generateUserSk(this.email);
    const item = {
      'pk': PK_VALUE.user,
      'sk': sk,
      email: this.email,
      password: this.password,
      name: this.name,
      isVerified: this.isVerified ?? false
    }
    const params = {
      TableName: TABLE_NAME,
      Item: item
    };
    await docClient.put(params).promise();

    return item;
  };

  getVerifyEmailToken() {
    return jwt.sign({email: this.email} , process.env['JWT_SECRET'], {
      expiresIn: '1d'
    })
  };

  async sendVerifyEmail(event) {
    const host = event['headers']['Host'];
    const stage = event['requestContext']['stage'];
    const verifyToken = this.getVerifyEmailToken();
    const verifyURL = `https://${host}/${stage}/register/verify/${verifyToken}`
    const message = `You are receiving this email because you (or someone else) has requested the verification of email. Click at the link below to verify the email if that person was you: \n\n ${verifyURL}`

    let success = false;
    try {
      await sendMail({
          email: this.email,
          subject: 'Email verification',
          message,
      });
      success = true;
    } catch (error) {
      throw new ErrorResponse('Email could not be sent', 500);
    }
    return success;
  };

  setVerifiedEmail() {
    this.isVerified = true;
  };

  getAccessToken() {
    return jwt.sign({email: this.email} , process.env['JWT_SECRET'], {
      expiresIn: JWT_EXPIRE
    });
  };
};

module.exports = User;