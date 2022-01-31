const getUserByEmail = function(email, users) {
  const validUsers = Object.values(users);
  for (const user of validUsers) {
    if (user.email === email) {
      return user;
    }
  } 
  return null;
}

module.exports = { getUserByEmail };