const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { docClient } = require('../libs/dynamoDb');
const { TABLE_NAME, PK_VALUE } = require('../settings');
const { generateUserSk } = require('../utils');


class User {
  constructor({email, password, name}) {
    return (async () => {
      this.email = email;
      this.name = name;
      this.password = await this.encryptPassword(password);
      return this;
    })();
  }

  async encryptPassword(password) { 
    const salt = await bcrypt.genSalt(10);
    const encryptPassword = await bcrypt.hash(password, salt);
    return encryptPassword;
  }

  getAccessToken() {
    return jwt.sign({id: this.email} , process.env['JWT_SECRET'], {
        expiresIn: settings.JWT_EXPIRE
    })
  }

  async matchPassword(enteredPassword) {
      return await bcrypt.compare(enteredPassword, this.password);
  }

  async saveToDb() {
    const sk = generateUserSk(this.email);
    const item = {
      'pk': PK_VALUE.user,
      'sk': sk,
      email: this.email,
      password: this.password,
      name: this.name,
      isVerified: false
    }
    const params = {
      TableName: TABLE_NAME,
      Item: item
    };
    await docClient.put(params).promise();

    return item;
  };

  async sendVerifyEmail() {
    
  };
};

module.exports = User;