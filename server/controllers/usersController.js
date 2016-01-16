var model = require('../db/dbModel.js');

var addUser = function (user) {
  var params = { name: user.name };
  return model.User.findOrCreate({
    where: params,
    defaults: params 
  });
};

module.exports = {
  addUser: addUser
};
