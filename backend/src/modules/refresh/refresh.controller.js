const tokenService = require('../../services/token.service');

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    const user = await tokenService.verifyRefreshToken(refreshToken);
    const newAccessToken = tokenService.generateAccessToken(user);

    res.json({ token: newAccessToken });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const user = await tokenService.verifyRefreshToken(refreshToken);
      if (user) await tokenService.removeRefreshToken(user.id);
    }
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { refreshToken, logout };