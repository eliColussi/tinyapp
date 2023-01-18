const { assert } = require('chai');

const { getUserByEmail, getUrlsForUserID } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const testURLs = {
  "urlRandomID": {
    longURL: "http://example.com",
    userID: "userRandomID"
  },
  "url2RandomID": {
    longURL: "http://example2.com",
    userID: "userRandomID"
  },

}

describe('getUserByEmail', function () {
  it('should return a user with valid email', function () {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    const testUser = testUsers[expectedUserID];
    assert.deepEqual(user, testUser);
  })

  it('should return null for non-existent email', function () {
    const user = getUserByEmail("nonexistent@example.com", testUsers);
    assert.deepEqual(user, null);
  })
});

describe('getUrlsForUserID', function () {
  it('should return urls user has access to as an object for a valid user ID', function () {
    const urls = getUrlsForUserID("userRandomID", testURLs);
    const expectedUrls = {
      "urlRandomID": {
        longURL: "http://example.com"
      },
      "url2RandomID": {
        longURL: "http://example2.com"
      }
    }
    assert.deepEqual(urls, expectedUrls);
  });

  it('should return an empty object if userID is valid but there are no URLs belonging to user', function () {
    const urls = getUrlsForUserID("user2RandomID", testURLs);
    assert.deepEqual(urls, {});
  });

  it('should return an empty object for invalid user ID', function () {
    const urls = getUrlsForUserID("user3RandomID", testURLs);
    assert.deepEqual(urls, {});
  });
})