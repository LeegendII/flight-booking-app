const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-flight-booking-key-change-in-production';

// Generate Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, fullName: user.fullName },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register
exports.register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: true, message: 'All fields (email, password, fullName) are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: true, message: 'Email address already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        fullName,
        passwordHash: hashedPassword,
        role: 'USER',
      },
    });

    const token = generateToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: true, message: 'Server error during registration' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: true, message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: true, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: true, message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: true, message: 'Server error during authentication' });
  }
};

// Google Auth Simulation
exports.googleAuth = async (req, res) => {
  try {
    const { email, fullName, googleId, profilePic } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ error: true, message: 'Google authentication payload missing required fields' });
    }

    // Check by googleId or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ googleId }, { email }],
      },
    });

    if (!user) {
      // Create user
      user = await prisma.user.create({
        data: {
          email,
          fullName: fullName || email.split('@')[0],
          googleId,
          profilePic,
          role: 'USER',
        },
      });
    } else if (!user.googleId) {
      // Link Google Account to existing email account
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId, profilePic },
      });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profilePic: user.profilePic,
      },
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: true, message: 'Server error during Google authentication' });
  }
};

// Get profile
exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        profilePic: true,
        createdAt: true,
        passengers: true,
      },
    });
    if (!user) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: true, message: 'Server error fetching profile details' });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, profilePic } = req.body;
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (profilePic) updateData.profilePic = profilePic;

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
    });

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
      profilePic: updatedUser.profilePic,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: true, message: 'Server error updating profile details' });
  }
};

// Saved Passengers Management
exports.getSavedPassengers = async (req, res) => {
  try {
    const passengers = await prisma.savedPassenger.findMany({
      where: { userId: req.user.id },
    });
    res.json(passengers);
  } catch (error) {
    console.error('Get passengers error:', error);
    res.status(500).json({ error: true, message: 'Server error fetching saved passengers' });
  }
};

exports.addSavedPassenger = async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, passportNumber, gender, nationality } = req.body;

    if (!firstName || !lastName || !dateOfBirth) {
      return res.status(400).json({ error: true, message: 'First name, last name, and date of birth are required' });
    }

    const passenger = await prisma.savedPassenger.create({
      data: {
        userId: req.user.id,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
        passportNumber,
        gender,
        nationality,
      },
    });

    res.status(201).json(passenger);
  } catch (error) {
    console.error('Add passenger error:', error);
    res.status(500).json({ error: true, message: 'Server error adding passenger profile' });
  }
};

exports.deleteSavedPassenger = async (req, res) => {
  try {
    const { id } = req.params;

    const passenger = await prisma.savedPassenger.findUnique({ where: { id } });
    if (!passenger || passenger.userId !== req.user.id) {
      return res.status(404).json({ error: true, message: 'Passenger record not found' });
    }

    await prisma.savedPassenger.delete({ where: { id } });
    res.json({ success: true, message: 'Passenger profile deleted successfully' });
  } catch (error) {
    console.error('Delete passenger error:', error);
    res.status(500).json({ error: true, message: 'Server error removing passenger profile' });
  }
};
