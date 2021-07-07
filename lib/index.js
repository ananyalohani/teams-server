module.exports = {
  url: {
    client:
      process.env.NODE_ENV === 'production'
        ? 'https://msft.lohani.dev'
        : 'http://localhost:3000',
    // : 'https://msft.lohani.dev',
  },
};
