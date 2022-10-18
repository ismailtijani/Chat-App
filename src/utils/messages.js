const generateMesaage = (username, textMessage) => {
  return {
    username,
    textMessage,
    createdAt: new Date().getTime(),
  };
};

const generateLocationMessage = (username, url) => {
  return {
    username,
    url,
    createdAt: new Date().getTime(),
  };
};

module.exports = { generateMesaage, generateLocationMessage };
