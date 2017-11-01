"use strict";

const Joi = require("joi");

class Model_Proxy {
  constructor(client, schema, values) {

    let model = new Model(client, schema, values);

    var proxy = new Proxy(model, {
      get: function(target, name) {

        if (target.dataValues[name]) {
          return target.dataValues[name];
        }
        else {
          return target[name];
        }

      },
      set: function(target, name, value) {
        target.dataValues[name] = value;
        return value;
      }
    });
    return proxy;
  }
}

class Model {

  constructor(client, schema, values) {

    this.client = client;
    this.schema = schema;
    this.dataValues = values ? values : {};

    // if (this.dataValues) {
    //   let validate = Joi.validate(values, this.schema);
    //   if (validate.error) {
    //     throw new Error(validate.error);
    //   }
    // }

  }

  delAsync(key) {

    const _this = this;

    return new Promise(function(resolve, reject) {
      resolve(_this.client.del(key));
    })

  }
  findAsync(key) {

    const _this = this;

    return new Promise(function(resolve, reject) {

      _this.getObjectAsync(key).then(function(values) {

        if (values) {
          resolve(new Model_Proxy(_this.client, _this.schema, values));
        }
        else {
          resolve(null);
        }

      }).catch(function(err) {
        resolve(err);
      })
    })

  }

  findPrifixAsync(prifix) {

    const _this = this;

    return new Promise(function(_resolve_, _reject_) {

      _this.client.keys(prifix, function(err, datas) {
        if (err) {
          _reject_(err);
        }
        else {

          let primices = [];

          for (let data of datas) {
            primices.push(
              new Promise(function(resolve, reject) {
                resolve(_this.findAsync(data));
              })
            )
          }
          
          _resolve_(Promise.all(primices));

        }
      })
    });

  }

  saveAsync(key) {

    // keyを省略した場合はidを使用する
    if (!key) {
      key = this.dataValues.id;
    }

    return this.setObjectAsync(key, this.dataValues);

  }

  build(values) {
    return new Model_Proxy(this.client, this.schema, values)
  }

  setAsync(key, value) {
    const _this = this;
    return new Promise(function(resolve, reject) {
      resolve(_this.client.set(key, value));
    })
  }

  setObjectAsync(key, values) {

    let validate = Joi.validate(values, this.schema);

    // if (validate.error) {
    //   throw new Error(validate.value);
    // }

    return this.setAsync(key, JSON.stringify((values)));
  }

  setExAsync(key, time, value) {
    const _this = this;
    return new Promise(function(resolve, reject) {
      resolve(_this.client.setEx(key, value));
    })
  }

  setObjectExAsync(key, time, values) {

    let validate = Joi.validate(values, this.schema);

    if (validate.error) {
      throw new Error(validate.value);
    }

    return this.setExAsync(key, time, JSON.stringify((values)));
  }

  getAsync(key) {
    const _this = this;
    return new Promise(function(resolve, reject) {
      _this.client.get(key, function(err, data) {
        if (err) {
          reject(err);
        }
        else {
          resolve(data);
        }
      });
    })
  }

  getObjectAsync(key) {
    const _this = this;
    return new Promise(function(resolve, reject) {
      _this.client.get(key, function(err, data) {
        if (err) {
          reject(err);
        }
        else {
          resolve(JSON.parse(data));
        }
      });
    })
  }

}

module.exports = Model_Proxy;