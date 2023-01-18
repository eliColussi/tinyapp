const getUserByEmail = function (email, database) {
  for (const userID in database) {
    if (database[userID].email === email) {
      return database[userID];
    }
  }
  return null;
};

const getUrlsForUserID = function (userID, database) {
  const urlObj = {};

  for (const urlID in database) {
    if (database[urlID].userID === userID) {
      urlObj[urlID] = {
        longURL: database[urlID].longURL,
      }
    }
  }
  return urlObj;
};


const generateRandomString = function () {
  return Math.random().toString(36).slice(2);
};



module.exports = { getUserByEmail, generateRandomString, getUrlsForUserID }